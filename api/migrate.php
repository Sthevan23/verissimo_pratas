<?php
/**
 * Migração JSON → MySQL. Executável somente pela linha de comando:
 *   php api/migrate.php
 * Não apaga JSON. Importa pedidos do JSON apenas uma vez (guarda em vp_meta),
 * para nunca sobrescrever pedidos já atualizados no MySQL.
 */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/operational_store.php';

if (PHP_SAPI !== 'cli') {
  verissimo_json(['ok' => false, 'error' => 'Migração disponível somente pela linha de comando.'], 403);
}

$pdo = verissimo_db_try();
if (!$pdo instanceof PDO) {
  fwrite(STDERR, 'MySQL indisponível — configure api/config.local.php' . PHP_EOL);
  exit(1);
}

$sqlFile = dirname(__DIR__) . '/database/migrations/001_vp_operational.sql';
if (is_file($sqlFile)) {
  $sql = file_get_contents($sqlFile);
  if (is_string($sql) && $sql !== '') {
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
      if ($statement === '' || str_starts_with($statement, '--')) continue;
      try {
        $pdo->exec($statement);
      } catch (Throwable $e) {
        // CREATE IF NOT EXISTS — ignora erros benignos
      }
    }
  }
}

if (!verissimo_operational_db_ready($pdo)) {
  fwrite(STDERR, 'Schema vp_* não encontrado. Execute database/migrations/001_vp_operational.sql.' . PHP_EOL);
  exit(1);
}

$catalog = verissimo_read_catalog_file();
$products = $catalog['products'] ?? [];
verissimo_sync_catalog_products_to_db($pdo, is_array($products) ? $products : [], true);

$alreadyImported = $pdo->query("SELECT 1 FROM vp_meta WHERE k = 'orders_imported' LIMIT 1")->fetchColumn() !== false;
$importedOrders = 0;
if (!$alreadyImported) {
  $ordersJson = verissimo_read_orders_json();
  // INSERT IGNORE: pedido já existente no MySQL nunca é reescrito pelo JSON antigo.
  $stmt = $pdo->prepare(
    'INSERT IGNORE INTO vp_orders (id, order_number, payload, idempotency_key)
     VALUES (?, ?, ?, ?)'
  );
  foreach ($ordersJson as $order) {
    if (!is_array($order) || empty($order['id'])) continue;
    $payload = json_encode($order, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt->execute([
      (string) $order['id'],
      (string) ($order['orderNumber'] ?? $order['id']),
      $payload,
      isset($order['idempotencyKey']) ? (string) $order['idempotencyKey'] : null,
    ]);
    $importedOrders += $stmt->rowCount();
  }
  $pdo->prepare("INSERT INTO vp_meta (k, v) VALUES ('orders_imported', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)")
    ->execute([gmdate('c')]);
}

echo json_encode([
  'ok' => true,
  'products' => count($products),
  'ordersImported' => $importedOrders,
  'ordersImportSkipped' => $alreadyImported,
  'schema' => '001_vp_operational',
  'note' => 'Arquivos JSON preservados em api/data/.',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
exit(0);
