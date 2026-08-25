<?php
/**
 * Serve foto: api/data/images/ → MySQL → uploads/products/
 * GET /api/media.php?f=vp-xxxx.jpg
 */
require __DIR__ . '/helpers.php';

try {
  $name = basename((string) ($_GET['f'] ?? ''));
  if ($name === '' || !preg_match('/^vp-[a-zA-Z0-9._-]+\.(jpe?g|png|webp|gif)$/i', $name)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Arquivo inválido';
    exit;
  }

  $mime = 'application/octet-stream';
  $data = null;

  // 1) Disco persistente
  $path = verissimo_images_dir() . DIRECTORY_SEPARATOR . $name;
  if (is_file($path) && is_readable($path)) {
    $raw = file_get_contents($path);
    if ($raw !== false && $raw !== '') {
      $data = $raw;
      if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detected = $finfo->buffer($data);
        if (is_string($detected) && $detected !== '') {
          $mime = $detected;
        }
      }
    }
  }

  // 2) MySQL
  if ($data === null) {
    try {
      require_once __DIR__ . '/db.php';
      $pdo = verissimo_db();
      $stmt = $pdo->prepare('SELECT mime, data, bytes FROM product_images WHERE filename = ? LIMIT 1');
      $stmt->execute([$name]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($row && isset($row['data'])) {
        $blob = $row['data'];
        if (is_resource($blob)) {
          $blob = stream_get_contents($blob);
        }
        if (is_string($blob) && $blob !== '') {
          $data = $blob;
          if (!empty($row['mime'])) {
            $mime = (string) $row['mime'];
          }
        }
      }
    } catch (Throwable $e) {
      // segue para legacy
    }
  }

  // 3) Legacy uploads/
  if ($data === null) {
    $legacy = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'products' . DIRECTORY_SEPARATOR . $name;
    if (is_file($legacy) && is_readable($legacy)) {
      $raw = file_get_contents($legacy);
      if ($raw !== false && $raw !== '') {
        $data = $raw;
      }
    }
  }

  if ($data === null) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Não encontrado';
    exit;
  }

  if (!is_string($data)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Dados inválidos';
    exit;
  }

  header('Content-Type: ' . $mime);
  header('Content-Length: ' . (string) strlen($data));
  header('Cache-Control: public, max-age=86400');
  header('Access-Control-Allow-Origin: *');
  echo $data;
  exit;
} catch (Throwable $e) {
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Erro ao servir imagem: ' . $e->getMessage();
  exit;
}
