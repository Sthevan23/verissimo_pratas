<?php
/**
 * Diagnóstico do banco — restrito ao administrador (token de sessão).
 * Não expõe nome do banco, usuário nem mensagens de erro do PDO.
 */
require_once __DIR__ . '/helpers.php';
verissimo_api_headers();
verissimo_require_write_token();

try {
  require_once __DIR__ . '/db.php';
  $pdo = verissimo_db();
  $tables = (int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn();
  verissimo_json([
    'ok' => true,
    'tables' => $tables,
    'ts' => time(),
  ]);
} catch (Throwable $e) {
  error_log('ping-db: ' . get_class($e));
  verissimo_json(['ok' => false, 'error' => 'Banco indisponível', 'ts' => time()], 500);
}
