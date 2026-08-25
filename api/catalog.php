<?php
/**
 * Catálogo de produtos (JSON no servidor)
 * GET  → lista produtos públicos
 * POST → salva lista completa (admin)
 * Header POST: X-Verissimo-Token
 */
require __DIR__ . '/helpers.php';
verissimo_api_headers();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = verissimo_catalog_path();

if ($method === 'GET') {
  if (!is_file($path)) {
    verissimo_json(['ok' => true, 'products' => [], 'updatedAt' => null]);
  }
  $raw = file_get_contents($path);
  $data = json_decode($raw ?: '[]', true);
  if (!is_array($data)) {
    verissimo_json(['ok' => true, 'products' => [], 'updatedAt' => null]);
  }
  $products = $data['products'] ?? (array_is_list($data) ? $data : []);
  verissimo_json([
    'ok' => true,
    'products' => $products,
    'updatedAt' => $data['updatedAt'] ?? null,
    'count' => count($products),
  ]);
}

if ($method === 'POST') {
  verissimo_require_write_token();
  $body = file_get_contents('php://input');
  $payload = json_decode($body ?: '', true);
  if (!is_array($payload)) {
    verissimo_json(['ok' => false, 'error' => 'JSON inválido'], 400);
  }
  $products = $payload['products'] ?? null;
  if (!is_array($products)) {
    verissimo_json(['ok' => false, 'error' => 'Campo products obrigatório'], 400);
  }

  $out = [
    'updatedAt' => gmdate('c'),
    'products' => array_values($products),
  ];
  $json = json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    verissimo_json(['ok' => false, 'error' => 'Falha ao serializar'], 500);
  }
  if (file_put_contents($path, $json, LOCK_EX) === false) {
    verissimo_json(['ok' => false, 'error' => 'Falha ao gravar catálogo'], 500);
  }
  verissimo_json([
    'ok' => true,
    'count' => count($out['products']),
    'updatedAt' => $out['updatedAt'],
  ]);
}

verissimo_json(['ok' => false, 'error' => 'Método não permitido'], 405);
