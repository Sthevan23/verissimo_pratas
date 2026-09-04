<?php
/**
 * Headers comuns da API Verissimo
 */
function verissimo_api_headers(): void {
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, X-Verissimo-Token');
  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

function verissimo_json(array $payload, int $code = 200): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function verissimo_cfg(): array {
  return require __DIR__ . '/config.php';
}

/** Token de escrita (upload/salvar catálogo) — usa senha admin do .env / config */
function verissimo_write_token(): string {
  $cfg = verissimo_cfg();
  if (!empty($cfg['api_token'])) {
    return (string) $cfg['api_token'];
  }
  return 'Verissimo@2026';
}

function verissimo_require_write_token(): void {
  $token = $_SERVER['HTTP_X_VERISSIMO_TOKEN'] ?? '';
  if (!hash_equals(verissimo_write_token(), (string) $token)) {
    verissimo_json(['ok' => false, 'error' => 'Não autorizado'], 401);
  }
}

function verissimo_catalog_path(): string {
  $dir = __DIR__ . '/data';
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  return $dir . '/catalog.json';
}

function verissimo_uploads_dir(): string {
  $dir = dirname(__DIR__) . '/uploads/products';
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  return $dir;
}

/** Pasta persistente de imagens (junto do catalog.json — sobrevive melhor ao Git) */
function verissimo_images_dir(): string {
  $dir = __DIR__ . '/data/images';
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  return $dir;
}
