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
require_once $root . '/scripts/hash-admin-password.php';

$authFixturePassword = 'Teste-Login-Unittest-2026';
$authFixtureHash = password_hash($authFixturePassword, PASSWORD_DEFAULT);
assert_true(verissimo_password_matches_hash($authFixturePassword, $authFixtureHash), 'login verifica senha com password_verify');
assert_true(!verissimo_password_matches_hash('senha-incorreta', $authFixtureHash), 'login rejeita senha divergente');
$passwordHelperSource = file_get_contents($root . '/api/helpers.php');
preg_match('/function verissimo_admin_password_hash\(\): string \{.*?\n\}/s', (string) $passwordHelperSource, $passwordHelperMatch);
assert_true(isset($passwordHelperMatch[0]) && !str_contains($passwordHelperMatch[0], 'api_token'), 'login nao usa api_token como fallback de senha');
$legacyFixture = 'Token-Legado-De-Teste-2026';
ob_start();
$legacyTokenHash = verissimo_hash_legacy_admin_credential(['api_token' => $legacyFixture]);
$scriptOutput = ob_get_clean();
assert_true($scriptOutput === '', 'funcao de migracao nao imprime credencial nem hash');
assert_true(password_verify($legacyFixture, $legacyTokenHash), 'script reconhece api_token legado sem trocar a credencial');
$fixtureConfigPath = tempnam(sys_get_temp_dir(), 'vp-admin-config-');
$cliHashValid = false;
$cliOutputIsRedacted = false;
if (is_string($fixtureConfigPath)) {
  file_put_contents(
    $fixtureConfigPath,
    "<?php return ['api_token' => " . var_export($legacyFixture, true) . "];\n"
  );
  $descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
  $process = proc_open(
    [PHP_BINARY, $root . '/scripts/hash-admin-password.php', '--config=' . $fixtureConfigPath],
    $descriptors,
    $pipes
  );
  if (is_resource($process)) {
    fclose($pipes[0]);
    $cliOutput = trim((string) stream_get_contents($pipes[1]));
    $cliError = (string) stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $cliExit = proc_close($process);
    $cliHashValid = $cliExit === 0 && password_verify($legacyFixture, $cliOutput);
    $cliOutputIsRedacted = !str_contains($cliOutput, $legacyFixture) && !str_contains($cliError, $legacyFixture);
  }
  unlink($fixtureConfigPath);
}
assert_true($cliHashValid, 'CLI do script migra api_token de configuracao legada');
assert_true($cliOutputIsRedacted, 'CLI do script nao imprime o valor de api_token');
$legacyAdminPasswordHash = verissimo_hash_legacy_admin_credential(
  ['admin_password' => 'Senha-Legada-De-Teste-2026', 'api_token' => $legacyFixture]
);
assert_true(password_verify('Senha-Legada-De-Teste-2026', $legacyAdminPasswordHash), 'script prioriza admin_password quando configurado');
$authSource = file_get_contents($root . '/api/auth.php');
$configSource = file_get_contents($root . '/api/config.php');
assert_true(str_contains((string) $authSource, 'verissimo_admin_password_hash') && !str_contains((string) $authSource, 'api_token'), 'auth usa hash e nao consulta api_token');
assert_true(!str_contains((string) $configSource, "'admin_password' =>") && !str_contains((string) $configSource, "'api_token' =>"), 'config padrao nao oferece credenciais legadas para login');
$sqlSeed = file_get_contents($root . '/database/verissimo_pratas_hostinger.sql');
assert_true(!str_contains((string) $sqlSeed, 'INSERT INTO `admins`'), 'dump nao semeia credencial ou conta administrativa padrao');
assert_true(str_contains((string) $sqlSeed, 'this dump intentionally creates no administrator account'), 'dump documenta provisionamento administrativo controlado');
foreach (['helpers.php', 'auth.php', 'config.php', 'config.local.example.php', 'operational_store.php', 'catalog.php', 'inventory.php'] as $apiFile) {
  $sourceHash = hash_file('sha256', $root . '/api/' . $apiFile);
  $deployHash = hash_file('sha256', $root . '/deploy/public_html/api/' . $apiFile);
  assert_true(is_string($sourceHash) && is_string($deployHash) && hash_equals($sourceHash, $deployHash), "espelho api/$apiFile sincronizado");
}

$categoryProduct = ['id' => 'cat-test-product', 'name' => 'Colar com brinco', 'category' => 'brincos'];
assert_eq(verissimo_normalize_product_category($categoryProduct)['category'], 'brincos', 'categoria explícita não é sobrescrita por heurística do nome');
$catalogCategoryCheck = verissimo_validate_catalog_categories(
  [['id' => 'p1', 'category' => 'brincos']],
  [['id' => 'category-1', 'slug' => 'brincos']]
);
assert_true($catalogCategoryCheck['ok'], 'produto referencia categoria existente');
$missingCategoryCheck = verissimo_validate_catalog_categories(
  [['id' => 'p1', 'category' => 'brincos']],
  [['id' => 'category-1', 'slug' => 'aneis']]
);
assert_true(!$missingCategoryCheck['ok'], 'produto sem categoria correspondente é rejeitado');
$duplicateCategoryCheck = verissimo_validate_catalog_categories(
  [],
  [['id' => 'category-1', 'slug' => 'brincos'], ['id' => 'category-2', 'slug' => 'brincos']]
);
assert_true(!$duplicateCategoryCheck['ok'], 'slugs duplicados são rejeitados');
$caseMismatchCategoryCheck = verissimo_validate_catalog_categories(
  [],
  [['id' => 'category-1', 'slug' => 'Brincos']]
);
assert_true(!$caseMismatchCategoryCheck['ok'], 'slug deve usar formato canônico minúsculo');
$duplicateIdCategoryCheck = verissimo_validate_catalog_categories(
  [],
  [['id' => 'category-1', 'slug' => 'brincos'], ['id' => 'category-1', 'slug' => 'aneis']]
);
assert_true(!$duplicateIdCategoryCheck['ok'], 'IDs de categoria duplicados são rejeitados');

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

// Product catalog validation and image orphan association are pure: no image directory access.
$validCatalogProducts = [[
  'id' => 'catalog-valid-1', 'price' => 0, 'salePrice' => 12.5, 'stock' => 0,
  'status' => 'active', 'images' => ['vp-20261104120000-photo.jpg'],
]];
assert_true(verissimo_validate_catalog_products($validCatalogProducts)['ok'], 'validacao aceita produto valido com preco legado zero');
$invalidCatalogCases = [
  'id vazio' => [['id' => ' ', 'price' => 10]],
  'id duplicado' => [['id' => 'dup', 'price' => 10], ['id' => 'dup', 'price' => 12]],
  'preco negativo' => [['id' => 'negative-price', 'price' => -0.01]],
  'estoque negativo' => [['id' => 'negative-stock', 'price' => 10, 'stock' => -1]],
  'status invalido' => [['id' => 'invalid-status', 'price' => 10, 'status' => 'published']],
];
foreach ($invalidCatalogCases as $label => $products) {
  assert_true(!verissimo_validate_catalog_products($products)['ok'], "validacao rejeita $label");
}
$orphanPrefix = 'vp-20261104120000';
assert_eq(
  verissimo_find_orphan_image_prefix_target([[
    'id' => 'time-only', 'updatedAt' => '2026-11-04T12:00:00Z', 'images' => ['other-prefix-photo.jpg'],
  ]], $orphanPrefix),
  null,
  'imagem orfa nao e associada somente pelo horario'
);
assert_eq(
  verissimo_find_orphan_image_prefix_target([[
    'id' => 'same-prefix', 'images' => [$orphanPrefix . '-existing.jpg'],
  ]], $orphanPrefix),
  0,
  'imagem pode ser associada por referencia existente com o mesmo prefixo'
);
$operationalSource = file_get_contents($root . '/api/operational_store.php');
assert_true(str_contains((string) $operationalSource, "':price_cents' => \$row['price_cents']"), 'sync grava price_cents calculado com preco promocional');

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

foreach (['integration_operational_test.php', 'session_csrf_test.php'] as $file) {
  $path = $root . '/tests/php/' . $file;
  if (!is_file($path)) continue;
  passthru(PHP_BINARY . ' ' . escapeshellarg($path), $code);
  if ($code !== 0) exit($code);
}

exit(0);
