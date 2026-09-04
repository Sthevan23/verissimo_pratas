<?php
/**
 * Grava o token SuperFrete em config.local.php (protegido pelo token admin).
 * POST JSON: { "token": "...", "env": "production", "origin_cep": "37170000" }
 * Header: X-Verissimo-Token
 */
require_once __DIR__ . '/helpers.php';
verissimo_api_headers();
verissimo_require_write_token();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  verissimo_json(['ok' => false, 'error' => 'Use POST'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '{}', true);
if (!is_array($body)) {
  verissimo_json(['ok' => false, 'error' => 'JSON inválido'], 400);
}

$token = trim((string) ($body['token'] ?? ''));
if ($token === '') {
  verissimo_json(['ok' => false, 'error' => 'Informe o token SuperFrete'], 400);
}

$env = strtolower(trim((string) ($body['env'] ?? 'production')));
if (!in_array($env, ['production', 'sandbox'], true)) {
  $env = 'production';
}

$origin = preg_replace('/\D+/', '', (string) ($body['origin_cep'] ?? '37170000'));
if (strlen($origin) !== 8) {
  $origin = '37170000';
}

$path = __DIR__ . '/config.local.php';
if (!is_file($path)) {
  verissimo_json(['ok' => false, 'error' => 'config.local.php não encontrado no servidor'], 500);
}

$src = file_get_contents($path);
if ($src === false) {
  verissimo_json(['ok' => false, 'error' => 'Não foi possível ler config.local.php'], 500);
}

$escape = static function (string $v): string {
  return str_replace(["\\", "'"], ["\\\\", "\\'"], $v);
};

$replacements = [
  'superfrete_token' => $escape($token),
  'superfrete_env' => $escape($env),
  'origin_cep' => $escape($origin),
];

foreach ($replacements as $key => $value) {
  $pattern = "/'" . preg_quote($key, '/') . "'\\s*=>\\s*'[^']*'/";
  $line = "'" . $key . "' => '" . $value . "'";
  if (preg_match($pattern, $src)) {
    $src = preg_replace($pattern, $line, $src, 1);
  } else {
    // Insere antes do fechamento do array
    $src = preg_replace('/\];\s*$/', "  " . $line . ",\n];\n", $src, 1);
  }
}

if (!isset($replacements['free_shipping_national']) && !preg_match("/'free_shipping_national'/", $src)) {
  $src = preg_replace(
    '/\];\s*$/',
    "  'free_shipping_national' => 499,\n  'free_shipping_local' => 159,\n];\n",
    $src,
    1
  );
}

if (file_put_contents($path, $src) === false) {
  verissimo_json(['ok' => false, 'error' => 'Falha ao gravar config.local.php'], 500);
}

verissimo_json([
  'ok' => true,
  'message' => 'Token SuperFrete configurado no servidor.',
  'env' => $env,
  'origin_cep' => $origin,
  'configured' => true,
]);
