<?php
/**
 * Persistência operacional — MySQL quando disponível; fallback JSON com lock único.
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/order_logic.php';
require_once __DIR__ . '/shipping_logic.php';

function verissimo_db_try(): ?PDO {
  try {
    return verissimo_db();
  } catch (Throwable $e) {
    return null;
  }
}

function verissimo_operational_db_ready(?PDO $pdo): bool {
  if (!$pdo instanceof PDO) return false;
  try {
    $stmt = $pdo->query("SELECT 1 FROM vp_meta WHERE k = 'schema_version' LIMIT 1");
    return $stmt !== false && $stmt->fetchColumn() !== false;
  } catch (Throwable $e) {
    return false;
  }
}

function verissimo_operational_lock_path(): string {
  return verissimo_data_dir() . '/operational.lock';
}

/** @return resource */
function verissimo_acquire_operational_lock(int $timeoutSec = 15) {
  $path = verissimo_operational_lock_path();
  $fp = fopen($path, 'c+');
  if ($fp === false) {
    verissimo_json(['ok' => false, 'error' => 'Falha de lock operacional'], 500);
  }
  $start = time();
  while (!flock($fp, LOCK_EX | LOCK_NB)) {
    if (time() - $start >= $timeoutSec) {
      fclose($fp);
      verissimo_json(['ok' => false, 'error' => 'Sistema ocupado. Tente novamente.'], 503);
    }
    usleep(100_000);
  }
  return $fp;
}

function verissimo_release_operational_lock($fp): void {
  if (is_resource($fp)) {
    flock($fp, LOCK_UN);
    fclose($fp);
  }
}

function verissimo_read_catalog_file(): array {
  $path = verissimo_catalog_path();
  if (!is_file($path)) {
    return ['products' => [], 'categories' => [], 'settings' => []];
  }
  $raw = file_get_contents($path);
  $data = json_decode($raw ?: '[]', true);
  if (!is_array($data)) {
    return ['products' => [], 'categories' => [], 'settings' => []];
  }
  if (array_is_list($data)) {
    return ['products' => $data, 'categories' => [], 'settings' => []];
  }
  return [
    'products' => $data['products'] ?? [],
    'categories' => $data['categories'] ?? [],
    'settings' => $data['settings'] ?? [],
    'updatedAt' => $data['updatedAt'] ?? null,
  ];
}

function verissimo_write_catalog_file(array $catalog): bool {
  $path = verissimo_catalog_path();
  $catalog['updatedAt'] = gmdate('c');
  $json = json_encode($catalog, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) return false;
  return file_put_contents($path, $json, LOCK_EX) !== false;
}

function verissimo_product_row_from_array(array $product): array {
  $id = (string) ($product['id'] ?? '');
  $stock = max(0, (int) ($product['stock'] ?? 0));
  $inStock = $stock > 0;
  $product['stock'] = $stock;
  $product['inStock'] = $inStock;
  return [
    'id' => $id,
    'stock' => $stock,
    'in_stock' => $inStock ? 1 : 0,
    'status' => (string) ($product['status'] ?? 'active'),
    'price_cents' => verissimo_product_unit_price_cents($product),
    'sale_price_cents' => isset($product['salePrice']) && $product['salePrice'] !== null && $product['salePrice'] !== ''
      ? verissimo_money_to_cents($product['salePrice'])
      : null,
    'product_json' => json_encode($product, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
  ];
}

function verissimo_sync_catalog_products_to_db(
  PDO $pdo,
  array $products,
  bool $preserveStockOnUpdate = false,
  bool $replaceProducts = false,
  bool $allowMassDelete = false
): array {
  if (!verissimo_operational_db_ready($pdo)) return $products;
  $pdo->beginTransaction();
  try {
    $ids = [];
    $syncedProducts = [];
    $lockStock = $pdo->prepare('SELECT stock, in_stock FROM vp_products WHERE id = ? FOR UPDATE');
    $onDuplicate = $preserveStockOnUpdate
      ? 'status = VALUES(status),
         price_cents = VALUES(price_cents),
         sale_price_cents = VALUES(sale_price_cents),
         product_json = VALUES(product_json)'
      : 'stock = VALUES(stock),
         in_stock = VALUES(in_stock),
         status = VALUES(status),
         price_cents = VALUES(price_cents),
         sale_price_cents = VALUES(sale_price_cents),
         product_json = VALUES(product_json)';
    $stmt = $pdo->prepare(
      'INSERT INTO vp_products (id, stock, in_stock, status, price_cents, sale_price_cents, product_json)
       VALUES (:id, :stock, :in_stock, :status, :price_cents, :sale_price_cents, :product_json)
       ON DUPLICATE KEY UPDATE ' . $onDuplicate
    );
    foreach ($products as $p) {
      if (!is_array($p) || empty($p['id'])) continue;
      $preservedInStock = null;
      if ($preserveStockOnUpdate) {
        $lockStock->execute([(string) $p['id']]);
        $existingStock = $lockStock->fetch(PDO::FETCH_ASSOC);
        if ($existingStock) {
          $p['stock'] = (int) $existingStock['stock'];
          $preservedInStock = (int) $existingStock['in_stock'];
          $p['inStock'] = $preservedInStock === 1;
        }
      }
      $row = verissimo_product_row_from_array($p);
      if ($preservedInStock !== null) {
        $row['in_stock'] = $preservedInStock;
        $p['inStock'] = $preservedInStock === 1;
        $row['product_json'] = json_encode($p, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      }
      $stmt->execute([
        ':id' => $row['id'],
        ':stock' => $row['stock'],
        ':in_stock' => $row['in_stock'],
        ':status' => $row['status'],
        ':price_cents' => $row['price_cents'],
        ':sale_price_cents' => $row['sale_price_cents'],
        ':product_json' => $row['product_json'],
      ]);
      $ids[] = $row['id'];
      $p['stock'] = $row['stock'];
      $p['inStock'] = $row['in_stock'] === 1;
      $syncedProducts[] = $p;
    }
    if ($replaceProducts) {
      $total = (int) $pdo->query('SELECT COUNT(*) FROM vp_products')->fetchColumn();
      if ($ids === []) {
        $selectRemoved = $pdo->query('SELECT * FROM vp_products');
        $removedRows = $selectRemoved->fetchAll(PDO::FETCH_ASSOC);
      } else {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $selectRemoved = $pdo->prepare('SELECT * FROM vp_products WHERE id NOT IN (' . $placeholders . ')');
        $selectRemoved->execute($ids);
        $removedRows = $selectRemoved->fetchAll(PDO::FETCH_ASSOC);
      }
      $removing = count($removedRows);
      // Proteção: uma lista vinda de um navegador defasado não pode apagar o catálogo.
      if ($removing > 0 && !$allowMassDelete && ($ids === [] || $removing * 10 > max(1, $total))) {
        throw new RuntimeException('Publicação removeria ' . $removing . ' de ' . $total . ' produtos. Exclusão em massa não confirmada.');
      }
      if ($removing > 0) {
        verissimo_backup_product_rows($removedRows);
      }
      if ($ids === []) {
        $pdo->exec('DELETE FROM vp_products');
      } else {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare('DELETE FROM vp_products WHERE id NOT IN (' . $placeholders . ')')->execute($ids);
      }
    }
    $pdo->commit();
    return $syncedProducts;
  } catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
  }
}

/** Grava as linhas de vp_products que serão removidas, antes do DELETE. Falha aborta a operação. */
function verissimo_backup_product_rows(array $rows): void {
  $dir = verissimo_data_dir() . '/backups';
  if (!is_dir($dir)) {
    mkdir($dir, 0700, true);
  }
  $path = $dir . '/vp_products-' . gmdate('YmdHis') . '-' . bin2hex(random_bytes(4)) . '.json';
  $json = json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if ($json === false || file_put_contents($path, $json, LOCK_EX) === false) {
    throw new RuntimeException('Falha ao gravar backup dos produtos removidos.');
  }
}

/** Carrega mapa id => produto (JSON decodificado + stock atualizado da linha). */
function verissimo_ensure_db_products_from_catalog(PDO $pdo): void {
  if (!verissimo_operational_db_ready($pdo)) return;
  try {
    $count = (int) $pdo->query('SELECT COUNT(*) FROM vp_products')->fetchColumn();
    if ($count > 0) return;
    $catalog = verissimo_read_catalog_file();
    $products = $catalog['products'] ?? [];
    if (is_array($products) && count($products) > 0) {
      verissimo_sync_catalog_products_to_db($pdo, $products, false);
    }
  } catch (Throwable $e) {
    /* fallback: pedido falhará com produto inválido se catálogo vazio */
  }
}

function verissimo_load_products_map(PDO $pdo): array {
  verissimo_ensure_db_products_from_catalog($pdo);
  $stmt = $pdo->query('SELECT id, stock, in_stock, status, price_cents, sale_price_cents, product_json FROM vp_products');
  $map = [];
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $product = json_decode((string) ($row['product_json'] ?? '{}'), true);
    if (!is_array($product)) $product = [];
    $product['id'] = (string) $row['id'];
    $product['stock'] = (int) $row['stock'];
    $product['inStock'] = (int) $row['in_stock'] === 1;
    $product['status'] = (string) $row['status'];
    $map[(string) $row['id']] = $product;
  }
  return $map;
}

function verissimo_read_orders_json(): array {
  $path = verissimo_orders_path();
  if (!is_file($path)) return [];
  $raw = file_get_contents($path);
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

function verissimo_write_orders_json(array $orders): bool {
  $path = verissimo_orders_path();
  $json = json_encode($orders, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if ($json === false) return false;
  return file_put_contents($path, $json, LOCK_EX) !== false;
}

function verissimo_list_orders(PDO $pdo): array {
  $stmt = $pdo->query('SELECT payload FROM vp_orders ORDER BY created_at DESC');
  $orders = [];
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $order = json_decode((string) ($row['payload'] ?? '{}'), true);
    if (is_array($order)) $orders[] = $order;
  }
  return $orders;
}

function verissimo_find_order_by_idempotency(PDO $pdo, string $key): ?array {
  if ($key === '') return null;
  $stmt = $pdo->prepare('SELECT payload FROM vp_orders WHERE idempotency_key = ? LIMIT 1');
  $stmt->execute([$key]);
  $raw = $stmt->fetchColumn();
  if ($raw === false) return null;
  $order = json_decode((string) $raw, true);
  return is_array($order) ? $order : null;
}

/**
 * Cria pedido com estoque atômico (DB ou JSON).
 *
 * @param array<int, array<string, mixed>> $itemsInput
 * @return array{ok: true, order: array}|array{ok: false, error: string, code?: int}
 */
function verissimo_create_order(array $body, array $itemsInput): array {
  $pdo = verissimo_db_try();
  $useDb = $pdo instanceof PDO && verissimo_operational_db_ready($pdo);

  $idempotencyKey = trim((string) ($body['idempotencyKey'] ?? $body['idempotency_key'] ?? ''));
  $shippingOptionId = trim((string) ($body['shippingOptionId'] ?? $body['shipping_option_id'] ?? ''));
  $claimedShippingCents = verissimo_money_to_cents($body['shipping'] ?? 0);
  $cepDigits = preg_replace('/\D+/', '', (string) ($body['cep'] ?? ''));
  $couponCode = (string) ($body['couponCode'] ?? '');

  if ($useDb) {
    return verissimo_create_order_db($pdo, $body, $itemsInput, $idempotencyKey, $shippingOptionId, $claimedShippingCents, $cepDigits, $couponCode);
  }

  return verissimo_create_order_json($body, $itemsInput, $idempotencyKey, $shippingOptionId, $claimedShippingCents, $cepDigits, $couponCode);
}

function verissimo_build_normalized_items(
  array $itemsInput,
  array $productsById,
  ?PDO $pdo,
  string $shippingOptionId,
  int $claimedShippingCents,
  string $cepDigits,
  string $couponCode
): array {
  $normalizedItems = [];
  $subtotalCents = 0;
  $deductions = [];

  foreach ($itemsInput as $item) {
    if (!is_array($item)) {
      return ['ok' => false, 'error' => 'Item inválido', 'code' => 400];
    }
    $productId = (string) ($item['productId'] ?? '');
    if ($productId === '' || !isset($productsById[$productId])) {
      return ['ok' => false, 'error' => 'Produto inválido no pedido', 'code' => 400];
    }
    $product = $productsById[$productId];
    $status = (string) ($product['status'] ?? 'active');
    $stock = (int) ($product['stock'] ?? 0);
    $inStock = !empty($product['inStock']) || $stock > 0;
    $qtyCheck = verissimo_validate_line_quantity($item['quantity'] ?? 1, $stock, $inStock, $status);
    if (!$qtyCheck['ok']) {
      $name = (string) ($product['name'] ?? 'Produto');
      return ['ok' => false, 'error' => $qtyCheck['error'] . ': ' . $name, 'code' => 400];
    }
    $qty = (int) $qtyCheck['qty'];
    $unitCents = verissimo_product_unit_price_cents($product);
    $subtotalCents += $unitCents * $qty;
    $sku = trim((string) ($product['sku'] ?? ($item['productSku'] ?? '')));
    $normalizedItems[] = [
      'productId' => $productId,
      'productName' => (string) ($product['name'] ?? 'Produto'),
      'productImage' => (string) (($product['images'][0] ?? '') ?: ($item['productImage'] ?? '')),
      'productSku' => $sku !== '' ? $sku : null,
      'quantity' => $qty,
      'unitPrice' => verissimo_cents_to_money($unitCents),
      'size' => isset($item['size']) ? (string) $item['size'] : null,
      'choices' => is_array($item['choices'] ?? null) ? $item['choices'] : null,
    ];
    $deductions[] = ['productId' => $productId, 'qty' => $qty];
  }

  if (count($normalizedItems) === 0) {
    return ['ok' => false, 'error' => 'Pedido sem itens válidos', 'code' => 400];
  }

  $totalQty = 0;
  foreach ($deductions as $d) {
    $totalQty += (int) ($d['qty'] ?? 0);
  }
  if ($totalQty < 1) $totalQty = 1;

  $shipCheck = verissimo_validate_shipping_for_order(
    $shippingOptionId,
    $subtotalCents,
    $cepDigits,
    $totalQty
  );
  if (!$shipCheck['ok']) {
    return ['ok' => false, 'error' => $shipCheck['error'] ?? 'Frete inválido', 'code' => 400];
  }
  $shippingCents = (int) $shipCheck['shipping_cents'];

  $coupon = verissimo_coupon_discount_cents($couponCode, $subtotalCents, $pdo);
  if (!$coupon['ok']) {
    return ['ok' => false, 'error' => $coupon['error'] ?? 'Cupom inválido', 'code' => 400];
  }
  $discountCents = (int) ($coupon['discount_cents'] ?? 0);
  $totalCents = max(0, $subtotalCents - $discountCents + $shippingCents);

  return [
    'ok' => true,
    'normalizedItems' => $normalizedItems,
    'subtotalCents' => $subtotalCents,
    'discountCents' => $discountCents,
    'shippingCents' => $shippingCents,
    'totalCents' => $totalCents,
    'deductions' => $deductions,
    'couponCode' => ($coupon['code'] ?? null) ?: (trim($couponCode) !== '' ? strtoupper(trim($couponCode)) : null),
  ];
}

function verissimo_assemble_order_array(array $body, array $built): array {
  $now = gmdate('c');
  $id = bin2hex(random_bytes(8));
  $orderNumber = 'VP-' . date('ymd') . '-' . strtoupper(substr($id, 0, 4));
  return [
    'id' => $id,
    'orderNumber' => $orderNumber,
    'customerId' => 'whatsapp',
    'customerName' => (string) ($body['customerName'] ?? 'Cliente WhatsApp'),
    'customerEmail' => (string) ($body['customerEmail'] ?? ''),
    'customerPhone' => (string) ($body['customerPhone'] ?? ''),
    'items' => $built['normalizedItems'],
    'subtotal' => verissimo_cents_to_money((int) $built['subtotalCents']),
    'discount' => verissimo_cents_to_money((int) $built['discountCents']),
    'shipping' => verissimo_cents_to_money((int) $built['shippingCents']),
    'total' => verissimo_cents_to_money((int) $built['totalCents']),
    'paymentMethod' => (string) ($body['paymentMethod'] ?? 'whatsapp'),
    'paymentStatus' => 'pendente',
    'status' => 'pagamento_pendente',
    'shippingAddress' => (string) ($body['shippingAddress'] ?? ''),
    'shippingLabel' => (string) ($body['shippingLabel'] ?? ''),
    'shippingOptionId' => (string) ($body['shippingOptionId'] ?? $body['shipping_option_id'] ?? ''),
    'cep' => (string) ($body['cep'] ?? ''),
    'couponCode' => $built['couponCode'] ?? null,
    'channel' => 'whatsapp',
    'stockDeducted' => !empty($built['stockDeducted']),
    'notes' => (string) ($body['notes'] ?? 'Pedido enviado via WhatsApp'),
    'createdAt' => $now,
    'updatedAt' => $now,
  ];
}

function verissimo_create_order_db(
  PDO $pdo,
  array $body,
  array $itemsInput,
  string $idempotencyKey,
  string $shippingOptionId,
  int $claimedShippingCents,
  string $cepDigits,
  string $couponCode
): array {
  $idemLock = null;
  try {
    if ($idempotencyKey !== '') {
      $idemLock = 'vp_idem_' . substr(hash('sha256', $idempotencyKey), 0, 32);
      $got = (int) $pdo->query("SELECT GET_LOCK(" . $pdo->quote($idemLock) . ", 15)")->fetchColumn();
      if ($got !== 1) {
        return ['ok' => false, 'error' => 'Sistema ocupado. Tente novamente.', 'code' => 503];
      }
      $existing = verissimo_find_order_by_idempotency($pdo, $idempotencyKey);
      if ($existing !== null) {
        $pdo->query("SELECT RELEASE_LOCK(" . $pdo->quote($idemLock) . ")");
        return ['ok' => true, 'order' => $existing];
      }
    }

    $pdo->beginTransaction();

    $productsById = verissimo_load_products_map($pdo);
    $built = verissimo_build_normalized_items(
      $itemsInput,
      $productsById,
      $pdo,
      $shippingOptionId,
      $claimedShippingCents,
      $cepDigits,
      $couponCode
    );
    if (!$built['ok']) {
      $pdo->rollBack();
      return ['ok' => false, 'error' => $built['error'], 'code' => $built['code'] ?? 400];
    }
    // Every newly created order reserves inventory, independently of payment method.
    $built['stockDeducted'] = true;
    $built['deductions'] = verissimo_aggregate_stock_deductions($built['deductions']);

    $lockRow = $pdo->prepare(
      'SELECT stock, status, product_json FROM vp_products WHERE id = ? FOR UPDATE'
    );
    $saveRow = $pdo->prepare(
      'UPDATE vp_products SET stock = ?, in_stock = ?, product_json = ? WHERE id = ? AND stock >= ?'
    );

    foreach ($built['deductions'] as $d) {
      $pid = (string) $d['productId'];
      $qty = (int) $d['qty'];
      $lockRow->execute([$pid]);
      $row = $lockRow->fetch(PDO::FETCH_ASSOC);
      if (!$row || (string) ($row['status'] ?? '') !== 'active') {
        $pdo->rollBack();
        return ['ok' => false, 'error' => 'Produto indisponível', 'code' => 409];
      }
      $stock = (int) ($row['stock'] ?? 0);
      if ($qty > $stock) {
        $pdo->rollBack();
        return ['ok' => false, 'error' => 'Estoque insuficiente', 'code' => 409];
      }
      $newStock = $stock - $qty;
      $product = json_decode((string) ($row['product_json'] ?? '{}'), true);
      if (!is_array($product)) $product = [];
      $product['stock'] = $newStock;
      $product['inStock'] = $newStock > 0;
      $json = json_encode($product, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      $saveRow->execute([$newStock, $newStock > 0 ? 1 : 0, $json, $pid, $qty]);
      if ($saveRow->rowCount() !== 1) {
        $pdo->rollBack();
        return ['ok' => false, 'error' => 'Estoque insuficiente ou produto indisponível', 'code' => 409];
      }
    }

    $order = verissimo_assemble_order_array($body, $built);
    $payload = json_encode($order, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare(
      'INSERT INTO vp_orders (id, order_number, payload, idempotency_key) VALUES (?, ?, ?, ?)'
    );
    try {
      $stmt->execute([
        $order['id'],
        $order['orderNumber'],
        $payload,
        $idempotencyKey !== '' ? $idempotencyKey : null,
      ]);
    } catch (\PDOException $e) {
      if ($idempotencyKey !== '' && (string) $e->getCode() === '23000') {
        $pdo->rollBack();
        $existing = verissimo_find_order_by_idempotency($pdo, $idempotencyKey);
        if ($existing !== null) {
          if ($idemLock !== null) {
            $pdo->query("SELECT RELEASE_LOCK(" . $pdo->quote($idemLock) . ")");
          }
          return ['ok' => true, 'order' => $existing];
        }
      }
      throw $e;
    }

    if (!empty($built['couponCode'])) {
      $pdo->prepare('UPDATE vp_coupons SET usage_count = usage_count + 1 WHERE code = ?')
        ->execute([$built['couponCode']]);
    }

    $pdo->commit();
    if ($idemLock !== null) {
      $pdo->query("SELECT RELEASE_LOCK(" . $pdo->quote($idemLock) . ")");
    }

    // Mantém catalog.json alinhado (best effort, fora da transação principal de estoque)
    try {
      $catalog = verissimo_read_catalog_file();
      $map = verissimo_load_products_map($pdo);
      $newProducts = [];
      foreach ($catalog['products'] as $p) {
        if (!is_array($p) || !isset($p['id'])) {
          $newProducts[] = $p;
          continue;
        }
        $pid = (string) $p['id'];
        $newProducts[] = $map[$pid] ?? $p;
      }
      $catalog['products'] = $newProducts;
      verissimo_write_catalog_file($catalog);
    } catch (Throwable $e) {
      /* vitrine eventual consistency */
    }

    return ['ok' => true, 'order' => $order];
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    if (isset($idemLock) && $idemLock !== null) {
      try {
        $pdo->query("SELECT RELEASE_LOCK(" . $pdo->quote($idemLock) . ")");
      } catch (Throwable $ignored) {
      }
    }
    return ['ok' => false, 'error' => 'Falha ao registrar pedido', 'code' => 500];
  }
}

function verissimo_create_order_json(
  array $body,
  array $itemsInput,
  string $idempotencyKey,
  string $shippingOptionId,
  int $claimedShippingCents,
  string $cepDigits,
  string $couponCode
): array {
  $lock = verissimo_acquire_operational_lock();
  try {
    $catalog = verissimo_read_catalog_file();
    $catalogSnapshot = json_decode(json_encode($catalog), true);
    $productsById = [];
    foreach ($catalog['products'] as $p) {
      if (is_array($p) && isset($p['id'])) {
        $productsById[(string) $p['id']] = $p;
      }
    }

    $orders = verissimo_read_orders_json();
    if ($idempotencyKey !== '') {
      foreach ($orders as $o) {
        if (($o['idempotencyKey'] ?? '') === $idempotencyKey) {
          verissimo_release_operational_lock($lock);
          return ['ok' => true, 'order' => $o];
        }
      }
    }

    $built = verissimo_build_normalized_items(
      $itemsInput,
      $productsById,
      null,
      $shippingOptionId,
      $claimedShippingCents,
      $cepDigits,
      $couponCode
    );
    if (!$built['ok']) {
      verissimo_release_operational_lock($lock);
      return ['ok' => false, 'error' => $built['error'], 'code' => $built['code'] ?? 400];
    }
    // Every newly created order reserves inventory, independently of payment method.
    $built['stockDeducted'] = true;
    $built['deductions'] = verissimo_aggregate_stock_deductions($built['deductions']);

    foreach ($built['deductions'] as $d) {
      $pid = (string) $d['productId'];
      $qty = (int) $d['qty'];
      $stock = (int) ($productsById[$pid]['stock'] ?? 0);
      if ($qty > $stock) {
        verissimo_release_operational_lock($lock);
        return ['ok' => false, 'error' => 'Estoque insuficiente', 'code' => 409];
      }
      $productsById[$pid]['stock'] = $stock - $qty;
      $productsById[$pid]['inStock'] = $productsById[$pid]['stock'] > 0;
    }

    $order = verissimo_assemble_order_array($body, $built);
    if ($idempotencyKey !== '') {
      $order['idempotencyKey'] = $idempotencyKey;
    }

    $newProducts = [];
    foreach ($catalog['products'] as $p) {
      if (!is_array($p) || !isset($p['id'])) {
        $newProducts[] = $p;
        continue;
      }
      $pid = (string) $p['id'];
      $newProducts[] = $productsById[$pid] ?? $p;
    }
    $catalog['products'] = $newProducts;

    if (!verissimo_write_catalog_file($catalog)) {
      verissimo_release_operational_lock($lock);
      return ['ok' => false, 'error' => 'Falha ao atualizar estoque', 'code' => 500];
    }

    array_unshift($orders, $order);
    if (!verissimo_write_orders_json($orders)) {
      if (is_array($catalogSnapshot)) {
        verissimo_write_catalog_file($catalogSnapshot);
      }
      verissimo_release_operational_lock($lock);
      return ['ok' => false, 'error' => 'Falha ao gravar pedido', 'code' => 500];
    }

    verissimo_release_operational_lock($lock);
    return ['ok' => true, 'order' => $order];
  } catch (Throwable $e) {
    verissimo_release_operational_lock($lock);
    return ['ok' => false, 'error' => 'Falha ao registrar pedido', 'code' => 500];
  }
}

function verissimo_update_order_json(string $id, array $body): array {
  $lock = verissimo_acquire_operational_lock();
  try {
    $catalog = verissimo_read_catalog_file();
    $catalogSnapshot = json_decode(json_encode($catalog), true);
    $orders = verissimo_read_orders_json();
    $found = false;
    $updated = null;
    $shouldRestore = false;
    foreach ($orders as &$o) {
      if (($o['id'] ?? '') !== $id) continue;
      $wasCancelled = ($o['status'] ?? '') === 'cancelado';
      $willCancel = array_key_exists('status', $body) && (string) $body['status'] === 'cancelado';
      $shouldReserve = $wasCancelled && array_key_exists('status', $body) && !$willCancel
        && !(bool) ($o['stockDeducted'] ?? true);
      $shouldRestore = $willCancel && !$wasCancelled && (bool) ($o['stockDeducted'] ?? true) && empty($o['stockRestored']);
      if ($shouldReserve) {
        $productsById = [];
        foreach (($catalog['products'] ?? []) as $product) {
          if (is_array($product) && isset($product['id'])) $productsById[(string) $product['id']] = $product;
        }
        foreach (verissimo_order_stock_quantities($o) as $productId => $quantity) {
          if (!isset($productsById[$productId])) {
            unset($o);
            return ['ok' => false, 'error' => 'Produto do pedido nao encontrado para reservar estoque', 'code' => 409];
          }
          if ((string) ($productsById[$productId]['status'] ?? 'active') !== 'active') {
            unset($o);
            return ['ok' => false, 'error' => 'Produto indisponivel para reabrir pedido', 'code' => 409];
          }
          $available = max(0, (int) ($productsById[$productId]['stock'] ?? 0));
          if ($quantity > $available) {
            unset($o);
            return ['ok' => false, 'error' => 'Estoque insuficiente para reabrir pedido', 'code' => 409];
          }
          $productsById[$productId]['stock'] = $available - $quantity;
          $productsById[$productId]['inStock'] = $productsById[$productId]['stock'] > 0;
        }
        $catalog['products'] = array_map(static function ($product) use ($productsById) {
          return is_array($product) && isset($product['id']) ? ($productsById[(string) $product['id']] ?? $product) : $product;
        }, $catalog['products'] ?? []);
        $o['stockDeducted'] = true;
        $o['stockRestored'] = false;
      }
      if ($shouldRestore) {
        $productsById = [];
        foreach (($catalog['products'] ?? []) as $product) {
          if (is_array($product) && isset($product['id'])) $productsById[(string) $product['id']] = $product;
        }
        foreach (verissimo_order_stock_quantities($o) as $productId => $quantity) {
          if (!isset($productsById[$productId])) {
            unset($o);
            return ['ok' => false, 'error' => 'Produto do pedido nao encontrado para restaurar estoque', 'code' => 409];
          }
          $productsById[$productId]['stock'] = max(0, (int) ($productsById[$productId]['stock'] ?? 0)) + $quantity;
          $productsById[$productId]['inStock'] = $productsById[$productId]['stock'] > 0;
        }
        $catalog['products'] = array_map(static function ($product) use ($productsById) {
          return is_array($product) && isset($product['id']) ? ($productsById[(string) $product['id']] ?? $product) : $product;
        }, $catalog['products'] ?? []);
        $o['stockDeducted'] = false;
        $o['stockRestored'] = true;
      }
      $stringFields = ['customerName', 'customerEmail', 'customerPhone', 'shippingAddress', 'shippingLabel', 'cep', 'notes', 'status', 'paymentStatus', 'paymentMethod'];
      foreach ($stringFields as $field) if (array_key_exists($field, $body)) $o[$field] = (string) $body[$field];
      if (($o['status'] ?? '') === 'pago') $o['paymentStatus'] = 'pago';
      $o['updatedAt'] = gmdate('c');
      $found = true;
      $updated = $o;
      break;
    }
    unset($o);
    if (!$found) return ['ok' => false, 'error' => 'Pedido nao encontrado', 'code' => 404];
    if (($shouldRestore || $shouldReserve) && !verissimo_write_catalog_file($catalog)) return ['ok' => false, 'error' => 'Falha ao atualizar estoque', 'code' => 500];
    if (!verissimo_write_orders_json($orders)) {
      if (($shouldRestore || $shouldReserve) && is_array($catalogSnapshot)) verissimo_write_catalog_file($catalogSnapshot);
      return ['ok' => false, 'error' => 'Falha ao gravar pedido', 'code' => 500];
    }
    return ['ok' => true, 'order' => $updated];
  } catch (Throwable $e) {
    return ['ok' => false, 'error' => 'Falha ao atualizar pedido', 'code' => 500];
  } finally {
    verissimo_release_operational_lock($lock);
  }
}

function verissimo_update_order_db(PDO $pdo, string $id, array $body): array {
  try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT payload FROM vp_orders WHERE id = ? FOR UPDATE');
    $stmt->execute([$id]);
    $raw = $stmt->fetchColumn();
    if ($raw === false) { $pdo->rollBack(); return ['ok' => false, 'error' => 'Pedido nao encontrado', 'code' => 404]; }
    $o = json_decode((string) $raw, true);
    if (!is_array($o)) { $pdo->rollBack(); return ['ok' => false, 'error' => 'Pedido corrompido', 'code' => 500]; }
    $wasCancelled = ($o['status'] ?? '') === 'cancelado';
    $willCancel = array_key_exists('status', $body) && (string) $body['status'] === 'cancelado';
    $shouldReserve = $wasCancelled && array_key_exists('status', $body) && !$willCancel
      && !(bool) ($o['stockDeducted'] ?? true);
    $shouldRestore = $willCancel && !$wasCancelled && (bool) ($o['stockDeducted'] ?? true) && empty($o['stockRestored']);
    if ($shouldReserve) {
      $quantities = verissimo_order_stock_quantities($o);
      ksort($quantities, SORT_STRING);
      $lockProduct = $pdo->prepare('SELECT stock, status, product_json FROM vp_products WHERE id = ? FOR UPDATE');
      $saveProduct = $pdo->prepare('UPDATE vp_products SET stock = ?, in_stock = ?, product_json = ? WHERE id = ? AND stock >= ?');
      foreach ($quantities as $productId => $quantity) {
        $lockProduct->execute([$productId]);
        $row = $lockProduct->fetch(PDO::FETCH_ASSOC);
        if (!$row) { $pdo->rollBack(); return ['ok' => false, 'error' => 'Produto do pedido nao encontrado para reservar estoque', 'code' => 409]; }
        if ((string) ($row['status'] ?? '') !== 'active') { $pdo->rollBack(); return ['ok' => false, 'error' => 'Produto indisponivel para reabrir pedido', 'code' => 409]; }
        $stock = max(0, (int) ($row['stock'] ?? 0));
        if ($quantity > $stock) { $pdo->rollBack(); return ['ok' => false, 'error' => 'Estoque insuficiente para reabrir pedido', 'code' => 409]; }
        $product = json_decode((string) ($row['product_json'] ?? '{}'), true);
        if (!is_array($product)) $product = [];
        $newStock = $stock - $quantity;
        $product['stock'] = $newStock;
        $product['inStock'] = $newStock > 0;
        $saveProduct->execute([$newStock, $newStock > 0 ? 1 : 0, json_encode($product, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $productId, $quantity]);
        if ($saveProduct->rowCount() !== 1) { $pdo->rollBack(); return ['ok' => false, 'error' => 'Estoque insuficiente para reabrir pedido', 'code' => 409]; }
      }
      $o['stockDeducted'] = true;
      $o['stockRestored'] = false;
    }
    if ($shouldRestore) {
      $quantities = verissimo_order_stock_quantities($o);
      ksort($quantities, SORT_STRING);
      $lockProduct = $pdo->prepare('SELECT stock, product_json FROM vp_products WHERE id = ? FOR UPDATE');
      $saveProduct = $pdo->prepare('UPDATE vp_products SET stock = ?, in_stock = ?, product_json = ? WHERE id = ?');
      foreach ($quantities as $productId => $quantity) {
        $lockProduct->execute([$productId]);
        $row = $lockProduct->fetch(PDO::FETCH_ASSOC);
        if (!$row) { $pdo->rollBack(); return ['ok' => false, 'error' => 'Produto do pedido nao encontrado para restaurar estoque', 'code' => 409]; }
        $product = json_decode((string) ($row['product_json'] ?? '{}'), true);
        if (!is_array($product)) $product = [];
        $newStock = max(0, (int) ($row['stock'] ?? 0)) + $quantity;
        $product['stock'] = $newStock;
        $product['inStock'] = $newStock > 0;
        $saveProduct->execute([$newStock, $newStock > 0 ? 1 : 0, json_encode($product, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $productId]);
      }
      $o['stockDeducted'] = false;
      $o['stockRestored'] = true;
    }
    $stringFields = ['customerName', 'customerEmail', 'customerPhone', 'shippingAddress', 'shippingLabel', 'cep', 'notes', 'status', 'paymentStatus', 'paymentMethod'];
    foreach ($stringFields as $field) if (array_key_exists($field, $body)) $o[$field] = (string) $body[$field];
    if (($o['status'] ?? '') === 'pago') $o['paymentStatus'] = 'pago';
    $o['updatedAt'] = gmdate('c');
    $payload = json_encode($o, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $pdo->prepare('UPDATE vp_orders SET payload = ? WHERE id = ?')->execute([$payload, $id]);
    $pdo->commit();
    if ($shouldRestore || $shouldReserve) verissimo_sync_catalog_file_from_db($pdo);
    return ['ok' => true, 'order' => $o];
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    return ['ok' => false, 'error' => 'Falha ao atualizar pedido', 'code' => 500];
  }
}

/** @return array<string, int> */
function verissimo_order_stock_quantities(array $order): array {
  $quantities = [];
  foreach (($order['items'] ?? []) as $item) {
    if (!is_array($item)) continue;
    $productId = (string) ($item['productId'] ?? '');
    $quantity = max(0, (int) ($item['quantity'] ?? 0));
    if ($productId !== '' && $quantity > 0) $quantities[$productId] = ($quantities[$productId] ?? 0) + $quantity;
  }
  return $quantities;
}

/** @return array<int, array{productId: string, qty: int}> */
function verissimo_aggregate_stock_deductions(array $deductions): array {
  $quantities = [];
  foreach ($deductions as $item) {
    if (!is_array($item)) continue;
    $productId = (string) ($item['productId'] ?? '');
    $quantity = max(0, (int) ($item['qty'] ?? 0));
    if ($productId !== '' && $quantity > 0) $quantities[$productId] = ($quantities[$productId] ?? 0) + $quantity;
  }
  ksort($quantities, SORT_STRING);
  $deductions = [];
  foreach ($quantities as $productId => $quantity) $deductions[] = ['productId' => (string) $productId, 'qty' => $quantity];
  return $deductions;
}

function verissimo_sync_catalog_file_from_db(PDO $pdo): void {
  $lock = verissimo_acquire_operational_lock();
  try {
    $catalog = verissimo_read_catalog_file();
    $map = verissimo_load_products_map($pdo);
    $catalog['products'] = array_map(static function ($product) use ($map) {
      return is_array($product) && isset($product['id']) ? ($map[(string) $product['id']] ?? $product) : $product;
    }, $catalog['products'] ?? []);
    verissimo_write_catalog_file($catalog);
  } catch (Throwable $ignored) {
    // The JSON catalog is a projection; MySQL remains the transactional source.
  } finally {
    verissimo_release_operational_lock($lock);
  }
}
