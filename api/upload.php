<?php
/**
 * Upload de fotos de produto → /uploads/products/
 * POST multipart: file (ou image)
 * Header: X-Verissimo-Token
 */
require __DIR__ . '/helpers.php';
verissimo_api_headers();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  verissimo_json(['ok' => false, 'error' => 'Método não permitido'], 405);
}

verissimo_require_write_token();

$file = $_FILES['file'] ?? $_FILES['image'] ?? null;
if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  verissimo_json(['ok' => false, 'error' => 'Nenhum arquivo enviado'], 400);
}

$maxBytes = 8 * 1024 * 1024; // 8MB
if (($file['size'] ?? 0) > $maxBytes) {
  verissimo_json(['ok' => false, 'error' => 'Arquivo muito grande (máx. 8MB)'], 400);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']) ?: ($file['type'] ?? '');
$allowed = [
  'image/jpeg' => 'jpg',
  'image/png' => 'png',
  'image/webp' => 'webp',
  'image/gif' => 'gif',
];
if (!isset($allowed[$mime])) {
  verissimo_json(['ok' => false, 'error' => 'Formato inválido. Use JPG, PNG ou WEBP.'], 400);
}

$ext = $allowed[$mime];
$name = 'vp-' . date('YmdHis') . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
$destDir = verissimo_uploads_dir();
$dest = $destDir . '/' . $name;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
  verissimo_json(['ok' => false, 'error' => 'Falha ao salvar arquivo no servidor'], 500);
}

@chmod($dest, 0644);

$url = '/api/media.php?f=' . rawurlencode($name);
verissimo_json([
  'ok' => true,
  'url' => $url,
  'path' => '/uploads/products/' . $name,
  'filename' => $name,
  'mime' => $mime,
  'bytes' => (int) filesize($dest),
]);
