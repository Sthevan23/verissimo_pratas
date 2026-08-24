<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

try {
  require_once __DIR__ . '/db.php';
  $pdo = verissimo_db();
  $tables = (int) $pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn();
  $products = 0;
  $hasProducts = $pdo->query(
    "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' LIMIT 1"
  )->fetchColumn();
  if ($hasProducts) {
    $products = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
  }
  echo json_encode([
    'ok' => true,
    'database' => $pdo->query('SELECT DATABASE()')->fetchColumn(),
    'tables' => $tables,
    'products' => $products,
    'ts' => time(),
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => $e->getMessage(),
    'ts' => time(),
  ]);
}
