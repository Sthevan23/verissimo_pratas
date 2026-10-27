<?php
/**
 * Catálogo + conteúdo do site (JSON no servidor)
 * GET  → produtos, categorias da home, configurações
 * POST → salva (admin) — mescla com dados existentes
 */
require __DIR__ . '/helpers.php';
verissimo_api_headers();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = verissimo_catalog_path();

function verissimo_read_catalog(string $path): array {
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

if ($method === 'GET') {
  $data = verissimo_read_catalog($path);
  $catFix = verissimo_reconcile_product_categories($data['products'] ?? []);
  $data['products'] = $catFix['products'];
  if ($catFix['changed'] && is_file($path)) {
    $out = [
      'updatedAt' => gmdate('c'),
      'products' => array_values($data['products']),
      'categories' => $data['categories'] ?? [],
      'settings' => $data['settings'] ?? [],
    ];
    $json = json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json !== false) {
      file_put_contents($path, $json, LOCK_EX);
    }
  }
  verissimo_json([
    'ok' => true,
    'products' => $data['products'],
    'categories' => $data['categories'],
    'settings' => $data['settings'],
    'updatedAt' => $data['updatedAt'] ?? null,
    'count' => count($data['products']),
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

  $reconciled = verissimo_reconcile_orphan_images(array_values($products));
  $products = $reconciled['products'];
  $catFix = verissimo_reconcile_product_categories($products);
  $products = $catFix['products'];

  $existing = verissimo_read_catalog($path);
  $out = [
    'updatedAt' => gmdate('c'),
    'products' => array_values($products),
    'categories' => isset($payload['categories']) && is_array($payload['categories'])
      ? array_values($payload['categories'])
      : $existing['categories'],
    'settings' => isset($payload['settings']) && is_array($payload['settings'])
      ? $payload['settings']
      : $existing['settings'],
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
    'categoriesCount' => count($out['categories']),
    'updatedAt' => $out['updatedAt'],
    'linkedImages' => (int) ($reconciled['linked'] ?? 0),
    'orphanImages' => count($reconciled['orphans'] ?? []),
  ]);
}

verissimo_json(['ok' => false, 'error' => 'Método não permitido'], 405);
