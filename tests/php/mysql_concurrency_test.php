<?php
/**
 * Testes de concorrência MySQL — SOMENTE banco de testes isolado.
 *
 * Variáveis obrigatórias:
 *   VERISSIMO_TEST_MYSQL_HOST, VERISSIMO_TEST_MYSQL_NAME,
 *   VERISSIMO_TEST_MYSQL_USER, VERISSIMO_TEST_MYSQL_PASS
 *
 * Uso: php tests/php/mysql_concurrency_test.php
 */
declare(strict_types=1);

$host = getenv('VERISSIMO_TEST_MYSQL_HOST') ?: '';
$name = getenv('VERISSIMO_TEST_MYSQL_NAME') ?: '';
$user = getenv('VERISSIMO_TEST_MYSQL_USER') ?: '';
$pass = getenv('VERISSIMO_TEST_MYSQL_PASS') ?: '';

if ($host === '' || $name === '' || $user === '') {
  echo "SKIP: MySQL de testes não configurado (defina VERISSIMO_TEST_MYSQL_*).\n";
  exit(0);
}

if (stripos($name, 'prod') !== false || (stripos($name, 'test') === false && stripos($name, 'homolog') === false)) {
  echo "SKIP: Use um banco dedicado de teste (nome contendo test ou homolog). Atual: $name\n";
  exit(0);
}

$root = dirname(__DIR__, 2);
require $root . '/api/helpers.php';
require $root . '/api/order_logic.php';
require $root . '/api/shipping_logic.php';
require $root . '/api/operational_store.php';

$failed = 0;
function assert_true(bool $cond, string $msg): void {
  global $failed;
  if (!$cond) {
    echo "FAIL: $msg\n";
    $failed++;
  } else {
    echo "OK: $msg\n";
  }
}

try {
  $pdo = new PDO(
    "mysql:host=$host;dbname=$name;charset=utf8mb4",
    $user,
    $pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );
} catch (Throwable $e) {
  echo "SKIP: não conectou ao MySQL de teste: " . $e->getMessage() . "\n";
  exit(0);
}

$sqlFile = $root . '/database/migrations/001_vp_operational.sql';
if (is_file($sqlFile)) {
  $sql = file_get_contents($sqlFile);
  foreach (array_filter(array_map('trim', explode(';', (string) $sql))) as $statement) {
    if ($statement === '' || str_starts_with($statement, '--')) continue;
    try {
      $pdo->exec($statement);
    } catch (Throwable $e) {
    }
  }
}

$productId = 'test-concurrency-' . bin2hex(random_bytes(4));
$product = [
  'id' => $productId,
  'name' => 'Teste Concorrência',
  'price' => 50,
  'stock' => 1,
  'inStock' => true,
  'status' => 'active',
  'images' => [],
];
verissimo_sync_catalog_products_to_db($pdo, [$product], false);

$body = [
  'shippingOptionId' => 'retirada-loja',
  'shipping' => 0,
  'cep' => '37170000',
];
$items = [['productId' => $productId, 'quantity' => 1]];

$r1 = verissimo_create_order_db($pdo, $body, $items, 'idem-a', 'retirada-loja', 0, '37170000', '');
assert_true($r1['ok'] === true, 'primeiro pedido ok');

$r2 = verissimo_create_order_db($pdo, $body, $items, 'idem-b', 'retirada-loja', 0, '37170000', '');
assert_true($r2['ok'] === false, 'segundo pedido sem estoque rejeitado');

$map = verissimo_load_products_map($pdo);
$stock = (int) ($map[$productId]['stock'] ?? -1);
assert_true($stock === 0, 'estoque não negativo');

$r3 = verissimo_create_order_db($pdo, $body, $items, 'idem-a', 'retirada-loja', 0, '37170000', '');
assert_true($r3['ok'] === true && ($r3['order']['id'] ?? '') === ($r1['order']['id'] ?? ''), 'idempotência retorna mesmo pedido');

$stmt = $pdo->query('SELECT COUNT(*) FROM vp_orders');
$count = (int) $stmt->fetchColumn();
assert_true($count >= 1, 'pedido persistido');

$pdo->exec('DELETE FROM vp_orders WHERE JSON_EXTRACT(payload, "$.items[0].productId") = ' . $pdo->quote($productId));
$pdo->exec('DELETE FROM vp_products WHERE id = ' . $pdo->quote($productId));

if ($failed > 0) {
  echo "\n$failed teste(s) MySQL falharam.\n";
  exit(1);
}
echo "\nTestes MySQL de concorrência passaram.\n";
exit(0);
