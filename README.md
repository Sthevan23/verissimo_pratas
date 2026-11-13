# Verissimo Pratas 925

E-commerce de joias em prata 925 com vitrine React, checkout via WhatsApp e painel administrativo em `/admin`.

## Funcionalidades

- Catálogo, categorias, busca e carrinho
- Cálculo de frete (SuperFrete / regras locais) e cupons
- Pedidos registrados no servidor com baixa de estoque
- Admin: produtos, estoque, pedidos, categorias, cupons (UI), relatórios
- Upload de fotos (`api/upload.php`, `api/media.php`)

## Arquitetura

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind 4, React Router 7 |
| Backend | PHP 8+ na pasta `api/` (Hostinger) |
| Dados operacionais | MySQL (`vp_*`) quando migrado; fallback `api/data/catalog.json` + `orders.json` |
| Sessão admin | `api/data/sessions.json` + cookies HttpOnly `verissimo_admin` / CSRF `verissimo_csrf` |

### Diretórios principais

- `src/` — aplicação React (loja + admin)
- `api/` — endpoints PHP (fonte deployada junto ao build)
- `database/migrations/` — SQL versionado (`001_vp_operational.sql`)
- `deploy/public_html/` — artefato espelhado para FTP/Git na Hostinger
- `tests/php/` — testes unitários da lógica de pedidos

## Requisitos locais

- Node.js 20+
- PHP 8.1+ (CLI) para testes
- MySQL (opcional local; produção usa Hostinger)

```bash
npm install
npm run dev          # http://localhost:5173 (proxy /api se configurado)
npm run build        # gera assets + sync deploy/public_html
npm test             # php tests/php/run-tests.php
```

## Configuração (sem segredos no repositório)

**Importante:** `config.local.php` nunca deve ser commitado nem copiado para `deploy/public_html` pelo build. Se já houve commit acidental, veja [docs/SEGURANCA_CREDENCIAIS.md](docs/SEGURANCA_CREDENCIAIS.md) (rotação + histórico Git).

Copie `api/config.local.example.php` → `api/config.local.php` (local ou **somente no servidor** Hostinger):

- `host`, `name`, `user`, `pass` — MySQL
- `admin_email`, `admin_password_hash` — login do painel (somente servidor; migre o valor legado com `php scripts/hash-admin-password.php`)
- `superfrete_token`, `origin_cep`, `free_shipping_*` — frete

Variáveis de ambiente opcionais: `VERISSIMO_ADMIN_EMAIL`, `VERISSIMO_ADMIN_PASSWORD_HASH`, `SUPERFRETE_TOKEN`.

Para migrar o login existente, execute `php scripts/hash-admin-password.php` no ambiente que contém `api/config.local.php` ou as variáveis legadas. O script reconhece `admin_password` e o fallback histórico `api_token` (incluindo `VERISSIMO_API_TOKEN`), imprime somente o hash e não altera a configuração. Configure o resultado como `admin_password_hash`/`VERISSIMO_ADMIN_PASSWORD_HASH` e remova a credencial legada antes de atualizar o backend.

FTP deploy: `deploy/.ftp-credentials.json` (gitignored) com `host`, `user`, `password`, `remoteDir`.

## Banco de dados e migração

1. No phpMyAdmin (Hostinger), execute `database/migrations/001_vp_operational.sql`.
2. Importe JSON existente:
   - CLI: `php api/migrate.php`
   - Ou `POST /api/migrate.php` autenticado como admin

Isso preenche `vp_products`, `vp_orders`, `vp_coupons` **sem apagar** `api/data/*.json`.

Recuperação: JSON original permanece em `api/data/`; pedidos MySQL em `vp_orders.payload`.

## Fluxo de pedido e estoque

1. Cliente finaliza carrinho → `POST /api/orders.php` com itens (`productId`, `quantity`), `shippingOptionId`, `cep`, `couponCode`, `idempotencyKey`.
2. Servidor recalcula preços, cupom e frete; ignora totais enviados pelo navegador.
3. Com MySQL: transação + `SELECT … FOR UPDATE` em `vp_products`, insert em `vp_orders`.
4. Sem MySQL: lock `api/data/operational.lock`, atualiza catálogo e `orders.json` na mesma seção crítica.
5. Admin lista pedidos via `GET /api/orders.php` (sessão obrigatória).

## Regras comerciais (servidor)

- Preço unitário: `salePrice` se > 0, senão `price` (centavos inteiros).
- Cupons: tabela `vp_coupons` ou fallback `VERISSIMO10` / `PRATA15` (mesmos do frontend).
- Frete: opções com id em `retirada-loja`, `local-gratis`, `correios-gratis`, `combinar-whatsapp` exigem valor 0; demais opções exigem valor > 0 (validação básica; cotação detalhada em `shipping.php`).

Config em `api/config.php` / `config.local.php`: `free_shipping_national`, `free_shipping_local`.

## Autenticação admin

- `POST /api/auth.php` — login; define cookies HttpOnly + retorna `token` e `csrf` (compatibilidade com header).
- Rotas de escrita (`catalog.php`, `upload.php`, `orders.php` GET/PUT, `migrate.php`) exigem sessão válida.
- Mutações exigem header `X-Verissimo-CSRF` (ou cookie `verissimo_csrf`) alinhado à sessão.
- Frontend: `src/services/authService.ts` usa `credentials: 'include'`.

## Build e deploy

```bash
npm run build
node deploy/upload.mjs   # FTPS, validação TLS ativa; não envia config.local, .env, JSON de dados
```

**Não publicar:** `config.local.php`, `.env`, `api/data/sessions.json`, `catalog.json`, `orders.json`, credenciais FTP, dumps `.sql`.

## Backup

- MySQL: export periódico via hPanel / phpMyAdmin
- Arquivos: `api/data/`, `uploads/products/`, `api/data/images/`
- Código: repositório Git

## Problemas conhecidos

- FTP: credenciais incorretas geram erro 530 (corrigir `.ftp-credentials.json`).
- Sem migração MySQL, pedidos usam JSON (consistente com lock único, mas sem concorrência multi-servidor).
- Cupons/financeiro no admin ainda usam `localStorage` como rascunho; pedidos e catálogo publicado vêm da API.
- Revalidação de frete pago contra SuperFrete em tempo real no pedido ainda é simplificada (confiar na opção escolhida após cotação).

## Testes

```bash
npm test
npm run build
```

Cobre validação de quantidade, preços, cupons, frete, CSRF, pedidos JSON e (opcional) MySQL de teste.

Homologação manual: [docs/HOMOLOGACAO.md](docs/HOMOLOGACAO.md).

### MySQL de testes (opcional)

```bash
# Windows — defina um banco *test* isolado
set VERISSIMO_TEST_MYSQL_HOST=127.0.0.1
set VERISSIMO_TEST_MYSQL_NAME=verissimo_test
set VERISSIMO_TEST_MYSQL_USER=root
set VERISSIMO_TEST_MYSQL_PASS=
php tests/php/mysql_concurrency_test.php
```

Sem variáveis, o script imprime **SKIP** e não falha a suíte.

### Local vs produção (auth)

- **Produção/homolog HTTPS:** cookies `Secure` + same-origin; auth completa.
- **Vite local:** configure proxy para `/api`; cookies podem diferir sem HTTPS — valide auth em homolog antes do go-live.
