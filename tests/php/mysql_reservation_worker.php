<?php
declare(strict_types=1);

$host = getenv('VERISSIMO_TEST_MYSQL_HOST') ?: '';
$name = getenv('VERISSIMO_TEST_MYSQL_NAME') ?: '';
$user = getenv('VERISSIMO_TEST_MYSQL_USER') ?: '';
$pass = getenv('VERISSIMO_TEST_MYSQL_PASS') ?: '';
$productId = $argv[1] ?? '';
$idempotencyKey = $argv[2] ?? '';
$barrier = $argv[3] ?? '';

if ($host === '' || $name === '' || $user === '' || $productId === '' || $idempotencyKey === '' || $barrier === '') {
  fwrite(STDERR, "RESULT=ERROR:missing-test-parameters\n");
  exit(2);
}
if (stripos($name, 'prod') !== false || (stripos($name, 'test') === false && stripos($name, 'homolog') === false)) {
  fwrite(STDERR, "RESULT=ERROR:unsafe-database-name\n");
  exit(2);
}

$readyPath = $barrier . '.ready.' . preg_replace('/[^a-zA-Z0-9_-]/', '', $idempotencyKey);
if (file_put_contents($readyPath, 'ready', LOCK_EX) === false) {
  fwrite(STDERR, "RESULT=ERROR:barrier-unavailable\n");
  exit(2);
}
$deadline = microtime(true) + 15;
do {
  $readyWorkers = glob($barrier . '.ready.*') ?: [];
  if (count($readyWorkers) >= 2) break;
  usleep(20000);
} while (microtime(true) < $deadline);
if (count($readyWorkers) < 2) {
  fwrite(STDERR, "RESULT=ERROR:barrier-timeout\n");
  exit(2);
}

$root = dirname(__DIR__, 2);
require $root . '/api/helpers.php';
require $root . '/api/order_logic.php';
require $root . '/api/shipping_logic.php';
require $root . '/api/operational_store.php';

try {
  $pdo = new PDO(
    "mysql:host=$host;dbname=$name;charset=utf8mb4",
    $user,
    $pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );
  $body = ['shippingOptionId' => 'retirada-loja', 'shipping' => 0, 'cep' => '37170000'];
  $items = [['productId' => $productId, 'quantity' => 1]];
  $result = verissimo_create_order_db($pdo, $body, $items, $idempotencyKey, 'retirada-loja', 0, '37170000', '');
  if (!empty($result['ok'])) {
    echo "RESULT=RESERVED\n";
    exit(0);
  }
  echo 'RESULT=REJECTED:' . (int) ($result['code'] ?? 0) . "\n";
  exit(0);
} catch (Throwable $error) {
  fwrite(STDERR, "RESULT=ERROR:mysql-worker-failure\n");
  exit(2);
}
