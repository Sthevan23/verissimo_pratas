# Credenciais e histórico Git

## O que nunca deve ir para o repositório

- `api/config.local.php` e `deploy/public_html/api/config.local.php`
- `deploy/.ftp-credentials.json`
- `.env` com valores reais
- `api/data/sessions.json`, `catalog.json`, `orders.json` e dumps com dados reais

Use apenas `api/config.local.example.php` (placeholders) como referência versionada.

## Configuração na Hostinger (procedimento seguro)

1. **MySQL (hPanel)**  
   Anote host (`localhost` no servidor), banco, usuário e **senha nova** se houve vazamento no Git.

2. **Arquivo no servidor (não commitar)**  
   Em `public_html/api/config.local.php` (ou `api/` conforme layout do site), copie o conteúdo de `config.local.example.php` e preencha:
   - `pass` — senha MySQL
   - `admin_email` / `admin_password_hash` - acesso ao `/admin`; armazene somente o hash.
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
| Senha admin legada | Gerar `admin_password_hash` com `php scripts/hash-admin-password.php` antes de atualizar o backend |
| `api_token` legado | O script de migracao reconhece o fallback historico; remova-o da configuracao privada apos migrar e verificar integracoes externas |
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
## Migracao segura do login administrativo

O backend aceita somente `admin_password_hash` (ou a variavel `VERISSIMO_ADMIN_PASSWORD_HASH`) e verifica a senha com `password_verify`. Nao usa `admin_password` em texto claro nem `api_token` como senha.

Antes de atualizar o backend no servidor, preserve a senha atual sem troca-la:

1. Execute `php scripts/hash-admin-password.php` no servidor/checkout seguro que tem a configuracao legada. O utilitario reconhece `admin_password`, o `api_token` local ou `VERISSIMO_ADMIN_PASSWORD`/`VERISSIMO_API_TOKEN`; imprime somente o hash e nao modifica a configuracao.
2. No `api/config.local.php` privado do servidor, configure `'admin_password_hash' => 'HASH_GERADO'` e remova a chave antiga `admin_password`.
3. Alternativamente, configure `VERISSIMO_ADMIN_PASSWORD_HASH` no ambiente do PHP com o hash gerado.
4. Confirme o login administrativo por HTTPS. A senha atual continua a mesma; somente a representacao armazenada muda.

Nao registre o hash em logs compartilhados nem o adicione ao repositorio. Esta migracao nao faz rotacao da senha.
