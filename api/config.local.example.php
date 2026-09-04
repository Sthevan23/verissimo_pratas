<?php
/**
 * Exemplo — copie para config.local.php e preencha a senha.
 *
 * Servidor Hostinger → host localhost
 * PC local → host = hostname do Remote MySQL no hPanel
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
  'api_token' => 'Verissimo@2026',
  /** Token da API SuperFrete (Integrações → API no painel web.superfrete.com) */
  'superfrete_token' => '',
  /** production | sandbox */
  'superfrete_env' => 'production',
  /** CEP de origem da loja (Boa Esperança — MG) */
  'origin_cep' => '37170000',
  'free_shipping_national' => 499,
  'free_shipping_local' => 159,
];
