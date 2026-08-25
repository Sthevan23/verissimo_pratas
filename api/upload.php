<?php
/**
 * Upload de fotos de produto
 * - salva em api/data/images/ (sobrevive ao Git da Hostinger)
 * - espelha no MySQL product_images quando possível
 * POST multipart: file
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
  $code = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
  verissimo_json(['ok' => false, 'error' => 'Nenhum arquivo enviado (código ' . $code . ')'], 400);
}

$maxBytes = 8 * 1024 * 1024;
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
$destDir = verissimo_images_dir();
$dest = $destDir . '/' . $name;
$bytes = (int) ($file['size'] ?? 0);
$blob = file_get_contents($file['tmp_name']);

if ($blob === false || !move_uploaded_file($file['tmp_name'], $dest)) {
  // fallback: escrever direto
  if ($blob === false || file_put_contents($dest, $blob) === false) {
    verissimo_json(['ok' => false, 'error' => 'Falha ao salvar arquivo no servidor. Verifique permissão de api/data/images.'], 500);
  }
}
@chmod($dest, 0644);
$bytes = (int) filesize($dest);

// Espelho MySQL (sobrevive a limpeza de arquivos)
try {
  require_once __DIR__ . '/db.php';
  $pdo = verissimo_db();
  $pdo->exec("CREATE TABLE IF NOT EXISTS `product_images` (
    `filename` VARCHAR(190) NOT NULL,
    `mime` VARCHAR(64) NOT NULL DEFAULT 'image/jpeg',
    `data` LONGBLOB NOT NULL,
    `bytes` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`filename`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  $stmt = $pdo->prepare('REPLACE INTO product_images (filename, mime, data, bytes) VALUES (?, ?, ?, ?)');
  $stmt->execute([$name, $mime, $blob !== false ? $blob : file_get_contents($dest), $bytes]);
} catch (Throwable $e) {
  // não bloqueia o upload se MySQL falhar
}

verissimo_json([
  'ok' => true,
  'url' => '/api/media.php?f=' . rawurlencode($name),
  'filename' => $name,
  'mime' => $mime,
  'bytes' => $bytes,
]);
