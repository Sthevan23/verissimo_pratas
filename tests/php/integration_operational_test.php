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

$whatsappPending = verissimo_create_order_json($body, $items, 'idem-whatsapp-pending', 'retirada-loja', 0, '37170000', '');
assert_true($whatsappPending['ok'] === true, 'pedido WhatsApp criado');
assert_true(($whatsappPending['order']['stockDeducted'] ?? false) === true, 'pedido WhatsApp reserva estoque');
assert_true(($whatsappPending['order']['paymentStatus'] ?? '') === 'pendente', 'reserva nao confirma pagamento');
assert_true((int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 1, 'reserva WhatsApp reduz estoque imediatamente');

$r1 = $whatsappPending;
$orders = verissimo_read_orders_json();
assert_true(count($orders) === 1, 'pedido WhatsApp persistido');
$r1Retry = verissimo_create_order_json($body, $items, 'idem-whatsapp-pending', 'retirada-loja', 0, '37170000', '');
assert_true($r1Retry['ok'] === true && ($r1Retry['order']['id'] ?? '') === ($r1['order']['id'] ?? ''), 'idempotencia retorna mesmo pedido reservado');
assert_true((int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 1, 'idempotencia nao duplica reserva');

$bodyPix = array_merge($body, ['paymentMethod' => 'pix']);
$r2 = verissimo_create_order_json($bodyPix, $items, 'idem-pix', 'retirada-loja', 0, '37170000', '');
assert_true($r2['ok'] === true && ($r2['order']['stockDeducted'] ?? false) === true, 'outro paymentMethod tambem reserva estoque');
assert_true((int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 0, 'reservas consomem saldo disponivel');
$r3 = verissimo_create_order_json($body, $items, 'idem-sem-saldo', 'retirada-loja', 0, '37170000', '');
assert_true($r3['ok'] === false, 'pedido adicional rejeitado sem estoque');

$cancel = verissimo_update_order_json((string) $r1['order']['id'], ['status' => 'cancelado']);
assert_true($cancel['ok'] === true && ($cancel['order']['stockRestored'] ?? false) === true, 'cancelamento marca estoque restaurado');
assert_true((int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 1, 'cancelamento restaura uma unidade');
$cancelAgain = verissimo_update_order_json((string) $r1['order']['id'], ['status' => 'cancelado']);
assert_true($cancelAgain['ok'] === true && (int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 1, 'cancelamento repetido nao restaura duplicado');

$r4 = verissimo_create_order_json($body, $items, 'idem-reserva-concorrente', 'retirada-loja', 0, '37170000', '');
assert_true($r4['ok'] === true && (int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 0, 'pedido novo reserva unidade liberada');
$reopenWithoutStock = verissimo_update_order_json((string) $r1['order']['id'], ['status' => 'em_preparacao']);
assert_true($reopenWithoutStock['ok'] === false && ($reopenWithoutStock['code'] ?? 0) === 409, 'reabertura sem estoque e recusada');
$reopenedOrders = verissimo_read_orders_json();
$reopenedR1 = array_values(array_filter($reopenedOrders, static fn($order) => ($order['id'] ?? '') === ($r1['order']['id'] ?? '')))[0] ?? [];
assert_true(($reopenedR1['status'] ?? '') === 'cancelado', 'pedido continua cancelado apos reabertura recusada');
verissimo_update_order_json((string) $r4['order']['id'], ['status' => 'cancelado']);
assert_true((int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 1, 'cancelamento do pedido concorrente libera saldo');
$reopen = verissimo_update_order_json((string) $r1['order']['id'], ['status' => 'em_preparacao']);
assert_true($reopen['ok'] === true && ($reopen['order']['stockDeducted'] ?? false) === true, 'reabertura reserva estoque novamente');
assert_true((int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 0, 'reabertura baixa estoque uma vez');
$reopenAgain = verissimo_update_order_json((string) $r1['order']['id'], ['status' => 'em_preparacao']);
assert_true($reopenAgain['ok'] === true && (int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 0, 'atualizacao repetida nao duplica reserva');
verissimo_update_order_json((string) $r1['order']['id'], ['status' => 'cancelado']);
verissimo_update_order_json((string) $r2['order']['id'], ['status' => 'cancelado']);
assert_true((int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 2, 'cancelamentos devolvem as duas reservas');

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

// Pedido legado sem marcador: compatibilidade assume que o fluxo antigo baixou estoque.
$legacyOrder = [
  'id' => 'legacy-stock-order',
  'status' => 'em_preparacao',
  'items' => [['productId' => $productId, 'quantity' => 2]],
];
$legacyCatalog = verissimo_read_catalog_file();
$legacyCatalog['products'][0]['stock'] = 2; // saldo ja reduzido pelo sistema antigo
$legacyCatalog['products'][0]['inStock'] = true;
verissimo_write_catalog_file($legacyCatalog);
file_put_contents(verissimo_orders_path(), json_encode([$legacyOrder]));
$legacyCancel = verissimo_update_order_json('legacy-stock-order', ['status' => 'cancelado']);
assert_true($legacyCancel['ok'] === true && ($legacyCancel['order']['stockRestored'] ?? false) === true, 'pedido legado sem marcador restaura estoque no primeiro cancelamento');
assert_true((int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 4, 'compatibilidade legacy repe a quantidade antiga');
verissimo_update_order_json('legacy-stock-order', ['status' => 'cancelado']);
assert_true((int) (verissimo_read_catalog_file()['products'][0]['stock'] ?? -1) === 4, 'pedido legado nao restaura duplicado');

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
