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
];
