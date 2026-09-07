<?php
/**
 * Pedidos da loja
 * GET  → lista (requer X-Verissimo-Token)
 * POST → cria pedido (público, vitrine)
 */
require_once __DIR__ . '/helpers.php';
verissimo_api_headers();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = verissimo_orders_path();

function verissimo_orders_path(): string {
  $dir = __DIR__ . '/data';
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  return $dir . '/orders.json';
}

function verissimo_read_orders(string $path): array {
  if (!is_file($path)) {
    return [];
  }
  $raw = file_get_contents($path);
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

function verissimo_write_orders(string $path, array $orders): void {
  file_put_contents(
    $path,
    json_encode($orders, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)
  );
}

if ($method === 'GET') {
  verissimo_require_write_token();
  $orders = verissimo_read_orders($path);
  usort($orders, static function ($a, $b) {
    return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
  });
  verissimo_json(['ok' => true, 'orders' => $orders]);
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input');
  $body = json_decode($raw ?: '{}', true);
  if (!is_array($body)) {
    verissimo_json(['ok' => false, 'error' => 'JSON inválido'], 400);
  }

  $items = $body['items'] ?? null;
  if (!is_array($items) || count($items) === 0) {
    verissimo_json(['ok' => false, 'error' => 'Pedido sem itens'], 400);
  }

  $normalizedItems = [];
  foreach ($items as $item) {
    if (!is_array($item)) continue;
    $normalizedItems[] = [
      'productId' => (string) ($item['productId'] ?? ''),
      'productName' => (string) ($item['productName'] ?? 'Produto'),
      'productImage' => (string) ($item['productImage'] ?? ''),
      'quantity' => max(1, (int) ($item['quantity'] ?? 1)),
      'unitPrice' => (float) ($item['unitPrice'] ?? 0),
      'size' => isset($item['size']) ? (string) $item['size'] : null,
      'choices' => is_array($item['choices'] ?? null) ? $item['choices'] : null,
    ];
  }
  if (count($normalizedItems) === 0) {
    verissimo_json(['ok' => false, 'error' => 'Pedido sem itens válidos'], 400);
  }

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
    'subtotal' => (float) ($body['subtotal'] ?? 0),
    'discount' => (float) ($body['discount'] ?? 0),
    'shipping' => (float) ($body['shipping'] ?? 0),
    'total' => (float) ($body['total'] ?? 0),
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

  $orders = verissimo_read_orders($path);
  array_unshift($orders, $order);
  verissimo_write_orders($path, $orders);

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

  $orders = verissimo_read_orders($path);
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

    // Recalcula total se subtotal/desconto/frete vieram sem total explícito
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
    verissimo_json(['ok' => false, 'error' => 'Pedido não encontrado'], 404);
  }
  verissimo_write_orders($path, $orders);
  verissimo_json(['ok' => true, 'order' => $updated]);
}

verissimo_json(['ok' => false, 'error' => 'Método não suportado'], 405);
