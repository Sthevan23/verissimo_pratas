<?php
/**
 * Credenciais MySQL Hostinger — NÃO versionar (gitignore).
 */
$httpHost = $_SERVER['HTTP_HOST'] ?? 'cli';
$isLocalDev = (bool) preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/i', $httpHost);
$remoteHost = 'COLOQUE_O_HOSTNAME_REMOTE_MYSQL_AQUI';

return [
  'host' => $isLocalDev ? $remoteHost : 'localhost',
  'port' => 3306,
  'name' => 'u586160337_verissimo',
  'user' => 'u586160337_verissimo',
  'pass' => 'Sh100901',
  'charset' => 'utf8mb4',
];
