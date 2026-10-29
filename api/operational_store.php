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
  $inStock = !empty($product['inStock']) || $stock > 0;
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

function verissimo_sync_catalog_products_to_db(PDO $pdo, array $products, bool $preserveStockOnUpdate = false): void {
  if (!verissimo_operational_db_ready($pdo)) return;
  $pdo->beginTransaction();
  try {
    $ids = [];
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
      $row = verissimo_product_row_from_array($p);
      $stmt->execute([
        ':id' => $row['id'],
        ':stock' => $row['stock'],
        ':in_stock' => $row['in_stock'],
        ':status' => $row['status'],
        ':price_cents' => verissimo_money_to_cents($p['price'] ?? 0),
        ':sale_price_cents' => $row['sale_price_cents'],
        ':product_json' => $row['product_json'],
      ]);
      $ids[] = $row['id'];
    }
    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
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
  $orders = verissimo_read_orders_json();
  $found = false;
  $updated = null;
  foreach ($orders as &$o) {
    if (($o['id'] ?? '') !== $id) continue;
    $stringFields = [
      'customerName', 'customerEmail', 'customerPhone', 'shippingAddress',
      'shippingLabel', 'cep', 'notes', 'status', 'paymentStatus', 'paymentMethod',
    ];
    foreach ($stringFields as $field) {
      if (array_key_exists($field, $body)) {
        $o[$field] = (string) $body[$field];
      }
    }
    if (($o['status'] ?? '') === 'pago') {
      $o['paymentStatus'] = 'pago';
    }
    $o['updatedAt'] = gmdate('c');
    $found = true;
    $updated = $o;
    break;
  }
  unset($o);
  if (!$found) {
    verissimo_release_operational_lock($lock);
    return ['ok' => false, 'error' => 'Pedido não encontrado', 'code' => 404];
  }
  verissimo_write_orders_json($orders);
  verissimo_release_operational_lock($lock);
  return ['ok' => true, 'order' => $updated];
}

function verissimo_update_order_db(PDO $pdo, string $id, array $body): array {
  $stmt = $pdo->prepare('SELECT payload FROM vp_orders WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $raw = $stmt->fetchColumn();
  if ($raw === false) {
    return ['ok' => false, 'error' => 'Pedido não encontrado', 'code' => 404];
  }
  $o = json_decode((string) $raw, true);
  if (!is_array($o)) {
    return ['ok' => false, 'error' => 'Pedido corrompido', 'code' => 500];
  }
  $stringFields = [
    'customerName', 'customerEmail', 'customerPhone', 'shippingAddress',
    'shippingLabel', 'cep', 'notes', 'status', 'paymentStatus', 'paymentMethod',
  ];
  foreach ($stringFields as $field) {
    if (array_key_exists($field, $body)) {
      $o[$field] = (string) $body[$field];
    }
  }
  if (($o['status'] ?? '') === 'pago') {
    $o['paymentStatus'] = 'pago';
  }
  $o['updatedAt'] = gmdate('c');
  $payload = json_encode($o, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $pdo->prepare('UPDATE vp_orders SET payload = ? WHERE id = ?')->execute([$payload, $id]);
  return ['ok' => true, 'order' => $o];
}

