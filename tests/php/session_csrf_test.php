<?php
declare(strict_types=1);

$root = dirname(__DIR__, 2);
$tmp = sys_get_temp_dir() . '/verissimo_csrf_' . bin2hex(random_bytes(4));
mkdir($tmp, 0755, true);
putenv('VERISSIMO_TEST_DATA_DIR=' . $tmp);

require $root . '/api/helpers.php';

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

$token = bin2hex(random_bytes(16));
$sessions = [[
  'tokenHash' => hash('sha256', $token),
  'email' => 'a@test.com',
  'name' => 'Test',
  'role' => 'administrador',
  'expiresAt' => time() + 3600,
  'createdAt' => time(),
]];
file_put_contents(verissimo_sessions_path(), json_encode($sessions));

$legacy = verissimo_find_session($token);
assert_true($legacy === null, 'sessão legada sem csrfToken é ignorada');

$sessions[0]['csrfToken'] = hash('sha256', 'csrf-plain');
file_put_contents(verissimo_sessions_path(), json_encode($sessions));
$valid = verissimo_find_session($token);
assert_true(is_array($valid) && ($valid['email'] ?? '') === 'a@test.com', 'sessão com csrfToken válida');

array_map('unlink', glob($tmp . '/*') ?: []);
@rmdir($tmp);
putenv('VERISSIMO_TEST_DATA_DIR');

if ($failed > 0) {
  echo "\n$failed teste(s) CSRF falharam.\n";
  exit(1);
}
echo "\nTestes CSRF/sessão passaram.\n";
exit(0);
