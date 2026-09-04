<?php
/**
 * Carrega config MySQL. Preferência: config.local.php (não versionado).
 */
$local = __DIR__ . '/config.local.php';
$example = __DIR__ . '/config.local.example.php';

if (is_file($local)) {
  return require $local;
}

if (is_file($example)) {
  return require $example;
}

return [
  'host' => getenv('VERISSIMO_DB_HOST') ?: 'localhost',
  'port' => (int) (getenv('VERISSIMO_DB_PORT') ?: 3306),
  'name' => getenv('VERISSIMO_DB_NAME') ?: 'u586160337_verissimo',
  'user' => getenv('VERISSIMO_DB_USER') ?: 'u586160337_verissimo',
  'pass' => getenv('VERISSIMO_DB_PASS') ?: '',
  'charset' => 'utf8mb4',
  /** Token para upload/salvar catálogo (mesmo valor da senha admin) */
  'api_token' => getenv('VERISSIMO_API_TOKEN') ?: 'Verissimo@2026',
  'superfrete_token' => getenv('SUPERFRETE_TOKEN') ?: '',
  'superfrete_env' => getenv('SUPERFRETE_ENV') ?: 'production',
  'origin_cep' => getenv('VERISSIMO_ORIGIN_CEP') ?: '37170000',
  'free_shipping_national' => 499,
  'free_shipping_local' => 159,
];
