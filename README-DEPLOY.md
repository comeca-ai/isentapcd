# IsentaPCD — Runbook de Deploy (VPS + Docker)

Plataforma full-stack: React 19 + Vite 7 (frontend) · Hono + tRPC 11 + Drizzle (backend) · MySQL 8 · Caddy (HTTPS automático).

## Arquitetura do deploy

- **Build FORA do container** (o npm quebra dentro de containers em alguns hosts — "Exit handler never called!"). O `Dockerfile.prebuilt` é runtime-only.
- **Compose**: `app` (Node 20 alpine) + `mysql` (MySQL 8, volume `mysql_data`) + `caddy` (HTTPS Let's Encrypt automático após virada de DNS).
- **SPA fallback**: o servidor Hono serve `dist/public` e responde `index.html` para qualquer rota que aceite `text/html` (BrowserRouter).
- **GitHub é a fonte da verdade**: branch `master`, commits atômicos por feature.

## 1. VPS limpa (Ubuntu 24.04, primeira vez)

```bash
# 1.1 Docker + plugin compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 1.2 Código
sudo mkdir -p /opt/isentapcd && sudo chown $USER /opt/isentapcd
git clone git@github.com:<seu-usuario>/isentapcd.git /opt/isentapcd
cd /opt/isentapcd

# 1.3 Node 20 na VPS (só para o build local — não vai pro container)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs

# 1.4 Segredos NOVOS deste ambiente (nunca reuse os de outro ambiente)
cp .env.example .env
nano .env
#   JWT_SECRET=$(openssl rand -hex 32)   ← gere um novo
#   ADMIN_EMAIL / ADMIN_PASSWORD         ← bootstrap do 1º admin (roda no boot)
#   RESEND_API_KEY / EMAIL_FROM          ← vazio = e-mails em no-op com log
#   DATABASE_URL pode ficar placeholder  ← o compose sobrescreve com o mysql interno
export MYSQL_PASSWORD=$(openssl rand -hex 16)   # adicione MYSQL_PASSWORD ao .env
echo "MYSQL_PASSWORD=$MYSQL_PASSWORD" >> .env
```

## 2. Build (fora do container) + subida

```bash
cd /opt/isentapcd
npm ci --include=dev
npm run build                       # gera dist/ (frontend + dist/boot.js)
npm prune --omit=dev
npm install --no-save tsx drizzle-kit
docker compose -f docker-compose.yml up -d --build
```

## 3. Banco de dados

```bash
# schema/migrações (primeira subida ou após mudança de schema)
docker compose exec app npm run db:migrate

# seed do catálogo (~10 veículos) — idempotente
docker compose exec app npx tsx db/seed.ts
```

> **Nota drizzle-kit × TiDB/MySQL**: `db:push` foi usado só no bootstrap de desenvolvimento.
> Em produção, evoluções de schema = `npm run db:generate` (gera SQL) → commit → `db:migrate` na VPS.
> NUNCA `db:push --force`. NUNCA dropar tabelas.

### Migração de banco entre ambientes (quando aplicável)

```bash
# exportar do ambiente antigo
mysqldump -h <host> -u <user> -p isentapcd | gzip > isentapcd-$(date +%F).sql.gz
# importar na VPS
gunzip -c isentapcd-XXXX.sql.gz | docker compose exec -T mysql mysql -uisentapcd -p$MYSQL_PASSWORD isentapcd
```

## 4. HTTPS / DNS

1. Aponte o DNS A/AAAA do domínio para o IP da VPS.
2. Edite `Caddyfile` (`{$DOMAIN:...}` ou substitua pelo domínio real) — ou rode com `DOMAIN=meudominio.com.br` no `.env`.
3. `docker compose up -d caddy` — o Caddy emite e renova o certificado sozinho (portas 80/443 abertas no firewall).

## 5. Pós-mudanças (atualizar o site)

```bash
cd /opt/isentapcd
git pull origin master
npm ci --include=dev && npm run build && npm prune --omit=dev && npm install --no-save tsx drizzle-kit
docker compose up -d --build app          # rebuild só do app
docker compose exec app npm run db:migrate # se houver migração nova
```

## 6. Operacional

- **Admin**: primeiro admin criado no boot via `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Painel em `/admin`.
- **Pagamentos**: confirmação manual no `/admin/pagamentos` (vendas fechadas no WhatsApp) com estorno.
- **E-mails**: Resend via REST. Sem `RESEND_API_KEY` → `[email:no-op]` nos logs (`docker compose logs -f app`).
- **Lembretes**: scheduler diário (IPVA pós-compra + licenciamento por final de placa), dedup por `email_reminders (userId, kind, refKey)`.
- **Backup**: `mysqldump | gzip` diário via cron (ex.: `/etc/cron.daily/backup-isentapcd`).
- **Constantes regulatórias**: tudo editável em `contracts/constants.ts` (tetos, prazos, matriz das 27 UFs, PRICE_EXECUTION, REFERRAL_REWARD). Mudou lei → muda lá → rebuild.

## 7. E2E pós-deploy (curl)

```bash
B=https://seudominio.com.br
for p in / /guia /simulador /pre-analise /entrar /app; do curl -s -o /dev/null -w "$p %{http_code}\n" -H "Accept: text/html" $B$p; done
# registro → login → upload → guards: ver RELATORIO-TESTES.md (mesma suíte)
```
