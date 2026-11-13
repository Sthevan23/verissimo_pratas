<?php
/**
 * Hashes the credential that the legacy login would have accepted.
 * Reads configuration only; it never prints or modifies the source credential
 * or config.local.php. The only output on success is the password hash.
 */
function verissimo_hash_legacy_admin_credential(
  array $config,
  ?string $legacyPasswordEnv = null,
  ?string $legacyApiTokenEnv = null
): string {
  if (array_key_exists('admin_password', $config) && $config['admin_password'] !== null) {
    $legacy = (string) $config['admin_password'];
  } else {
    $legacy = (string) ($legacyPasswordEnv ?? '');
  }

  if ($legacy === '') {
    $legacy = (string) ($config['api_token'] ?? $legacyApiTokenEnv ?? '');
  }
  if ($legacy === '') {
    throw new RuntimeException('Nenhuma credencial legada foi encontrada.');
  }

  $hash = password_hash($legacy, PASSWORD_DEFAULT);
  if (!is_string($hash) || $hash === '' || !password_verify($legacy, $hash)) {
    throw new RuntimeException('Falha ao gerar/verificar o hash.');
  }
  return $hash;
}

function verissimo_hash_admin_password_main(?string $configPathOverride = null): int {
  if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Execute este utilitario apenas pela CLI do PHP.\n");
    return 1;
  }

  $configPath = $configPathOverride ?? (dirname(__DIR__) . '/api/config.php');
  if (!is_file($configPath)) {
    fwrite(STDERR, "api/config.php nao encontrado.\n");
    return 1;
  }

  try {
    $config = require $configPath;
    if (!is_array($config)) {
      throw new RuntimeException('Configuracao invalida.');
    }
    $hash = verissimo_hash_legacy_admin_credential(
      $config,
      getenv('VERISSIMO_ADMIN_PASSWORD') !== false ? (string) getenv('VERISSIMO_ADMIN_PASSWORD') : null,
      getenv('VERISSIMO_API_TOKEN') !== false ? (string) getenv('VERISSIMO_API_TOKEN') : null
    );
    fwrite(STDOUT, $hash . PHP_EOL);
    return 0;
  } catch (Throwable $e) {
    fwrite(STDERR, "Falha na migracao; verifique a configuracao sem compartilhar valores.\n");
    return 1;
  }
}

if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
  $configPathOverride = null;
  if (isset($argv[1])) {
    if (str_starts_with($argv[1], '--config=')) {
      $configPathOverride = substr($argv[1], strlen('--config='));
    } else {
      fwrite(STDERR, "Uso: php scripts/hash-admin-password.php [--config=ARQUIVO]\n");
      exit(1);
    }
  }
  exit(verissimo_hash_admin_password_main($configPathOverride));
}
