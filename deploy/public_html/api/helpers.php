<?php
/**
 * Headers comuns + autenticação admin (sessão no servidor)
 */
function verissimo_api_headers(): void {
  header('Content-Type: application/json; charset=utf-8');

  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $allowed = verissimo_allowed_origins();
  if ($origin !== '' && in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
  } elseif ($origin === '') {
    // same-origin / tools sem Origin
    header('Access-Control-Allow-Origin: ' . verissimo_primary_origin());
  }
  header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, X-Verissimo-Token');
  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

function verissimo_cfg(): array {
  return require __DIR__ . '/config.php';
}

function verissimo_primary_origin(): string {
  $cfg = verissimo_cfg();
  if (!empty($cfg['site_origin'])) {
    return rtrim((string) $cfg['site_origin'], '/');
  }
  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
  $host = $_SERVER['HTTP_HOST'] ?? 'verissimopratas.com.br';
  return ($https ? 'https://' : 'http://') . $host;
}

function verissimo_allowed_origins(): array {
  $cfg = verissimo_cfg();
  $list = $cfg['allowed_origins'] ?? null;
  if (is_array($list) && count($list) > 0) {
    return array_values(array_map(static fn($o) => rtrim((string) $o, '/'), $list));
  }
  return [
    verissimo_primary_origin(),
    'https://verissimopratas.com.br',
    'https://www.verissimopratas.com.br',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
}

function verissimo_json(array $payload, int $code = 200): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function verissimo_data_dir(): string {
  $dir = __DIR__ . '/data';
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  return $dir;
}

function verissimo_sessions_path(): string {
  return verissimo_data_dir() . '/sessions.json';
}

function verissimo_read_sessions(): array {
  $path = verissimo_sessions_path();
  if (!is_file($path)) return [];
  $fp = fopen($path, 'c+');
  if ($fp === false) return [];
  flock($fp, LOCK_SH);
  $raw = stream_get_contents($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

function verissimo_write_sessions(array $sessions): void {
  $path = verissimo_sessions_path();
  $fp = fopen($path, 'c+');
  if ($fp === false) {
    verissimo_json(['ok' => false, 'error' => 'Falha ao gravar sessão'], 500);
  }
  flock($fp, LOCK_EX);
  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode($sessions, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
}

function verissimo_admin_email(): string {
  $cfg = verissimo_cfg();
  $email = trim((string) ($cfg['admin_email'] ?? getenv('VERISSIMO_ADMIN_EMAIL') ?: ''));
  return $email !== '' ? $email : 'verissimopratass@gmail.com';
}

function verissimo_admin_password(): string {
  $cfg = verissimo_cfg();
  $pass = (string) ($cfg['admin_password'] ?? getenv('VERISSIMO_ADMIN_PASSWORD') ?: '');
  if ($pass !== '') return $pass;
  // Compat: usa api_token como senha se admin_password ainda não foi definido
  return (string) ($cfg['api_token'] ?? '');
}

function verissimo_create_session(string $email, string $name, string $role, bool $remember): string {
  $token = bin2hex(random_bytes(32));
  $ttl = $remember ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
  $sessions = verissimo_read_sessions();
  $now = time();
  // limpa expiradas
  $sessions = array_values(array_filter($sessions, static function ($s) use ($now) {
    return is_array($s) && (int) ($s['expiresAt'] ?? 0) > $now;
  }));
  $sessions[] = [
    'tokenHash' => hash('sha256', $token),
    'email' => $email,
    'name' => $name,
    'role' => $role,
    'expiresAt' => $now + $ttl,
    'createdAt' => $now,
  ];
  verissimo_write_sessions($sessions);
  return $token;
}

function verissimo_find_session(?string $token): ?array {
  if ($token === null || $token === '') return null;
  $hash = hash('sha256', $token);
  $now = time();
  $sessions = verissimo_read_sessions();
  $changed = false;
  $found = null;
  $kept = [];
  foreach ($sessions as $s) {
    if (!is_array($s)) {
      $changed = true;
      continue;
    }
    if ((int) ($s['expiresAt'] ?? 0) <= $now) {
      $changed = true;
      continue;
    }
    if (hash_equals((string) ($s['tokenHash'] ?? ''), $hash)) {
      $found = $s;
    }
    $kept[] = $s;
  }
  if ($changed) {
    verissimo_write_sessions($kept);
  }
  return $found;
}

function verissimo_destroy_session(?string $token): void {
  if ($token === null || $token === '') return;
  $hash = hash('sha256', $token);
  $sessions = verissimo_read_sessions();
  $sessions = array_values(array_filter($sessions, static function ($s) use ($hash) {
    return !is_array($s) || !hash_equals((string) ($s['tokenHash'] ?? ''), $hash);
  }));
  verissimo_write_sessions($sessions);
}

function verissimo_request_token(): string {
  return trim((string) ($_SERVER['HTTP_X_VERISSIMO_TOKEN'] ?? ''));
}

/**
 * Exige sessão admin válida (token retornado por /api/auth.php).
 * Não aceita mais senha/api_token estático vindo do JavaScript.
 */
function verissimo_require_write_token(): void {
  $session = verissimo_find_session(verissimo_request_token());
  if ($session === null) {
    verissimo_json(['ok' => false, 'error' => 'Não autorizado. Faça login no admin.'], 401);
  }
}

function verissimo_catalog_path(): string {
  return verissimo_data_dir() . '/catalog.json';
}

function verissimo_orders_path(): string {
  return verissimo_data_dir() . '/orders.json';
}

function verissimo_uploads_dir(): string {
  $dir = dirname(__DIR__) . '/uploads/products';
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  return $dir;
}

function verissimo_images_dir(): string {
  $dir = __DIR__ . '/data/images';
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  return $dir;
}

function verissimo_rate_limit(string $bucket, int $max, int $windowSec): void {
  $dir = verissimo_data_dir() . '/rate';
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  $ip = $_SERVER['HTTP_CF_CONNECTING_IP']
    ?? $_SERVER['HTTP_X_FORWARDED_FOR']
    ?? $_SERVER['REMOTE_ADDR']
    ?? 'unknown';
  if (str_contains((string) $ip, ',')) {
    $ip = trim(explode(',', (string) $ip)[0]);
  }
  $file = $dir . '/' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $bucket . '_' . $ip) . '.json';
  $now = time();
  $fp = fopen($file, 'c+');
  if ($fp === false) return;
  flock($fp, LOCK_EX);
  $raw = stream_get_contents($fp);
  $data = json_decode($raw ?: '{}', true);
  if (!is_array($data)) $data = [];
  $start = (int) ($data['start'] ?? $now);
  $count = (int) ($data['count'] ?? 0);
  if ($now - $start >= $windowSec) {
    $start = $now;
    $count = 0;
  }
  $count++;
  if ($count > $max) {
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode(['start' => $start, 'count' => $count]));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    verissimo_json(['ok' => false, 'error' => 'Muitas tentativas. Aguarde um pouco.'], 429);
  }
  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode(['start' => $start, 'count' => $count]));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
}
