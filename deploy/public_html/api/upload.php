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
  $messages = [
    UPLOAD_ERR_INI_SIZE => 'Arquivo muito grande para o servidor.',
    UPLOAD_ERR_FORM_SIZE => 'Arquivo muito grande.',
    UPLOAD_ERR_PARTIAL => 'Upload incompleto. Tente de novo.',
    UPLOAD_ERR_NO_FILE => 'Nenhum arquivo enviado.',
    UPLOAD_ERR_NO_TMP_DIR => 'Servidor sem pasta temporária.',
    UPLOAD_ERR_CANT_WRITE => 'Servidor não conseguiu gravar o arquivo.',
    UPLOAD_ERR_EXTENSION => 'Upload bloqueado pelo servidor.',
  ];
  $msg = $messages[$code] ?? ('Nenhum arquivo enviado (código ' . $code . ')');
  verissimo_json(['ok' => false, 'error' => $msg], 400);
}

$maxBytes = 12 * 1024 * 1024;
if (($file['size'] ?? 0) > $maxBytes) {
  verissimo_json(['ok' => false, 'error' => 'Arquivo muito grande (máx. 12MB)'], 400);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']) ?: ($file['type'] ?? '');
$allowed = [
  'image/jpeg' => 'jpg',
  'image/png' => 'png',
  'image/webp' => 'webp',
  'image/gif' => 'gif',
  'image/heic' => 'jpg',
  'image/heif' => 'jpg',
  'image/heic-sequence' => 'jpg',
];
// iOS às vezes manda application/octet-stream ou vazio
if (!isset($allowed[$mime])) {
  $ext = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
  $extMap = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif', 'heic' => 'image/heic', 'heif' => 'image/heif'];
  if (isset($extMap[$ext])) {
    $mime = $extMap[$ext];
  }
}
if (!isset($allowed[$mime])) {
  verissimo_json(['ok' => false, 'error' => 'Formato inválido. Use JPG, PNG, WEBP ou foto da galeria do celular.'], 400);
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
