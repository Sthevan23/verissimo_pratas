<?php
/**
 * Exemplo — copie para config.local.php e preencha.
 *
 * Servidor Hostinger → host localhost
 * PC local → host = hostname do Remote MySQL no hPanel
 *
 * Login do admin: admin_email + admin_password (NÃO vão no JavaScript do site).
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
  'admin_password' => 'COLOQUE_UMA_SENHA_FORTE',

  /** Token legado interno (não use no frontend). Login usa admin_password. */
  'api_token' => 'GERE_UM_TOKEN_ALEATORIO_LONGO',

  'site_origin' => 'https://verissimopratas.com.br',
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
