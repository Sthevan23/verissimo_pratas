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

function verissimo_media_cache_dir(): string {
  $dir = verissimo_images_dir() . DIRECTORY_SEPARATOR . '_cache';
  if (!is_dir($dir)) {
    @mkdir($dir, 0755, true);
  }
  return $dir;
}

/**
 * Reduz JPEG/PNG/WEBP para largura máxima (retorna JPEG). Null = usar original.
 *
 * @return array{body: string, mime: string}|null
 */
function verissimo_resize_image_blob(string $data, int $maxW, int $quality = 76): ?array {
  $maxW = max(80, min(960, $maxW));
  if ($maxW <= 400) {
    $quality = min($quality, 72);
  } elseif ($maxW <= 720) {
    $quality = min($quality, 76);
  }
  if (!function_exists('imagecreatefromstring')) {
    return null;
  }
  $src = @imagecreatefromstring($data);
  if ($src === false) {
    return null;
  }
  $w = imagesx($src);
  $h = imagesy($src);
  if ($w <= 0 || $h <= 0) {
    imagedestroy($src);
    return null;
  }
  $newW = min($maxW, $w);
  $newH = (int) max(1, round($h * ($newW / $w)));
  $dst = imagecreatetruecolor($newW, $newH);
  if ($dst === false) {
    imagedestroy($src);
    return null;
  }
  imagealphablending($dst, true);
  if (!imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h)) {
    imagedestroy($src);
    imagedestroy($dst);
    return null;
  }
  imagedestroy($src);
  ob_start();
  imagejpeg($dst, null, $quality);
  $body = ob_get_clean();
  imagedestroy($dst);
  if (!is_string($body) || $body === '') {
    return null;
  }
  return ['body' => $body, 'mime' => 'image/jpeg'];
}

function verissimo_product_image_url(string $filename): string {
  return '/api/media.php?f=' . rawurlencode($filename) . '&v=20260907c';
}

/** Extrai nome de arquivo vp-*.jpg de uma URL ou path de imagem do catálogo. */
function verissimo_catalog_image_filename(string $url): ?string {
  if (preg_match('/[?&]f=([^&]+)/i', $url, $m)) {
    return rawurldecode($m[1]);
  }
  if (preg_match('/(vp-[a-zA-Z0-9._-]+\.(jpe?g|png|webp|gif))$/i', $url, $m)) {
    return $m[1];
  }
  return null;
}

/**
 * Fotos enviadas ao servidor que ainda não estão em nenhum produto — vincula ao produto
 * editado na mesma hora (ou que já usa outra foto do mesmo lote).
 *
 * @return array{products: array, linked: int, orphans: string[]}
 */
function verissimo_reconcile_orphan_images(array $products): array {
  $referenced = [];
  foreach ($products as $p) {
    if (!is_array($p)) continue;
    foreach ($p['images'] ?? [] as $img) {
      if (!is_string($img)) continue;
      $name = verissimo_catalog_image_filename($img);
      if ($name !== null) $referenced[$name] = true;
    }
  }

  $dir = verissimo_images_dir();
  $patterns = [$dir . '/vp-*.jpg', $dir . '/vp-*.jpeg', $dir . '/vp-*.png', $dir . '/vp-*.webp'];
  $diskFiles = [];
  foreach ($patterns as $pattern) {
    foreach (glob($pattern) ?: [] as $path) {
      $diskFiles[] = basename($path);
    }
  }

  $orphans = array_values(array_filter($diskFiles, static fn($f) => !isset($referenced[$f])));
  if ($orphans === []) {
    return ['products' => $products, 'linked' => 0, 'orphans' => []];
  }

  $byPrefix = [];
  foreach ($orphans as $filename) {
    if (!preg_match('/^(vp-\d{14})-/i', $filename, $m)) continue;
    $byPrefix[strtolower($m[1])][] = $filename;
  }

  $linked = 0;
  $linkedNames = [];

  foreach ($byPrefix as $prefix => $files) {
    $targetIdx = null;

    foreach ($products as $idx => $p) {
      if (!is_array($p)) continue;
      foreach ($p['images'] ?? [] as $img) {
        if (!is_string($img)) continue;
        $name = verissimo_catalog_image_filename($img);
        if ($name !== null && stripos($name, $prefix) === 0) {
          $targetIdx = $idx;
          break 2;
        }
      }
    }

    if ($targetIdx === null && preg_match('/^vp-(\d{14})$/i', $prefix, $m)) {
      $uploadAt = DateTime::createFromFormat('YmdHis', $m[1]);
      if ($uploadAt instanceof DateTime) {
        $uploadTs = $uploadAt->getTimestamp();
        $bestIdx = null;
        $bestDiff = 999999;
        foreach ($products as $idx => $p) {
          if (!is_array($p)) continue;
          $raw = (string) ($p['updatedAt'] ?? $p['createdAt'] ?? '');
          $updatedTs = strtotime($raw);
          if ($updatedTs === false) continue;
          $diff = abs($updatedTs - $uploadTs);
          if ($diff <= 300 && $diff < $bestDiff) {
            $bestDiff = $diff;
            $bestIdx = $idx;
          }
        }
        $targetIdx = $bestIdx;
      }
    }

    if ($targetIdx === null) continue;

    $images = $products[$targetIdx]['images'] ?? [];
    if (!is_array($images)) $images = [];
    $existing = [];
    foreach ($images as $img) {
      if (is_string($img)) {
        $n = verissimo_catalog_image_filename($img);
        if ($n !== null) $existing[$n] = true;
      }
    }

    foreach ($files as $filename) {
      if (isset($existing[$filename])) continue;
      $images[] = verissimo_product_image_url($filename);
      $existing[$filename] = true;
      $linkedNames[] = $filename;
      $linked++;
    }

    $products[$targetIdx]['images'] = array_values($images);
    $products[$targetIdx]['updatedAt'] = gmdate('c');
  }

  $remaining = array_values(array_filter($orphans, static fn($f) => !in_array($f, $linkedNames, true)));

  return ['products' => $products, 'linked' => $linked, 'orphans' => $remaining];
}

function verissimo_is_brincos_category(string $cat): bool {
  return in_array($cat, ['brincos', 'brincos-duplas', 'brincos-trios'], true);
}

function verissimo_is_pulseiras_category(string $cat): bool {
  return in_array($cat, ['pulseiras', 'pulseiras-braceletes', 'pulseiras-infantil'], true);
}

function verissimo_detect_category_from_text(string $name, string $slug, string $description = ''): ?string {
  $text = mb_strtolower("$name $slug $description", 'UTF-8');
  if (preg_match('/personalizad|encomenda|sob medida/u', $text)) {
    if (preg_match('/anel|alian[cç]a/u', $text)) return 'personalizados-aneis';
    if (preg_match('/colar|choker|escapul/u', $text)) return 'personalizados-colares';
    if (preg_match('/pulseira|bracelete/u', $text)) return 'personalizados-pulseiras';
    if (preg_match('/berloque/u', $text)) return 'personalizados-berloques';
    if (preg_match('/chaveiro/u', $text)) return 'personalizados-chaveiros';
    if (preg_match('/pingente/u', $text)) return 'personalizados-pingentes';
    return 'personalizados';
  }
  if (preg_match('/conjunto/u', $text)) return 'conjuntos';
  if (preg_match('/tornozeleira/u', $text)) return 'tornozeleiras';
  if (preg_match('/masculin/u', $text)) {
    if (preg_match('/corrente/u', $text)) return 'masculinos-corrente';
    if (preg_match('/pulseira/u', $text)) return 'masculinos-pulseira';
    if (preg_match('/pingente/u', $text)) return 'masculinos-pingente';
    return 'masculinos';
  }
  if (preg_match('/piercing|helix|tragus|septo|umbigo|labret|daith/u', $text)) return 'piercings';
  if (preg_match('/colar|choker|escapul/u', $text)) return 'colares';
  if (preg_match('/corrente/u', $text)) return 'correntes';
  if (preg_match('/pingente/u', $text)) return 'pingentes';
  if (preg_match('/berloque/u', $text)) {
    if (preg_match('/pulseira.*berloque|berloque.*pulseira|para berloques/u', $text)) return 'berloques-pulseiras';
    return 'berloques';
  }
  if (preg_match('/brinco/u', $text)) return 'brincos';
  if (preg_match('/pulseira|bracelete/u', $text)) {
    if (preg_match('/infantil|crian[cç]a|baby|kids/u', $text)) return 'pulseiras-infantil';
    if (preg_match('/bracelete|bracelet/u', $text)) return 'pulseiras-braceletes';
    return 'pulseiras';
  }
  if (preg_match('/anel|alian[cç]a/u', $text)) return 'aneis';
  if (preg_match('/acess|limpa prata|organizador|porta.?joia/u', $text)) return 'acessorios';
  return null;
}

function verissimo_storefront_family(string $cat): string {
  if (verissimo_is_brincos_category($cat)) return 'brincos';
  if ($cat === 'piercings') return 'piercings';
  if ($cat === 'colares') return 'colares';
  if (verissimo_is_pulseiras_category($cat)) return 'pulseiras';
  if ($cat === 'aneis') return 'aneis';
  if (in_array($cat, ['berloques', 'berloques-pulseiras'], true)) return 'berloques';
  if ($cat === 'personalizados' || str_starts_with($cat, 'personalizados-')) return 'personalizados';
  if ($cat === 'masculinos' || str_starts_with($cat, 'masculinos-') || $cat === 'linha-masculina') return 'masculinos';
  return $cat;
}

function verissimo_refine_brincos_subcategory(string $category, string $name): string {
  if (!verissimo_is_brincos_category($category)) return $category;
  if (preg_match('/\btrio\b/i', $name)) return 'brincos-trios';
  if (preg_match('/\bdupla(s)?\b/i', $name)) return 'brincos-duplas';
  return 'brincos';
}

function verissimo_normalize_product_category(array $product): array {
  $name = (string) ($product['name'] ?? '');
  $slug = (string) ($product['slug'] ?? '');
  $desc = (string) ($product['description'] ?? '');
  $current = (string) ($product['category'] ?? 'brincos');
  $detected = verissimo_detect_category_from_text($name, $slug, $desc);
  $next = $current;

  if ($detected !== null) {
    $sameFamily = verissimo_storefront_family($detected) === verissimo_storefront_family($current);
    if (!$sameFamily) {
      $next = verissimo_is_brincos_category($detected)
        ? verissimo_refine_brincos_subcategory($detected, $name)
        : $detected;
    }
  }

  if (verissimo_is_brincos_category($next)) {
    $next = verissimo_refine_brincos_subcategory($next, $name);
  } elseif ($next === 'pulseiras') {
    if (preg_match('/bracelete|bracelet/i', $name)) $next = 'pulseiras-braceletes';
    elseif (preg_match('/infantil|crian[cç]a|baby|kids/i', $name)) $next = 'pulseiras-infantil';
  } elseif ($next === 'berloques' && preg_match('/pulseira.*berloque|berloque.*pulseira|para berloques/i', "$name $desc")) {
    $next = 'berloques-pulseiras';
  }

  if ($next !== $current) {
    $product['category'] = $next;
    $product['updatedAt'] = gmdate('c');
  }
  return $product;
}

/** @return array{products: array, changed: bool} */
function verissimo_reconcile_product_categories(array $products): array {
  $out = [];
  $changed = false;
  foreach ($products as $p) {
    if (!is_array($p)) {
      $out[] = $p;
      continue;
    }
    $before = (string) ($p['category'] ?? '');
    $p = verissimo_normalize_product_category($p);
    if ((string) ($p['category'] ?? '') !== $before) $changed = true;
    $out[] = $p;
  }
  return ['products' => $out, 'changed' => $changed];
}
