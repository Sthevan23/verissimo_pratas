<?php
/**
 * Testes de integração JSON (diretório temporário — não toca api/data real).
 */
declare(strict_types=1);

$root = dirname(__DIR__, 2);
$tmp = sys_get_temp_dir() . '/verissimo_test_' . bin2hex(random_bytes(4));
mkdir($tmp, 0755, true);

putenv('VERISSIMO_TEST_DATA_DIR=' . $tmp);

require $root . '/api/helpers.php';
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

$productId = 'test-prod-1';
$catalog = [
  'products' => [[
    'id' => $productId,
    'name' => 'Anel Teste',
    'price' => 100,
    'stock' => 2,
    'inStock' => true,
    'status' => 'active',
    'images' => [],
  ]],
  'categories' => [],
  'settings' => [],
];
file_put_contents(verissimo_catalog_path(), json_encode($catalog, JSON_UNESCAPED_UNICODE));
file_put_contents(verissimo_orders_path(), '[]');

$body = [
  'shippingOptionId' => 'retirada-loja',
  'shipping' => 0,
  'cep' => '37170000',
  'customerName' => 'Teste',
];
$items = [['productId' => $productId, 'quantity' => 1]];

$r1 = verissimo_create_order_json($body, $items, 'idem-key-1', 'retirada-loja', 0, '37170000', '');
assert_true($r1['ok'] === true && isset($r1['order']['orderNumber']), 'pedido JSON criado');

$catAfter = verissimo_read_catalog_file();
$stockAfter = (int) ($catAfter['products'][0]['stock'] ?? -1);
assert_true($stockAfter === 1, 'estoque baixou para 1');

$orders = verissimo_read_orders_json();
assert_true(count($orders) === 1, 'um pedido gravado');

$r2 = verissimo_create_order_json($body, $items, 'idem-key-1', 'retirada-loja', 0, '37170000', '');
assert_true($r2['ok'] === true, 'idempotência retorna sucesso');
assert_true(
  ($r2['order']['orderNumber'] ?? '') === ($r1['order']['orderNumber'] ?? ''),
  'idempotência mesmo pedido'
);

$catIdem = verissimo_read_catalog_file();
assert_true((int) ($catIdem['products'][0]['stock'] ?? 0) === 1, 'idempotência não baixa estoque de novo');

$r3 = verissimo_create_order_json($body, $items, 'idem-key-2', 'retirada-loja', 0, '37170000', '');
assert_true($r3['ok'] === true, 'segundo pedido ok');
$catFinal = verissimo_read_catalog_file();
assert_true((int) ($catFinal['products'][0]['stock'] ?? 0) === 0, 'estoque zerado após 2 unidades');

$r4 = verissimo_create_order_json($body, $items, 'idem-key-3', 'retirada-loja', 0, '37170000', '');
assert_true($r4['ok'] === false, 'terceiro pedido rejeitado sem estoque');

// Preço manipulado no item não altera total (servidor usa catálogo)
$catalog2 = $catalog;
$catalog2['products'][0]['stock'] = 5;
file_put_contents(verissimo_catalog_path(), json_encode($catalog2, JSON_UNESCAPED_UNICODE));
file_put_contents(verissimo_orders_path(), '[]');

$bodyCupom = array_merge($body, ['couponCode' => 'VERISSIMO10']);
$r5 = verissimo_create_order_json($bodyCupom, $items, 'idem-cupom', 'retirada-loja', 0, '37170000', 'VERISSIMO10');
assert_true($r5['ok'] === true, 'pedido com cupom');
$sub = (float) ($r5['order']['subtotal'] ?? 0);
$disc = (float) ($r5['order']['discount'] ?? 0);
assert_true(abs($sub - 100.0) < 0.01 && abs($disc - 10.0) < 0.01, 'cupom 10% calculado no servidor');

// cleanup
array_map('unlink', glob($tmp . '/*') ?: []);
@rmdir($tmp);
putenv('VERISSIMO_TEST_DATA_DIR');

if ($failed > 0) {
  echo "\n$failed teste(s) de integração falharam.\n";
  exit(1);
}

echo "\nTestes de integração JSON passaram.\n";
exit(0);
