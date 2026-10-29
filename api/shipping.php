<?php
/**
 * Cotação de frete via SuperFrete (PAC / SEDEX / Mini Envios — Correios).
 * POST JSON: { "cep": "37170-000", "subtotal": 289, "items": [{ "quantity": 1 }] }
 */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/shipping_logic.php';
verissimo_api_headers();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  verissimo_json(['ok' => false, 'error' => 'Use POST'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '{}', true);
if (!is_array($body)) {
  verissimo_json(['ok' => false, 'error' => 'JSON inválido'], 400);
}

$cep = preg_replace('/\D+/', '', (string) ($body['cep'] ?? ''));
if (strlen($cep) !== 8) {
  verissimo_json(['ok' => false, 'error' => 'Informe um CEP válido com 8 dígitos'], 400);
}

$subtotal = (float) ($body['subtotal'] ?? 0);
$items = $body['items'] ?? [];
if (!is_array($items) || count($items) === 0) {
  $items = [['quantity' => 1]];
}

$totalQty = 0;
foreach ($items as $item) {
  $totalQty += max(1, (int) ($item['quantity'] ?? 1));
}

$built = verissimo_build_shipping_options($cep, $subtotal, $totalQty);
$cfg = verissimo_cfg();
$originCep = preg_replace('/\D+/', '', (string) ($cfg['origin_cep'] ?? '37170000'));

verissimo_json([
  'ok' => true,
  'cep' => $cep,
  'address' => $built['address'],
  'origin_cep' => $originCep,
  'provider' => 'superfrete',
  'options' => $built['options'],
  'error' => $built['error'],
  'configured' => $built['configured'],
]);
