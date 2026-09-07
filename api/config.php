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
  'admin_email' => getenv('VERISSIMO_ADMIN_EMAIL') ?: 'verissimopratass@gmail.com',
  'admin_password' => getenv('VERISSIMO_ADMIN_PASSWORD') ?: '',
  /** Legado — login usa admin_password; se vazio, admin_password cai neste valor */
  'api_token' => getenv('VERISSIMO_API_TOKEN') ?: '',
  'site_origin' => getenv('VERISSIMO_SITE_ORIGIN') ?: 'https://verissimopratas.com.br',
  'superfrete_token' => getenv('SUPERFRETE_TOKEN') ?: '',
  'superfrete_env' => getenv('SUPERFRETE_ENV') ?: 'production',
  'origin_cep' => getenv('VERISSIMO_ORIGIN_CEP') ?: '37170000',
  'free_shipping_national' => 499,
  'free_shipping_local' => 159,
];
