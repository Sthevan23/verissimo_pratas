<?php
/**
 * Migração JSON → MySQL (CLI ou admin autenticado).
 * Uso CLI: php api/migrate.php
 * Não apaga JSON — apenas importa/atualiza vp_*.
 */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/operational_store.php';

$isCli = PHP_SAPI === 'cli';

if (!$isCli) {
  verissimo_api_headers();
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    verissimo_json(['ok' => false, 'error' => 'Use POST'], 405);
  }
  verissimo_require_write_token();
}

$pdo = verissimo_db_try();
if (!$pdo instanceof PDO) {
  $msg = 'MySQL indisponível — configure api/config.local.php';
  if ($isCli) {
    fwrite(STDERR, $msg . PHP_EOL);
    exit(1);
  }
  verissimo_json(['ok' => false, 'error' => $msg], 503);
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
  $msg = 'Schema vp_* não encontrado. Execute database/migrations/001_vp_operational.sql no phpMyAdmin.';
  if ($isCli) {
    fwrite(STDERR, $msg . PHP_EOL);
    exit(1);
  }
  verissimo_json(['ok' => false, 'error' => $msg], 500);
}

$catalog = verissimo_read_catalog_file();
$products = $catalog['products'] ?? [];
verissimo_sync_catalog_products_to_db($pdo, is_array($products) ? $products : [], true);

$ordersJson = verissimo_read_orders_json();
$importedOrders = 0;
$stmt = $pdo->prepare(
  'INSERT INTO vp_orders (id, order_number, payload, idempotency_key)
   VALUES (?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE payload = VALUES(payload)'
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
  $importedOrders++;
}

$report = [
  'ok' => true,
  'products' => count($products),
  'ordersImported' => $importedOrders,
  'schema' => '001_vp_operational',
  'note' => 'Arquivos JSON preservados em api/data/.',
];

if ($isCli) {
  echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
  exit(0);
}

verissimo_json($report);
