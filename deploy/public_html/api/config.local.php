<?php
/**
 * Credenciais MySQL Hostinger — NÃO versionar (gitignore).
 * SuperFrete: cole o token da CONTA DA CLIENTE (Produção → Desenvolvedores).
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
  'api_token' => 'Verissimo@2026',
  /** Cole aqui o token SuperFrete da cliente (web.superfrete.com → Desenvolvedores) */
  'superfrete_token' => '',
  'superfrete_env' => 'production',
  'origin_cep' => '37170000',
  'free_shipping_national' => 499,
  'free_shipping_local' => 159,
];
