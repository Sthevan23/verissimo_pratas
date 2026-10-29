<?php
/**
 * Testes unitários PHP (sem MySQL — lógica pura).
 * Uso: php tests/php/run-tests.php
 */
declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/api/helpers.php';
require $root . '/api/order_logic.php';
require $root . '/api/shipping_logic.php';

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

function assert_eq($a, $b, string $msg): void {
  assert_true($a === $b, $msg . " (got " . json_encode($a) . ", want " . json_encode($b) . ")");
}

// Quantidade
$q = verissimo_validate_line_quantity(2, 5, true, 'active');
assert_true($q['ok'] === true && ($q['qty'] ?? 0) === 2, 'quantidade válida');

$q0 = verissimo_validate_line_quantity(0, 5, true, 'active');
assert_true($q0['ok'] === false, 'quantidade zero');

$qn = verissimo_validate_line_quantity(-1, 5, true, 'active');
assert_true($qn['ok'] === false, 'quantidade negativa');

$qbig = verissimo_validate_line_quantity(10, 3, true, 'active');
assert_true($qbig['ok'] === false, 'quantidade acima do estoque');

// Preço unitário (ignora preço manipulado do cliente — usa catálogo)
$p = ['price' => 100, 'salePrice' => 80];
assert_eq(verissimo_product_unit_price_cents($p), 8000, 'preço promocional');

$p2 = ['price' => 49.99];
assert_eq(verissimo_product_unit_price_cents($p2), 4999, 'preço cheio em centavos');

// Cupom fallback
$c = verissimo_coupon_discount_cents('VERISSIMO10', 15000, null);
assert_true($c['ok'] && ($c['discount_cents'] ?? 0) === 1500, 'cupom 10%');

$cBad = verissimo_coupon_discount_cents('INVALID', 15000, null);
assert_true(!$cBad['ok'], 'cupom inválido');

$cMin = verissimo_coupon_discount_cents('PRATA15', 5000, null);
assert_true(!$cMin['ok'], 'cupom abaixo do mínimo');

// Frete (servidor recota — não usa valor do cliente)
$f = verissimo_validate_shipping_for_order('retirada-loja', 10000, '37170000', 1);
assert_true($f['ok'] && ($f['shipping_cents'] ?? -1) === 0, 'retirada grátis');

$fPaid = verissimo_validate_shipping_for_order('servico-correios-fake', 10000, '37170000', 1);
assert_true(!$fPaid['ok'], 'frete pago fake rejeitado sem cotação válida');

$fCep = verissimo_validate_shipping_for_order('retirada-loja', 10000, '123', 1);
assert_true(!$fCep['ok'], 'CEP inválido rejeitado');

// Total simulado
$sub = 20000;
$disc = 2000;
$ship = 1500;
$total = max(0, $sub - $disc + $ship);
assert_eq($total, 19500, 'total em centavos');

// Deploy TLS — verifica upload.mjs
$upload = file_get_contents($root . '/deploy/upload.mjs');
assert_true(is_string($upload) && !str_contains($upload, 'rejectUnauthorized: false'), 'TLS validation enabled in deploy script');

if ($failed > 0) {
  echo "\n$failed teste(s) falharam.\n";
  exit(1);
}

echo "\nTodos os testes unitários PHP passaram.\n";

foreach (['integration_operational_test.php', 'session_csrf_test.php', 'mysql_concurrency_test.php'] as $file) {
  $path = $root . '/tests/php/' . $file;
  if (!is_file($path)) continue;
  passthru(PHP_BINARY . ' ' . escapeshellarg($path), $code);
  if ($code !== 0) exit($code);
}

exit(0);
