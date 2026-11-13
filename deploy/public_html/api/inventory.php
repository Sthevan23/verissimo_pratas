<?php
/** Explicit product inventory adjustment; never rewrites the full catalog from a client snapshot. */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/operational_store.php';
verissimo_api_headers();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  verissimo_json(['ok' => false, 'error' => 'Use POST'], 405);
}
verissimo_require_write_token();

$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body)) {
  verissimo_json(['ok' => false, 'error' => 'JSON invalido.'], 400);
}
$productId = $body['productId'] ?? null;
$stock = $body['stock'] ?? null;
if (!is_string($productId) || trim($productId) === '') {
  verissimo_json(['ok' => false, 'error' => 'productId deve ser um texto nao vazio.'], 400);
}
if (!is_int($stock) || $stock < 0) {
  verissimo_json(['ok' => false, 'error' => 'stock deve ser um inteiro maior ou igual a zero.'], 400);
}
$productId = trim($productId);

$pdo = verissimo_db_try();
if (!$pdo instanceof PDO || !verissimo_operational_db_ready($pdo)) {
  verissimo_json(['ok' => false, 'error' => 'Banco operacional indisponivel.'], 503);
}

$lock = verissimo_acquire_operational_lock();
try {
  $catalog = verissimo_read_catalog_file();
  $catalogProductFound = false;
  foreach ($catalog['products'] ?? [] as $product) {
    if (is_array($product) && (string) ($product['id'] ?? '') === $productId) {
      $catalogProductFound = true;
      break;
    }
  }
  if (!$catalogProductFound) {
    verissimo_release_operational_lock($lock);
    verissimo_json(['ok' => false, 'error' => 'Produto nao encontrado no catalogo.'], 404);
  }

  $pdo->beginTransaction();
  $select = $pdo->prepare('SELECT product_json FROM vp_products WHERE id = ? FOR UPDATE');
  $select->execute([$productId]);
  $rawProduct = $select->fetchColumn();
  if ($rawProduct === false) {
    $pdo->rollBack();
    verissimo_release_operational_lock($lock);
    verissimo_json(['ok' => false, 'error' => 'Produto nao encontrado no banco.'], 404);
  }
  $product = json_decode((string) $rawProduct, true);
  if (!is_array($product)) {
    $pdo->rollBack();
    verissimo_release_operational_lock($lock);
    verissimo_json(['ok' => false, 'error' => 'Dados do produto invalidos no banco.'], 500);
  }
  $product['id'] = $productId;
  $product['stock'] = $stock;
  $product['inStock'] = $stock > 0;
  $update = $pdo->prepare('UPDATE vp_products SET stock = ?, in_stock = ?, product_json = ? WHERE id = ?');
  $update->execute([
    $stock,
    $stock > 0 ? 1 : 0,
    json_encode($product, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    $productId,
  ]);
  $pdo->commit();

  foreach ($catalog['products'] as &$catalogProduct) {
    if (is_array($catalogProduct) && (string) ($catalogProduct['id'] ?? '') === $productId) {
      $catalogProduct['stock'] = $stock;
      $catalogProduct['inStock'] = $stock > 0;
      break;
    }
  }
  unset($catalogProduct);
  if (!verissimo_write_catalog_file($catalog)) {
    verissimo_release_operational_lock($lock);
    verissimo_json(['ok' => false, 'error' => 'Banco atualizado, mas falha ao gravar o estoque no arquivo do catalogo.'], 500);
  }

  verissimo_release_operational_lock($lock);
  verissimo_json(['ok' => true, 'productId' => $productId, 'stock' => $stock, 'inStock' => $stock > 0]);
} catch (Throwable $error) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  verissimo_release_operational_lock($lock);
  verissimo_json(['ok' => false, 'error' => 'Falha ao atualizar estoque.'], 500);
}
