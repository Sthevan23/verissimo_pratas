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
$testDataDir = sys_get_temp_dir() . '/verissimo_mysql_test_' . bin2hex(random_bytes(4));
mkdir($testDataDir, 0755, true);
putenv('VERISSIMO_TEST_DATA_DIR=' . $testDataDir);
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
assert_true($r1['ok'] === true, 'primeiro pedido WhatsApp ok');
assert_true(($r1['order']['stockDeducted'] ?? false) === true && ($r1['order']['paymentStatus'] ?? '') === 'pendente', 'pedido WhatsApp reserva sem confirmar pagamento');

$r2 = verissimo_create_order_db($pdo, $body, $items, 'idem-b', 'retirada-loja', 0, '37170000', '');
assert_true($r2['ok'] === false, 'segundo pedido sem estoque rejeitado');

$map = verissimo_load_products_map($pdo);
$stock = (int) ($map[$productId]['stock'] ?? -1);
assert_true($stock === 0, 'estoque não negativo');

$cancel = verissimo_update_order_db($pdo, (string) $r1['order']['id'], ['status' => 'cancelado']);
assert_true($cancel['ok'] === true && ($cancel['order']['stockRestored'] ?? false) === true, 'cancelamento DB restaura estoque na transacao');
$stockAfterCancel = (int) (verissimo_load_products_map($pdo)[$productId]['stock'] ?? -1);
assert_true($stockAfterCancel === 1, 'restauracao DB repoe a unidade');
$cancelAgain = verissimo_update_order_db($pdo, (string) $r1['order']['id'], ['status' => 'cancelado']);
assert_true($cancelAgain['ok'] === true && (int) (verissimo_load_products_map($pdo)[$productId]['stock'] ?? -1) === 1, 'cancelamento DB repetido nao duplica reposicao');
$reopen = verissimo_update_order_db($pdo, (string) $r1['order']['id'], ['status' => 'em_preparacao']);
assert_true($reopen['ok'] === true && (int) (verissimo_load_products_map($pdo)[$productId]['stock'] ?? -1) === 0, 'reabertura DB reserva estoque novamente');
$cancelAfterReopen = verissimo_update_order_db($pdo, (string) $r1['order']['id'], ['status' => 'cancelado']);
assert_true($cancelAfterReopen['ok'] === true && (int) (verissimo_load_products_map($pdo)[$productId]['stock'] ?? -1) === 1, 'cancelamento apos nova reserva devolve estoque');

$legacyId = 'legacy-' . bin2hex(random_bytes(5));
$legacyNumber = 'VP-LEGACY-' . bin2hex(random_bytes(3));
$legacyOrder = ['id' => $legacyId, 'orderNumber' => $legacyNumber, 'status' => 'em_preparacao', 'items' => [['productId' => $productId, 'quantity' => 1]]];
$pdo->prepare('INSERT INTO vp_orders (id, order_number, payload, idempotency_key) VALUES (?, ?, ?, NULL)')->execute([$legacyId, $legacyNumber, json_encode($legacyOrder)]);
$legacyCancel = verissimo_update_order_db($pdo, $legacyId, ['status' => 'cancelado']);
assert_true($legacyCancel['ok'] === true && ($legacyCancel['order']['stockRestored'] ?? false) === true, 'pedido legado DB sem marcador restaura estoque');
assert_true((int) (verissimo_load_products_map($pdo)[$productId]['stock'] ?? -1) === 2, 'pedido legado DB restaura uma vez');
verissimo_update_order_db($pdo, $legacyId, ['status' => 'cancelado']);
assert_true((int) (verissimo_load_products_map($pdo)[$productId]['stock'] ?? -1) === 2, 'pedido legado DB nao duplica restauracao');

$r3 = verissimo_create_order_db($pdo, $body, $items, 'idem-a', 'retirada-loja', 0, '37170000', '');
assert_true($r3['ok'] === true && ($r3['order']['id'] ?? '') === ($r1['order']['id'] ?? ''), 'idempotência retorna mesmo pedido');

// Real two-process race for one remaining unit; each worker waits at a temp-file barrier.
$raceProductId = 'test-race-' . bin2hex(random_bytes(4));
$raceProduct = ['id' => $raceProductId, 'name' => 'Concurrent reservation test', 'price' => 50, 'stock' => 1, 'inStock' => true, 'status' => 'active', 'images' => []];
verissimo_sync_catalog_products_to_db($pdo, [$raceProduct], false);
$raceBarrier = $testDataDir . '/race-barrier';
$workerPath = __DIR__ . '/mysql_reservation_worker.php';
if (!function_exists('proc_open') || !is_file($workerPath)) {
  echo "SKIP: simultaneous MySQL workers unavailable.\n";
} else {
  $workers = [];
  foreach (['race-a-' . bin2hex(random_bytes(3)), 'race-b-' . bin2hex(random_bytes(3))] as $workerKey) {
    $descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $process = proc_open([PHP_BINARY, $workerPath, $raceProductId, $workerKey, $raceBarrier], $descriptors, $pipes);
    if (!is_resource($process)) continue;
    fclose($pipes[0]);
    $workers[] = [$process, $pipes[1], $pipes[2]];
  }
  $workerResults = [];
  foreach ($workers as [$process, $stdout, $stderr]) {
    $output = stream_get_contents($stdout) . stream_get_contents($stderr);
    fclose($stdout);
    fclose($stderr);
    proc_close($process);
    if (preg_match('/RESULT=(RESERVED|REJECTED:409)/', $output, $match)) $workerResults[] = $match[1];
  }
  assert_true(count($workers) === 2 && count(array_filter($workerResults, static fn($result) => $result === 'RESERVED')) === 1 && count(array_filter($workerResults, static fn($result) => $result === 'REJECTED:409')) === 1, 'duas conexoes concorrentes nao reservam a mesma ultima unidade');
}
$pdo->exec('DELETE FROM vp_orders WHERE JSON_EXTRACT(payload, "$.items[0].productId") = ' . $pdo->quote($raceProductId));
$pdo->exec('DELETE FROM vp_products WHERE id = ' . $pdo->quote($raceProductId));

$stmt = $pdo->query('SELECT COUNT(*) FROM vp_orders');
$count = (int) $stmt->fetchColumn();
assert_true($count >= 1, 'pedido persistido');

$pdo->exec('DELETE FROM vp_orders WHERE JSON_EXTRACT(payload, "$.items[0].productId") = ' . $pdo->quote($productId));
$pdo->exec('DELETE FROM vp_products WHERE id = ' . $pdo->quote($productId));
foreach (glob($testDataDir . '/*') ?: [] as $testFile) if (is_file($testFile)) unlink($testFile);
@rmdir($testDataDir);
putenv('VERISSIMO_TEST_DATA_DIR');

if ($failed > 0) {
  echo "\n$failed teste(s) MySQL falharam.\n";
  exit(1);
}
echo "\nTestes MySQL de concorrência passaram.\n";
exit(0);
