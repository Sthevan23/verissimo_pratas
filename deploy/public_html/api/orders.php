<?php
/**
 * Pedidos da loja
 * GET  → lista (requer sessão admin)
 * POST → cria pedido (público) — preços/estoque validados no servidor
 * PUT  → atualiza (requer sessão admin)
 */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/operational_store.php';
verissimo_api_headers();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  verissimo_require_write_token();
  $pdo = verissimo_db_try();
  if ($pdo instanceof PDO && verissimo_operational_db_ready($pdo)) {
    $orders = verissimo_list_orders($pdo);
  } else {
    $lock = verissimo_acquire_operational_lock();
    $orders = verissimo_read_orders_json();
    verissimo_release_operational_lock($lock);
  }
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

  $shippingOptionId = trim((string) ($body['shippingOptionId'] ?? $body['shipping_option_id'] ?? ''));
  if ($shippingOptionId === '') {
    verissimo_json(['ok' => false, 'error' => 'Informe a opção de frete (shippingOptionId)'], 400);
  }

  $result = verissimo_create_order($body, $items);
  if (!$result['ok']) {
    verissimo_json(['ok' => false, 'error' => $result['error'] ?? 'Pedido recusado'], (int) ($result['code'] ?? 400));
  }
  verissimo_json(['ok' => true, 'order' => $result['order']]);
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

  $pdo = verissimo_db_try();
  if ($pdo instanceof PDO && verissimo_operational_db_ready($pdo)) {
    $result = verissimo_update_order_db($pdo, $id, $body);
  } else {
    $result = verissimo_update_order_json($id, $body);
  }
  if (!$result['ok']) {
    verissimo_json(['ok' => false, 'error' => $result['error'] ?? 'Erro'], (int) ($result['code'] ?? 400));
  }
  verissimo_json(['ok' => true, 'order' => $result['order']]);
}

verissimo_json(['ok' => false, 'error' => 'Método não suportado'], 405);
