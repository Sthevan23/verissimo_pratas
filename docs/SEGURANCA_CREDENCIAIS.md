# Credenciais e histórico Git

## O que nunca deve ir para o repositório

- `api/config.local.php` e `deploy/public_html/api/config.local.php`
- `deploy/.ftp-credentials.json`
- `.env` com valores reais
- `api/data/sessions.json`, `catalog.json`, `orders.json` e dumps `.sql`

Use apenas `api/config.local.example.php` (placeholders) como referência versionada.

## Configuração na Hostinger (procedimento seguro)

1. **MySQL (hPanel)**  
   Anote host (`localhost` no servidor), banco, usuário e **senha nova** se houve vazamento no Git.

2. **Arquivo no servidor (não commitar)**  
   Em `public_html/api/config.local.php` (ou `api/` conforme layout do site), copie o conteúdo de `config.local.example.php` e preencha:
   - `pass` — senha MySQL
   - `admin_email` / `admin_password` — login do `/admin`
   - `superfrete_token`, `superfrete_env`, `origin_cep` — frete
   - `site_origin` e `allowed_origins` — domínio HTTPS da loja

3. **Deploy Git na Hostinger**  
   Após `git pull`, confirme que o pull **não** sobrescreve `api/config.local.php` existente no servidor. Mantenha esse arquivo só no servidor (criado manualmente ou fora do repo).

4. **Deploy FTP (`node deploy/upload.mjs`)**  
   O script **não envia** `config.local.php`. O arquivo deve existir apenas no servidor.

5. **Validação**  
   - `GET /api/ping-db.php` (com config no servidor) — conexão MySQL  
   - Login em `/admin` via HTTPS  
   - Cookies `verissimo_admin` (HttpOnly) e `verissimo_csrf`

## Rotação obrigatória se segredos estiveram no Git

Se `config.local.php` (ou equivalente) já foi commitado, trate as chaves como **comprometidas**, mesmo após remover o arquivo do índice:

| Credencial | Onde rotacionar |
|------------|-----------------|
| Senha MySQL | hPanel → Bancos de dados → usuário do banco → nova senha; atualizar `pass` em `config.local.php` no servidor |
| Senha admin (`admin_password`) | Editar `config.local.php` no servidor; fazer logout/login no painel |
| `api_token` (legado) | Gerar valor novo em `config.local.php` se ainda usado como fallback de senha |
| Token SuperFrete | Painel SuperFrete → revogar/gerar token; atualizar `superfrete_token` no servidor |
| Senha FTP | hPanel → FTP → alterar senha; atualizar `deploy/.ftp-credentials.json` **local** (gitignored) |

## Histórico Git compartilhado

Remover o arquivo do commit atual **não apaga** segredos de commits antigos. Se o repositório remoto (GitHub, Origin, etc.) já recebeu esses commits:

1. Rotacionar **todas** as credenciais acima **antes** de considerar o ambiente seguro.
2. Para eliminar segredos do histórico (opcional, coordenado com a equipe): `git filter-repo` ou BFG Repo-Cleaner, removendo `**/config.local.php` de todo o histórico, depois force-push **somente** após acordo explícito — **não** faça force-push em `main` sem alinhamento.
3. Até a limpeza do histórico, assuma que quem teve acesso ao clone/remoto pode ter visto valores antigos.

## Verificação local

```bash
node scripts/verify-tracked-secrets.mjs
npm run build   # também executa a verificação ao final
```
