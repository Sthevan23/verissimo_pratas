<?php
/**
 * Serve foto: arquivo em api/data/images/ ou MySQL product_images
 * GET /api/media.php?f=vp-xxxx.jpg
 */
require __DIR__ . '/helpers.php';

$name = basename((string) ($_GET['f'] ?? ''));
if ($name === '' || !preg_match('/^vp-[a-zA-Z0-9._-]+\.(jpe?g|png|webp|gif)$/i', $name)) {
  http_response_code(400);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Arquivo inválido';
  exit;
}

$mime = null;
$bytes = null;
$data = null;

// 1) Disco (api/data/images)
$path = verissimo_images_dir() . '/' . $name;
if (is_file($path)) {
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->file($path) ?: 'application/octet-stream';
  $bytes = filesize($path);
  $data = file_get_contents($path);
}

// 2) MySQL fallback
if ($data === null || $data === false) {
  try {
    require_once __DIR__ . '/db.php';
    $pdo = verissimo_db();
    $stmt = $pdo->prepare('SELECT mime, data, bytes FROM product_images WHERE filename = ? LIMIT 1');
    $stmt->execute([$name]);
    $row = $stmt->fetch();
    if ($row) {
      $mime = $row['mime'] ?: 'application/octet-stream';
      $data = $row['data'];
      $bytes = (int) ($row['bytes'] ?? strlen((string) $data));
    }
  } catch (Throwable $e) {
    // ignore
  }
}

// 3) Caminho antigo uploads/products
if ($data === null || $data === false) {
  $legacy = dirname(__DIR__) . '/uploads/products/' . $name;
  if (is_file($legacy)) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($legacy) ?: 'application/octet-stream';
    $bytes = filesize($legacy);
    $data = file_get_contents($legacy);
  }
}

if ($data === null || $data === false) {
  http_response_code(404);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Não encontrado';
  exit;
}

header('Content-Type: ' . ($mime ?: 'application/octet-stream'));
header('Content-Length: ' . (string) ($bytes ?? strlen($data)));
header('Cache-Control: public, max-age=31536000, immutable');
header('Access-Control-Allow-Origin: *');
echo $data;
exit;
