<?php
/**
 * Exemplo — copie para config.local.php e preencha.
 *
 * Servidor Hostinger → host localhost
 * PC local → host = hostname do Remote MySQL no hPanel
 *
 * Login do admin: admin_email + admin_password_hash (hash somente no servidor).
 */
$httpHost = $_SERVER['HTTP_HOST'] ?? 'cli';
$isLocalDev = (bool) preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/i', $httpHost);
$remoteHost = 'COLOQUE_O_HOSTNAME_REMOTE_MYSQL_AQUI';

return [
  'host' => $isLocalDev ? $remoteHost : 'localhost',
  'port' => 3306,
  'name' => 'u586160337_verissimo',
  'user' => 'u586160337_verissimo',
  'pass' => 'COLOQUE_A_SENHA_DO_MYSQL_AQUI',
  'charset' => 'utf8mb4',

  /** Credenciais do painel /admin (ficam só no servidor) */
  'admin_email' => 'verissimopratass@gmail.com',
  // Gere com: php scripts/hash-admin-password.php
  'admin_password_hash' => 'COLE_AQUI_O_HASH_GERADO',

  /** Tokens estaticos nao sao aceitos para autenticacao administrativa. */

  'site_origin' => 'https://verissimopratas.com.br',
  /** true somente se o site estiver atrás de proxy/CDN confiável (ex.: Cloudflare) */
  'trust_proxy_headers' => false,
  'allowed_origins' => [
    'https://verissimopratas.com.br',
    'https://www.verissimopratas.com.br',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],

  /** Token SuperFrete da CONTA DA LOJA — Produção → Desenvolvedores */
  'superfrete_token' => '',
  'superfrete_env' => 'production',
  'origin_cep' => '37170000',
  'free_shipping_national' => 499,
  'free_shipping_local' => 159,
];
