<?php
/**
 * Pedidos da loja
 * GET  → lista (requer sessão admin)
 * POST → cria pedido (público) — valida preço/estoque no catálogo
 * PUT  → atualiza (requer sessão admin)
 */
require_once __DIR__ . '/helpers.php';
verissimo_api_headers();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = verissimo_orders_path();

function verissimo_read_orders_locked($fp): array {
  $raw = stream_get_contents($fp);
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

function verissimo_write_orders_locked($fp, array $orders): void {
  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode($orders, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
  fflush($fp);
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

function verissimo_product_unit_price(array $product): float {
  if (isset($product['salePrice']) && $product['salePrice'] !== null && $product['salePrice'] !== '') {
    $sale = (float) $product['salePrice'];
    if ($sale > 0) return $sale;
  }
  return (float) ($product['price'] ?? 0);
}

if ($method === 'GET') {
  verissimo_require_write_token();
  $fp = fopen($path, 'c+');
  if ($fp === false) {
    verissimo_json(['ok' => false, 'error' => 'Falha ao ler pedidos'], 500);
  }
  flock($fp, LOCK_SH);
  $orders = verissimo_read_orders_locked($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  usort($orders, static function ($a, $b) {
    return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
  });
  verissimo_json(['ok' => true, 'orders' => $orders]);
}

if ($method === 'POST') {
  verissimo_rate_limit('orders_post', 30, 600);

  $raw = file_get_contents('php://input');
  $body = json_decode($raw ?: '{}', true);
  if (!is_array($body)) {
    verissimo_json(['ok' => false, 'error' => 'JSON inválido'], 400);
  }

  $items = $body['items'] ?? null;
  if (!is_array($items) || count($items) === 0) {
    verissimo_json(['ok' => false, 'error' => 'Pedido sem itens'], 400);
  }

  $catalog = verissimo_read_catalog_file();
  $productsById = [];
  foreach ($catalog['products'] as $p) {
    if (is_array($p) && isset($p['id'])) {
      $productsById[(string) $p['id']] = $p;
    }
  }

  $normalizedItems = [];
  $subtotal = 0.0;

  foreach ($items as $item) {
    if (!is_array($item)) continue;
    $productId = (string) ($item['productId'] ?? '');
    if ($productId === '' || !isset($productsById[$productId])) {
      verissimo_json(['ok' => false, 'error' => 'Produto inválido no pedido'], 400);
    }
    $product = $productsById[$productId];
    $status = (string) ($product['status'] ?? 'active');
    if ($status !== 'active') {
      verissimo_json(['ok' => false, 'error' => 'Produto indisponível: ' . ($product['name'] ?? '')], 400);
    }
    $qty = max(1, (int) ($item['quantity'] ?? 1));
    $stock = (int) ($product['stock'] ?? 0);
    $inStock = !empty($product['inStock']) || $stock > 0;
    if (!$inStock || $stock <= 0) {
      verissimo_json(['ok' => false, 'error' => 'Produto esgotado: ' . ($product['name'] ?? '')], 400);
    }

    $unitPrice = verissimo_product_unit_price($product);
    $subtotal += $unitPrice * $qty;
    $normalizedItems[] = [
      'productId' => $productId,
      'productName' => (string) ($product['name'] ?? 'Produto'),
      'productImage' => (string) (($product['images'][0] ?? '') ?: ($item['productImage'] ?? '')),
      'quantity' => $qty,
      'unitPrice' => round($unitPrice, 2),
      'size' => isset($item['size']) ? (string) $item['size'] : null,
      'choices' => is_array($item['choices'] ?? null) ? $item['choices'] : null,
    ];

    // Baixa estoque (não bloqueia se qtd > stock marcado — estoque 1 costuma ser "disponível")
    $productsById[$productId]['stock'] = max(0, $stock - $qty);
    $productsById[$productId]['inStock'] = $productsById[$productId]['stock'] > 0;
  }

  if (count($normalizedItems) === 0) {
    verissimo_json(['ok' => false, 'error' => 'Pedido sem itens válidos'], 400);
  }

  $discount = max(0, (float) ($body['discount'] ?? 0));
  if ($discount > $subtotal) {
    $discount = $subtotal;
  }
  $shipping = max(0, (float) ($body['shipping'] ?? 0));
  $total = round($subtotal - $discount + $shipping, 2);

  $now = gmdate('c');
  $id = bin2hex(random_bytes(8));
  $orderNumber = 'VP-' . date('ymd') . '-' . strtoupper(substr($id, 0, 4));

  $order = [
    'id' => $id,
    'orderNumber' => $orderNumber,
    'customerId' => 'whatsapp',
    'customerName' => (string) ($body['customerName'] ?? 'Cliente WhatsApp'),
    'customerEmail' => (string) ($body['customerEmail'] ?? ''),
    'customerPhone' => (string) ($body['customerPhone'] ?? ''),
    'items' => $normalizedItems,
    'subtotal' => round($subtotal, 2),
    'discount' => round($discount, 2),
    'shipping' => round($shipping, 2),
    'total' => $total,
    'paymentMethod' => (string) ($body['paymentMethod'] ?? 'whatsapp'),
    'paymentStatus' => 'pendente',
    'status' => 'pagamento_pendente',
    'shippingAddress' => (string) ($body['shippingAddress'] ?? ''),
    'shippingLabel' => (string) ($body['shippingLabel'] ?? ''),
    'cep' => (string) ($body['cep'] ?? ''),
    'couponCode' => isset($body['couponCode']) ? (string) $body['couponCode'] : null,
    'channel' => 'whatsapp',
    'notes' => (string) ($body['notes'] ?? 'Pedido enviado via WhatsApp'),
    'createdAt' => $now,
    'updatedAt' => $now,
  ];

  // Persiste estoque no catálogo
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
    verissimo_json(['ok' => false, 'error' => 'Falha ao atualizar estoque'], 500);
  }

  if (!is_file($path)) {
    touch($path);
  }
  $fp = fopen($path, 'c+');
  if ($fp === false) {
    verissimo_json(['ok' => false, 'error' => 'Falha ao gravar pedido'], 500);
  }
  flock($fp, LOCK_EX);
  $orders = verissimo_read_orders_locked($fp);
  array_unshift($orders, $order);
  verissimo_write_orders_locked($fp, $orders);
  flock($fp, LOCK_UN);
  fclose($fp);

  verissimo_json(['ok' => true, 'order' => $order]);
}

if ($method === 'PUT' || $method === 'PATCH') {
  verissimo_require_write_token();
  $raw = file_get_contents('php://input');
  $body = json_decode($raw ?: '{}', true);
  if (!is_array($body)) {
    verissimo_json(['ok' => false, 'error' => 'JSON inválido'], 400);
  }
  $id = (string) ($body['id'] ?? '');
  if ($id === '') {
    verissimo_json(['ok' => false, 'error' => 'id obrigatório'], 400);
  }

  if (!is_file($path)) {
    touch($path);
  }
  $fp = fopen($path, 'c+');
  if ($fp === false) {
    verissimo_json(['ok' => false, 'error' => 'Falha ao gravar pedido'], 500);
  }
  flock($fp, LOCK_EX);
  $orders = verissimo_read_orders_locked($fp);
  $found = false;
  $updated = null;
  foreach ($orders as &$o) {
    if (($o['id'] ?? '') !== $id) {
      continue;
    }

    $stringFields = [
      'customerName',
      'customerEmail',
      'customerPhone',
      'shippingAddress',
      'shippingLabel',
      'cep',
      'notes',
      'status',
      'paymentStatus',
      'paymentMethod',
    ];
    foreach ($stringFields as $field) {
      if (array_key_exists($field, $body)) {
        $o[$field] = (string) $body[$field];
      }
    }

    foreach (['subtotal', 'discount', 'shipping', 'total'] as $field) {
      if (array_key_exists($field, $body)) {
        $o[$field] = (float) $body[$field];
      }
    }

    if (isset($body['couponCode'])) {
      $o['couponCode'] = $body['couponCode'] === null || $body['couponCode'] === ''
        ? null
        : (string) $body['couponCode'];
    }

    if (($o['status'] ?? '') === 'pago') {
      $o['paymentStatus'] = 'pago';
    }
    if (($o['status'] ?? '') === 'cancelado') {
      $o['paymentStatus'] = $o['paymentStatus'] ?? 'pendente';
    }

    if (
      (array_key_exists('subtotal', $body) || array_key_exists('discount', $body) || array_key_exists('shipping', $body))
      && !array_key_exists('total', $body)
    ) {
      $o['total'] = max(
        0,
        (float) ($o['subtotal'] ?? 0) - (float) ($o['discount'] ?? 0) + (float) ($o['shipping'] ?? 0)
      );
    }

    $o['updatedAt'] = gmdate('c');
    $found = true;
    $updated = $o;
    break;
  }
  unset($o);

  if (!$found) {
    flock($fp, LOCK_UN);
    fclose($fp);
    verissimo_json(['ok' => false, 'error' => 'Pedido não encontrado'], 404);
  }
  verissimo_write_orders_locked($fp, $orders);
  flock($fp, LOCK_UN);
  fclose($fp);
  verissimo_json(['ok' => true, 'order' => $updated]);
}

verissimo_json(['ok' => false, 'error' => 'Método não suportado'], 405);
