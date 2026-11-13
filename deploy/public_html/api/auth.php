<?php
/**
 * Login admin — sessão no servidor
 * POST { email, password, remember? } → cookies HttpOnly + { ok, session }
 * POST { action: "logout" } — invalida sessão e cookies
 * GET  + header → { ok, session }
 */
require_once __DIR__ . '/helpers.php';
verissimo_api_headers();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $session = verissimo_find_session(verissimo_request_token());
  if ($session === null) {
    verissimo_json(['ok' => false, 'error' => 'Sessão inválida'], 401);
  }
  verissimo_json([
    'ok' => true,
    'session' => [
      'email' => $session['email'],
      'name' => $session['name'],
      'role' => $session['role'],
      'expiresAt' => ((int) $session['expiresAt']) * 1000,
    ],
  ]);
}

if ($method !== 'POST') {
  verissimo_json(['ok' => false, 'error' => 'Método não permitido'], 405);
}

verissimo_rate_limit('auth', 20, 600);

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '{}', true);
if (!is_array($body)) {
  verissimo_json(['ok' => false, 'error' => 'JSON inválido'], 400);
}

if (($body['action'] ?? '') === 'logout') {
  verissimo_destroy_session(verissimo_request_token());
  verissimo_clear_auth_cookies();
  verissimo_json(['ok' => true]);
}

$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');
$remember = !empty($body['remember']);

if ($email === '' || $password === '') {
  verissimo_json(['ok' => false, 'error' => 'Informe e-mail e senha'], 400);
}

$expectedEmail = strtolower(verissimo_admin_email());
$expectedPasswordHash = verissimo_admin_password_hash();

if (
  $expectedPasswordHash === ''
  || !hash_equals($expectedEmail, $email)
  || !verissimo_password_matches_hash($password, $expectedPasswordHash)
) {
  verissimo_json(['ok' => false, 'error' => 'Email ou senha inválidos.'], 401);
}

$created = verissimo_create_session($expectedEmail, 'Administrador', 'administrador', $remember);
verissimo_set_auth_cookies($created['token'], $created['csrf'], (int) $created['expiresAt']);

verissimo_json([
  'ok' => true,
  'session' => [
    'userId' => 'admin',
    'email' => $expectedEmail,
    'name' => 'Administrador',
    'role' => 'administrador',
    'expiresAt' => ((int) $created['expiresAt']) * 1000,
    'remember' => $remember,
  ],
]);
