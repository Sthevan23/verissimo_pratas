<?php
/**
 * Cotação e validação de frete (SuperFrete + opções Verissimo).
 */

function verissimo_lookup_cep(string $cep): ?array {
  $cep = preg_replace('/\D+/', '', $cep);
  if (strlen($cep) !== 8) return null;
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

function verissimo_is_local_delivery_cep(string $cepDigits, ?array $address = null): bool {
  if ($address === null) {
    $address = verissimo_lookup_cep($cepDigits);
  }
  if (!$address) return false;
  return stripos((string) ($address['localidade'] ?? ''), 'boa esperan') !== false
    || (string) ($address['ibge'] ?? '') === '3107109';
}

/**
 * @return array{options: array<int, array>, configured: bool, error: ?string, address: ?array}
 */
function verissimo_build_shipping_options(string $cepDigits, float $subtotal, int $totalQty): array {
  $cepDigits = preg_replace('/\D+/', '', $cepDigits);
  if (strlen($cepDigits) !== 8) {
    return ['options' => [], 'configured' => false, 'error' => 'CEP inválido', 'address' => null];
  }
  if ($totalQty < 1) $totalQty = 1;

  $cfg = verissimo_cfg();
  $token = trim((string) ($cfg['superfrete_token'] ?? getenv('SUPERFRETE_TOKEN') ?: ''));
  $originCep = preg_replace('/\D+/', '', (string) ($cfg['origin_cep'] ?? '37170000'));
  if (strlen($originCep) !== 8) $originCep = '37170000';

  $freeNational = (float) ($cfg['free_shipping_national'] ?? 499);
  $freeLocal = (float) ($cfg['free_shipping_local'] ?? 159);

  $address = verissimo_lookup_cep($cepDigits);
  $isLocal = verissimo_is_local_delivery_cep($cepDigits, $address);

  $options = [];
  $options[] = [
    'id' => 'retirada-loja',
    'name' => 'Retirar',
    'company' => 'Verissimo',
    'price' => 0.0,
    'delivery_time' => 0,
    'currency' => 'R$',
    'free' => true,
  ];

  if ($isLocal && $subtotal >= $freeLocal) {
    $options[] = [
      'id' => 'local-gratis',
      'name' => 'Entrega local — Boa Esperança',
      'company' => 'Verissimo',
      'price' => 0.0,
      'delivery_time' => 1,
      'currency' => 'R$',
      'free' => true,
    ];
  }

  $quotes = [];
  $error = null;

  if ($token === '') {
    $error = 'Cotação SuperFrete pendente — frete a combinar no WhatsApp.';
  } else {
    $env = strtolower((string) ($cfg['superfrete_env'] ?? 'production'));
    $base = $env === 'sandbox' ? 'https://sandbox.superfrete.com' : 'https://api.superfrete.com';
    $headers = [
      'Accept: application/json',
      'Content-Type: application/json',
      'Authorization: Bearer ' . $token,
      'User-Agent: VerissimoPratas/1.0 (verissimopratass@gmail.com)',
    ];

    $weight = round(max(0.1, 0.1 + (0.05 * max(0, $totalQty - 1))), 3);
    $height = min(8, max(2, 2 + (int) floor(($totalQty - 1) / 4)));
    $width = min(16, max(11, 11 + (int) floor(($totalQty - 1) / 3)));
    $length = min(20, max(16, 16 + (int) floor(($totalQty - 1) / 2)));

    $payload = [
      'from' => ['postal_code' => $originCep],
      'to' => ['postal_code' => $cepDigits],
      'services' => '1,2,17',
      'options' => [
        'own_hand' => false,
        'receipt' => false,
        'insurance_value' => 0,
        'use_insurance_value' => false,
      ],
      'package' => [
        'height' => $height,
        'width' => $width,
        'length' => $length,
        'weight' => $weight,
      ],
    ];

    $errors = [];
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
    } else {
      $data = json_decode($resp, true);
      if ($http >= 400 || !is_array($data)) {
        $errors[] = is_array($data)
          ? (string) ($data['message'] ?? $data['error'] ?? 'Erro na cotação')
          : 'Erro na cotação SuperFrete';
      } else {
        $list = isset($data[0]) ? $data : (isset($data['data']) && is_array($data['data']) ? $data['data'] : [$data]);
        foreach ($list as $row) {
          if (!is_array($row)) continue;
          if (!empty($row['error'])) {
            $errors[] = (string) ($row['name'] ?? 'serviço') . ': ' . (is_string($row['error']) ? $row['error'] : json_encode($row['error'], JSON_UNESCAPED_UNICODE));
            continue;
          }
          if (!isset($row['price']) && !isset($row['final_price'])) continue;
          $rawPrice = $row['price'] ?? $row['final_price'];
          if (is_string($rawPrice)) {
            $rawPrice = preg_replace('/[^\d,.-]/', '', $rawPrice) ?? '';
            if (strpos($rawPrice, ',') !== false) {
              $rawPrice = str_replace('.', '', $rawPrice);
              $rawPrice = str_replace(',', '.', $rawPrice);
            }
          }
          $price = round((float) $rawPrice, 2);
          if ($price < 0) continue;
          $company = '';
          if (isset($row['company']) && is_array($row['company'])) {
            $company = (string) ($row['company']['name'] ?? '');
          } elseif (isset($row['company']) && is_string($row['company'])) {
            $company = $row['company'];
          }
          $id = (string) ($row['id'] ?? $row['service'] ?? uniqid('sf_', true));
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
            'price' => $price,
            'delivery_time' => isset($row['delivery_time']) ? (int) $row['delivery_time'] : null,
            'currency' => (string) ($row['currency'] ?? 'R$'),
            'free' => false,
          ];
        }
      }
    }

    if (count($quotes) === 0) {
      $error = count($errors) ? implode(' · ', array_unique($errors)) : 'Nenhuma opção de frete disponível para este CEP.';
    }
  }

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
      $quotes[$cheapestIdx]['price'] = 0.0;
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
        'price' => 0.0,
        'delivery_time' => null,
        'currency' => 'R$',
        'free' => true,
      ];
    }
  }

  $merged = array_merge($options, $quotes);
  if (count($merged) === 0) {
    $merged[] = [
      'id' => 'combinar-whatsapp',
      'name' => 'Frete a combinar no WhatsApp',
      'company' => 'Verissimo',
      'price' => 0.0,
      'delivery_time' => null,
      'currency' => 'R$',
      'free' => false,
    ];
  }

  usort($merged, static function ($a, $b) {
    return ($a['price'] <=> $b['price']) ?: strcmp((string) $a['name'], (string) $b['name']);
  });

  return [
    'options' => $merged,
    'configured' => $token !== '',
    'error' => $error,
    'address' => $address,
  ];
}

function verissimo_price_to_cents(float $price): int {
  return max(0, (int) round($price * 100));
}

/** @return array{id: string, price_cents: int}|null */
function verissimo_find_shipping_option(string $optionId, string $cepDigits, float $subtotal, int $totalQty): ?array {
  $quote = verissimo_build_shipping_options($cepDigits, $subtotal, $totalQty);
  foreach ($quote['options'] as $opt) {
    if ((string) ($opt['id'] ?? '') === $optionId) {
      return [
        'id' => $optionId,
        'price_cents' => verissimo_price_to_cents((float) ($opt['price'] ?? 0)),
      ];
    }
  }
  return null;
}

/** IDs de frete com preço zero permitido no checkout */
function verissimo_free_shipping_option_ids(): array {
  return ['retirada-loja', 'local-gratis', 'correios-gratis', 'combinar-whatsapp'];
}

/**
 * Valida opção de frete no pedido — preço oficial da cotação (não confia no cliente).
 *
 * @return array{ok: bool, shipping_cents?: int, error?: string}
 */
function verissimo_validate_shipping_for_order(
  string $optionId,
  int $subtotalCents,
  string $cepDigits,
  int $totalQty
): array {
  $optionId = trim($optionId);
  if ($optionId === '') {
    return ['ok' => false, 'error' => 'Opção de frete obrigatória'];
  }
  if (strlen(preg_replace('/\D+/', '', $cepDigits)) !== 8) {
    return ['ok' => false, 'error' => 'Informe um CEP válido para calcular o frete'];
  }
  if ($totalQty < 1) $totalQty = 1;

  $subtotal = round($subtotalCents / 100, 2);
  $cfg = verissimo_cfg();
  $freeLocal = (float) ($cfg['free_shipping_local'] ?? 159);
  $freeNational = (float) ($cfg['free_shipping_national'] ?? 499);

  if ($optionId === 'retirada-loja' || $optionId === 'combinar-whatsapp') {
    return ['ok' => true, 'shipping_cents' => 0];
  }

  if ($optionId === 'local-gratis') {
    if (!verissimo_is_local_delivery_cep($cepDigits)) {
      return ['ok' => false, 'error' => 'Entrega local indisponível para este CEP'];
    }
    if ($subtotal < $freeLocal) {
      return ['ok' => false, 'error' => 'Valor mínimo não atingido para entrega local grátis'];
    }
    return ['ok' => true, 'shipping_cents' => 0];
  }

  if ($optionId === 'correios-gratis') {
    if ($subtotal < $freeNational) {
      return ['ok' => false, 'error' => 'Valor mínimo não atingido para frete grátis'];
    }
    return ['ok' => true, 'shipping_cents' => 0];
  }

  $quote = verissimo_build_shipping_options($cepDigits, $subtotal, $totalQty);
  if (!$quote['configured']) {
    return [
      'ok' => false,
      'error' => 'Frete pelos Correios indisponível no momento. Escolha retirada na loja ou combine no WhatsApp.',
    ];
  }

  $match = verissimo_find_shipping_option($optionId, $cepDigits, $subtotal, $totalQty);
  if ($match === null) {
    return [
      'ok' => false,
      'error' => 'Opção de frete inválida ou expirada. Calcule o frete novamente antes de finalizar.',
    ];
  }

  if ($match['price_cents'] <= 0) {
    return ['ok' => true, 'shipping_cents' => 0];
  }

  return ['ok' => true, 'shipping_cents' => (int) $match['price_cents']];
}
