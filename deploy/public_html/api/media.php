<?php
/**
 * Serve foto publicada em /uploads/products/ (fallback seguro na Hostinger)
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

$path = verissimo_uploads_dir() . '/' . $name;
if (!is_file($path)) {
  http_response_code(404);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Não encontrado';
  exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($path) ?: 'application/octet-stream';
header('Content-Type: ' . $mime);
header('Content-Length: ' . (string) filesize($path));
header('Cache-Control: public, max-age=31536000, immutable');
header('Access-Control-Allow-Origin: *');
readfile($path);
exit;
