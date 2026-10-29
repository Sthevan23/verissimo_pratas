<?php
/**
 * Regras puras de pedido (testáveis) — valores em centavos (int).
 */

function verissimo_money_to_cents($value): int {
  if ($value === null || $value === '') return 0;
  $n = round((float) $value * 100);
  return max(0, (int) $n);
}

function verissimo_cents_to_money(int $cents): float {
  return round($cents / 100, 2);
}

function verissimo_product_unit_price_cents(array $product): int {
  if (isset($product['salePrice']) && $product['salePrice'] !== null && $product['salePrice'] !== '') {
    $sale = verissimo_money_to_cents($product['salePrice']);
    if ($sale > 0) return $sale;
  }
  return verissimo_money_to_cents($product['price'] ?? 0);
}

/** @return array{ok: bool, error?: string, qty?: int} */
function verissimo_validate_line_quantity($rawQty, int $stock, bool $inStock, string $status): array {
  if ($status !== 'active') {
    return ['ok' => false, 'error' => 'Produto indisponível'];
  }
  if (!is_numeric($rawQty)) {
    return ['ok' => false, 'error' => 'Quantidade inválida'];
  }
  $qty = (int) $rawQty;
  if ($qty !== (float) $rawQty && (string) $rawQty !== (string) $qty) {
    return ['ok' => false, 'error' => 'Quantidade deve ser um número inteiro'];
  }
  if ($qty <= 0) {
    return ['ok' => false, 'error' => 'Quantidade inválida'];
  }
  if (!$inStock || $stock <= 0) {
    return ['ok' => false, 'error' => 'Produto esgotado'];
  }
  if ($qty > $stock) {
    return ['ok' => false, 'error' => 'Quantidade maior que o estoque disponível'];
  }
  return ['ok' => true, 'qty' => $qty];
}

function verissimo_commerce_rules(): array {
  $cfg = verissimo_cfg();
  return [
    'cash_discount_bps' => 500,
    'free_shipping_national_cents' => verissimo_money_to_cents($cfg['free_shipping_national'] ?? 499),
    'free_shipping_local_cents' => verissimo_money_to_cents($cfg['free_shipping_local'] ?? 159),
    'origin_cep' => preg_replace('/\D+/', '', (string) ($cfg['origin_cep'] ?? '37170000')),
  ];
}

/**
 * @return array{ok: bool, discount_cents?: int, error?: string, code?: string}
 */
function verissimo_coupon_discount_cents(string $code, int $subtotalCents, ?PDO $pdo = null): array {
  $code = strtoupper(trim($code));
  if ($code === '') {
    return ['ok' => true, 'discount_cents' => 0];
  }

  $row = null;
  if ($pdo instanceof PDO) {
    try {
      $stmt = $pdo->prepare(
        'SELECT code, type, value_bps, min_purchase_cents, usage_limit, usage_count, starts_at, expires_at, active
         FROM vp_coupons WHERE code = ? LIMIT 1'
      );
      $stmt->execute([$code]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    } catch (Throwable $e) {
      $row = null;
    }
  }

  if ($row === null) {
    // Fallback alinhado ao frontend (AppContext VALID_COUPONS + adminStore seed)
    $fallback = [
      'VERISSIMO10' => ['bps' => 1000, 'min' => 10000],
      'PRATA15' => ['bps' => 1500, 'min' => 20000],
    ];
    if (!isset($fallback[$code])) {
      return ['ok' => false, 'error' => 'Cupom inválido'];
    }
    if ($subtotalCents < $fallback[$code]['min']) {
      return ['ok' => false, 'error' => 'Valor mínimo não atingido para este cupom'];
    }
    $discount = (int) floor($subtotalCents * $fallback[$code]['bps'] / 10000);
    return ['ok' => true, 'discount_cents' => min($discount, $subtotalCents), 'code' => $code];
  }

  if (!(int) ($row['active'] ?? 0)) {
    return ['ok' => false, 'error' => 'Cupom inativo'];
  }
  $today = gmdate('Y-m-d');
  if (!empty($row['starts_at']) && (string) $row['starts_at'] > $today) {
    return ['ok' => false, 'error' => 'Cupom ainda não válido'];
  }
  if (!empty($row['expires_at']) && (string) $row['expires_at'] < $today) {
    return ['ok' => false, 'error' => 'Cupom expirado'];
  }
  $min = (int) ($row['min_purchase_cents'] ?? 0);
  if ($subtotalCents < $min) {
    return ['ok' => false, 'error' => 'Valor mínimo não atingido para este cupom'];
  }
  $usageCount = (int) ($row['usage_count'] ?? 0);
  $limit = $row['usage_limit'];
  if ($limit !== null && $usageCount >= (int) $limit) {
    return ['ok' => false, 'error' => 'Cupom esgotado'];
  }

  $discount = 0;
  if (($row['type'] ?? '') === 'fixed') {
    $discount = (int) ($row['value_bps'] ?? 0);
  } else {
    $discount = (int) floor($subtotalCents * (int) ($row['value_bps'] ?? 0) / 10000);
  }
  $discount = min(max(0, $discount), $subtotalCents);
  return ['ok' => true, 'discount_cents' => $discount, 'code' => $code];
}
