# Homologação — Veríssimo Pratas

Ambiente de testes antes de produção. **Não use credenciais de produção em repositório.**

## Pré-requisitos

- PHP 8.1+, Node 20+, MySQL de **homologação** (schema `001_vp_operational.sql` + `php api/migrate.php`)
- `api/config.local.php` com `superfrete_token` de **sandbox** ou produção apenas em servidor de teste
- Site e API na **mesma origem** (ex.: `https://homolog.seudominio.com.br`) para cookies HttpOnly

## Autenticação (cookies + CSRF)

1. Abra `/admin/login`, faça login com **Manter conectado**.
2. DevTools → Application → Cookies: deve existir `verissimo_admin` (HttpOnly) e `verissimo_csrf`.
3. Publicar catálogo: deve enviar `X-Verissimo-CSRF` e `credentials: include`.
4. Sessão antiga (sem CSRF no servidor): mutações retornam `403` + `SESSION_UPGRADE_REQUIRED` → faça login de novo.
5. Logout: cookies removidos; `GET /api/auth.php` retorna `401`.

### Local (Vite `localhost:5173`)

- Proxy do Vite deve encaminhar `/api/*` ao PHP local ou homolog.
- Cookies `Secure` só em HTTPS; em HTTP local o PHP pode omitir `Secure` — comportamento difere de produção.
- Valide auth/cookies sempre em **homolog HTTPS** antes do go-live.

## SuperFrete e frete no pedido

Config em `config.local.php`:

- `superfrete_token` — token da conta (sandbox ou produção de teste)
- `superfrete_env` — `sandbox` ou `production`
- `origin_cep` — CEP origem (ex.: `37170000`)
- `free_shipping_local` — padrão `159`
- `free_shipping_national` — padrão `499`

### Passos

| Cenário | Ação | Resultado esperado |
|--------|------|-------------------|
| Retirada | Carrinho → CEP qualquer → opção **Retirar** → finalizar | Pedido OK, frete R$ 0 |
| Frete grátis local | CEP Boa Esperança, subtotal ≥ R$ 159 → **Entrega local** | Pedido OK, frete R$ 0 |
| Frete grátis nacional | Subtotal ≥ R$ 499 → opção Correios mais barata com “frete grátis” | Pedido OK, frete R$ 0 |
| PAC/SEDEX pago | CEP válido, calcular frete, escolher opção paga | Pedido OK; total com frete **igual à cotação** (servidor recota) |
| Manipulação | `POST /api/orders.php` com frete pago e valor alterado no JSON | **Rejeitado**; preço do cliente ignorado |
| Sem token SuperFrete | Escolher transportadora paga | **Rejeitado**; retirada/combinar WhatsApp ainda permitidos |
| Cotação expirada | ID de opção inventado | Erro: opção inválida ou expirada |

### Erros a verificar

- `Informe a opção de frete (shippingOptionId)`
- `Frete pelos Correios indisponível no momento…`
- `Opção de frete inválida ou expirada…`
- `Entrega local indisponível para este CEP`

## Pedidos e estoque (MySQL)

1. Dois navegadores, 1 unidade em estoque: dois checkouts simultâneos → um sucesso, um `409` estoque.
2. Mesma `idempotencyKey` duas vezes → mesmo pedido, estoque baixado uma vez.
3. Após migrate, reexecutar migrate **não** deve resetar estoque (produtos existentes preservam stock).

### Testes automatizados MySQL

Requer banco **isolado** (nunca produção):

```bash
set VERISSIMO_TEST_MYSQL_HOST=127.0.0.1
set VERISSIMO_TEST_MYSQL_NAME=verissimo_test
set VERISSIMO_TEST_MYSQL_USER=root
set VERISSIMO_TEST_MYSQL_PASS=senha_teste
php tests/php/mysql_concurrency_test.php
```

Se variáveis não estiverem definidas, o script **sai com código 0 e mensagem SKIP** (não simula sucesso).

## Checklist antes de produção

- [ ] Migração SQL aplicada em homolog
- [ ] `migrate.php` executado uma vez; JSON preservado
- [ ] Login admin + CSRF em HTTPS
- [ ] Checkout retirada + frete pago validado
- [ ] Dashboard/Relatórios/Financeiro batem com pedidos da API
- [ ] Deploy FTP não envia `config.local.php` nem `api/data/*.json`
