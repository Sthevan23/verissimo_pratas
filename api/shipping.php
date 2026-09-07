<?php
/**
 * Cotação de frete via SuperFrete (PAC / SEDEX / Mini Envios — Correios).
 * POST JSON: { "cep": "37170-000", "subtotal": 289, "items": [{ "quantity": 1 }] }
 */
require_once __DIR__ . '/helpers.php';
verissimo_api_headers();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  verissimo_json(['ok' => false, 'error' => 'Use POST'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '{}', true);
if (!is_array($body)) {
  verissimo_json(['ok' => false, 'error' => 'JSON inválido'], 400);
}

$cep = preg_replace('/\D+/', '', (string) ($body['cep'] ?? ''));
if (strlen($cep) !== 8) {
  verissimo_json(['ok' => false, 'error' => 'Informe um CEP válido com 8 dígitos'], 400);
}

$subtotal = (float) ($body['subtotal'] ?? 0);
$items = $body['items'] ?? [];
if (!is_array($items) || count($items) === 0) {
  $items = [['quantity' => 1]];
}

$cfg = verissimo_cfg();
$token = trim((string) ($cfg['superfrete_token'] ?? getenv('SUPERFRETE_TOKEN') ?: ''));
$originCep = preg_replace('/\D+/', '', (string) ($cfg['origin_cep'] ?? '37170000'));
if (strlen($originCep) !== 8) {
  $originCep = '37170000';
}

$freeNational = (float) ($cfg['free_shipping_national'] ?? 499);
$freeLocal = (float) ($cfg['free_shipping_local'] ?? 159);

$address = verissimo_lookup_cep($cep);
$isLocal =
  $address
  && (
    stripos((string) ($address['localidade'] ?? ''), 'boa esperan') !== false
    || (string) ($address['ibge'] ?? '') === '3107109'
  );

$totalQty = 0;
foreach ($items as $item) {
  $totalQty += max(1, (int) ($item['quantity'] ?? 1));
}
if ($totalQty < 1) {
  $totalQty = 1;
}

$options = [];

if ($isLocal && $subtotal >= $freeLocal) {
  $options[] = [
    'id' => 'local-gratis',
    'name' => 'Entrega local — Boa Esperança',
    'company' => 'Verissimo',
    'price' => 0,
    'delivery_time' => 1,
    'currency' => 'R$',
    'free' => true,
  ];
}

$quotes = [];
$error = null;

if ($token === '') {
  // Sem token: ainda permite finalizar com frete a combinar no WhatsApp
  $error = 'Cotação SuperFrete pendente — frete a combinar no WhatsApp.';
} else {
  $env = strtolower((string) ($cfg['superfrete_env'] ?? 'production'));
  $base = $env === 'sandbox'
    ? 'https://sandbox.superfrete.com'
    : 'https://api.superfrete.com';

  $headers = [
    'Accept: application/json',
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token,
    'User-Agent: VerissimoPratas/1.0 (verissimopratass@gmail.com)',
  ];

  // Duas cotações: Mini (pacote pequeno) + PAC/SEDEX (mínimos Correios)
  $requests = [
    [
      'services' => '17',
      'package' => [
        'height' => 4,
        'width' => 12,
        'length' => 16,
        'weight' => 0.3,
      ],
      'insurance' => 26.0,
    ],
    [
      'services' => '1,2',
      'package' => [
        'height' => 4,
        'width' => 16,
        'length' => 24,
        'weight' => 0.3,
      ],
      'insurance' => 26.0,
    ],
  ];

  $errors = [];
  foreach ($requests as $req) {
    $payload = [
      'from' => ['postal_code' => $originCep],
      'to' => ['postal_code' => $cep],
      'services' => $req['services'],
      'options' => [
        'own_hand' => false,
        'receipt' => false,
        'insurance_value' => $req['insurance'],
        'use_insurance_value' => true,
      ],
      'package' => $req['package'],
    ];

    $ch = curl_init($base . '/api/v0/calculator');
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
      CURLOPT_TIMEOUT => 25,
    ]);
    $resp = curl_exec($ch);
    $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($resp === false) {
      $errors[] = $curlErr ?: 'sem resposta';
      continue;
    }

    $data = json_decode($resp, true);
    if ($http >= 400 || !is_array($data)) {
      $errors[] = is_array($data)
        ? (string) ($data['message'] ?? $data['error'] ?? 'Erro na cotação')
        : 'Erro na cotação SuperFrete';
      continue;
    }

    $list = isset($data[0]) ? $data : (isset($data['data']) && is_array($data['data']) ? $data['data'] : [$data]);
    foreach ($list as $row) {
      if (!is_array($row)) continue;
      if (!empty($row['error'])) {
        $errors[] = (string) ($row['name'] ?? 'serviço') . ': ' . (is_string($row['error']) ? $row['error'] : json_encode($row['error'], JSON_UNESCAPED_UNICODE));
        continue;
      }
      if (isset($row['price']) === false) continue;
      $price = (float) $row['price'];
      $company = '';
      if (isset($row['company']) && is_array($row['company'])) {
        $company = (string) ($row['company']['name'] ?? '');
      } elseif (isset($row['company']) && is_string($row['company'])) {
        $company = $row['company'];
      }
      $id = (string) ($row['id'] ?? $row['service'] ?? uniqid('sf_', true));
      // Evita duplicar o mesmo serviço
      $exists = false;
      foreach ($quotes as $q) {
        if ((string) $q['id'] === $id) {
          $exists = true;
          break;
        }
      }
      if ($exists) continue;
      $quotes[] = [
        'id' => $id,
        'name' => (string) ($row['name'] ?? 'Correios'),
        'company' => $company !== '' ? $company : 'Correios / SuperFrete',
        'price' => round($price, 2),
        'delivery_time' => isset($row['delivery_time']) ? (int) $row['delivery_time'] : null,
        'currency' => (string) ($row['currency'] ?? 'R$'),
        'free' => false,
      ];
    }
  }

  if (count($quotes) === 0) {
    $error = count($errors) ? implode(' · ', array_unique($errors)) : 'Nenhuma opção de frete disponível para este CEP.';
  }
}

// Frete grátis nacional: zera só a opção mais barata (PAC/Mini); SEDEX e demais ficam pagos
if ($subtotal >= $freeNational) {
  if (count($quotes) > 0) {
    $cheapestIdx = 0;
    $cheapestPrice = (float) $quotes[0]['price'];
    for ($i = 1, $n = count($quotes); $i < $n; $i++) {
      $p = (float) $quotes[$i]['price'];
      if ($p < $cheapestPrice) {
        $cheapestPrice = $p;
        $cheapestIdx = $i;
      }
    }
    $quotes[$cheapestIdx]['price'] = 0;
    $quotes[$cheapestIdx]['free'] = true;
    $baseName = (string) $quotes[$cheapestIdx]['name'];
    if (stripos($baseName, 'grátis') === false && stripos($baseName, 'gratis') === false) {
      $quotes[$cheapestIdx]['name'] = $baseName . ' — frete grátis';
    }
  } else {
    $options[] = [
      'id' => 'correios-gratis',
      'name' => 'Correios — frete grátis',
      'company' => 'Correios / SuperFrete',
      'price' => 0,
      'delivery_time' => null,
      'currency' => 'R$',
      'free' => true,
    ];
  }
}

$merged = array_merge($options, $quotes);

// Sem cotação paga disponível: opção para combinar no WhatsApp (não bloqueia checkout)
if (count($merged) === 0) {
  $merged[] = [
    'id' => 'combinar-whatsapp',
    'name' => 'Frete a combinar no WhatsApp',
    'company' => 'Verissimo',
    'price' => 0,
    'delivery_time' => null,
    'currency' => 'R$',
    'free' => false,
  ];
}

usort($merged, static function ($a, $b) {
  return ($a['price'] <=> $b['price']) ?: strcmp((string) $a['name'], (string) $b['name']);
});

verissimo_json([
  'ok' => true,
  'cep' => $cep,
  'address' => $address,
  'origin_cep' => $originCep,
  'provider' => 'superfrete',
  'options' => $merged,
  'error' => $error,
  'configured' => $token !== '',
]);

function verissimo_lookup_cep(string $cep): ?array {
  $url = 'https://viacep.com.br/ws/' . $cep . '/json/';
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
  ]);
  $resp = curl_exec($ch);
  curl_close($ch);
  if ($resp === false) return null;
  $data = json_decode($resp, true);
  if (!is_array($data) || !empty($data['erro'])) return null;
  return [
    'cep' => (string) ($data['cep'] ?? $cep),
    'logradouro' => (string) ($data['logradouro'] ?? ''),
    'bairro' => (string) ($data['bairro'] ?? ''),
    'localidade' => (string) ($data['localidade'] ?? ''),
    'uf' => (string) ($data['uf'] ?? ''),
    'ibge' => (string) ($data['ibge'] ?? ''),
  ];
}
