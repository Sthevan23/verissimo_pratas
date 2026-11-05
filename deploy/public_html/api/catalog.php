<?php
/**
 * Catálogo + conteúdo do site (JSON no servidor)
 * GET  → produtos, categorias da home, configurações
 * POST → salva (admin) — mescla com dados existentes
 */
require __DIR__ . '/helpers.php';
require_once __DIR__ . '/operational_store.php';
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
    verissimo_json(['ok' => false, 'error' => 'JSON invalido'], 400);
  }

  $products = $payload['products'] ?? null;
  $productValidation = verissimo_validate_catalog_products($products);
  if (!$productValidation['ok']) {
    verissimo_json(['ok' => false, 'error' => $productValidation['error']], 400);
  }
  foreach ($products as &$product) {
    $stock = (int) ($product['stock'] ?? 0);
    $product['stock'] = $stock;
    $product['inStock'] = $stock > 0;
  }
  unset($product);

  if (array_key_exists('replaceProducts', $payload) && !is_bool($payload['replaceProducts'])) {
    verissimo_json(['ok' => false, 'error' => 'replaceProducts deve ser booleano.'], 400);
  }
  $replaceProducts = ($payload['replaceProducts'] ?? false) === true;
  if (array_key_exists('allowMassDelete', $payload) && !is_bool($payload['allowMassDelete'])) {
    verissimo_json(['ok' => false, 'error' => 'allowMassDelete deve ser booleano.'], 400);
  }
  $allowMassDelete = ($payload['allowMassDelete'] ?? false) === true;

  $lock = verissimo_acquire_operational_lock();
  try {
    $reconciled = verissimo_reconcile_orphan_images(array_values($products));
    $products = $reconciled['products'];
    $catFix = verissimo_reconcile_product_categories($products);
    $products = $catFix['products'];

    $existing = verissimo_read_catalog($path);
    $categories = isset($payload['categories']) && is_array($payload['categories'])
      ? array_values($payload['categories'])
      : array_values($existing['categories'] ?? []);
    $categoryValidation = verissimo_validate_catalog_categories($products, $categories);
    if (!$categoryValidation['ok']) {
      verissimo_release_operational_lock($lock);
      verissimo_json(['ok' => false, 'error' => $categoryValidation['error']], 400);
    }
    $out = [
      'updatedAt' => gmdate('c'),
      'products' => array_values($products),
      'categories' => $categories,
      'settings' => isset($payload['settings']) && is_array($payload['settings'])
        ? $payload['settings']
        : $existing['settings'],
    ];

    $pdo = verissimo_db_try();
    $databaseUpdated = false;
    if ($pdo instanceof PDO && verissimo_operational_db_ready($pdo)) {
      try {
        $out['products'] = verissimo_sync_catalog_products_to_db($pdo, $out['products'], true, $replaceProducts, $allowMassDelete);
        $databaseUpdated = true;
      } catch (Throwable $e) {
        verissimo_release_operational_lock($lock);
        verissimo_json(['ok' => false, 'error' => 'Falha ao sincronizar o catalogo no banco; o arquivo nao foi alterado.'], 500);
      }
    }

    $json = json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
      verissimo_release_operational_lock($lock);
      $message = $databaseUpdated
        ? 'Banco atualizado, mas falha ao serializar o arquivo do catalogo.'
        : 'Falha ao serializar o catalogo.';
      verissimo_json(['ok' => false, 'error' => $message], 500);
    }
    if (file_put_contents($path, $json, LOCK_EX) === false) {
      verissimo_release_operational_lock($lock);
      $message = $databaseUpdated
        ? 'Banco atualizado, mas falha ao gravar o arquivo do catalogo.'
        : 'Falha ao gravar o arquivo do catalogo.';
      verissimo_json(['ok' => false, 'error' => $message], 500);
    }

    verissimo_release_operational_lock($lock);
    verissimo_json([
      'ok' => true,
      'count' => count($out['products']),
      'categoriesCount' => count($out['categories']),
      'updatedAt' => $out['updatedAt'],
      'linkedImages' => (int) ($reconciled['linked'] ?? 0),
      'orphanImages' => count($reconciled['orphans'] ?? []),
    ]);
  } catch (Throwable $e) {
    verissimo_release_operational_lock($lock);
    verissimo_json(['ok' => false, 'error' => 'Falha ao salvar catalogo.'], 500);
  }
}
verissimo_json(['ok' => false, 'error' => 'Método não permitido'], 405);
