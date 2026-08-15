# IsentaPCD — Relatório de Testes (2026-08-15)

Gates executados no ambiente de integração (Node 20, MySQL da plataforma, build de produção).

## Gates de build
- `npm run check` (tsc -b): **limpo** ✅
- `npm run build` (vite + bundle servidor): **sem erros** ✅
- `npm test` (vitest — elegibilidade do quiz + rate limit de login): **9 testes verdes** ✅
- `npm run db:migrate` (baseline) + `npx tsx db/seed.ts` (10 veículos, idempotente): ✅

## E2E via curl (produção local, `npm start`)

| Teste | Resultado |
|---|---|
| Rotas públicas (`/ /guia /guia/:cap /sobre /transparencia /termos /privacidade /contato /simulador /pre-analise /entrar /registro /app /admin` + fallback) | **200** com `Accept: text/html` (SPA fallback OK; sem o header → 404 correto da API) ✅ |
| Registro (`auth.register`) — cria user + processo + 7 etapas + e-mail boas-vindas | ✅ (e-mail em `[email:no-op]`, sem RESEND_API_KEY) |
| Sessão (`auth.me` com cookie httpOnly JWT) | ✅ |
| Login admin (bootstrap via ADMIN_EMAIL/ADMIN_PASSWORD) | ✅ |
| Catálogo (`vehicles.list`) — 10 veículos seed | ✅ |
| Simulador (`simulator.calculate` SP, flex, R$ 90 mil) | IPI R$ 5.670 (6,3%) · ICMS parcial R$ 8.400 (12%×70 mil) · IPVA parcial c/ disclaimer 1º ano ✅ |
| Quiz (`quiz.submit` TEA nível 1, não condutor) | status `pendencias` com explicação humana + jurisprudência + lead criado ✅ |
| Captura de lead (`leads.capture`) com "Quem te indicou?" | ✅ |
| CEP autocomplete (`profile.lookupCep` → ViaCEP) | ✅ (01310-100 → Av. Paulista) |
| Cadastro multi-etapas (`profile.upsertStep`) | ✅ |
| Checklist de documentos por órgão (`documents.checklist`) | ✅ |
| Upload de comprovante de guia (`documents.upload`, base64 ≤5MB) | ✅ e **dispara o paywall** (`paywallTriggered: true`) ✅ |
| Guarda de pagamento (`stages.updateStage` em etapa pós-gate sem `paidAt`) | **412 PAYMENT_REQUIRED** ✅ |
| Admin confirma pagamento (`payments.adminConfirm`) | libera etapas + e-mail (no-op logado) ✅ |
| Regra de dependência (icms antes de ipi; mapa antes de documentos etc.) | **400 "Etapa bloqueada — depende de: …"** ✅ |
| Cadeia completa descoberta→…→icms | ✅ |
| Fila de revisão (`admin.reviewQueue`) | 1 doc ✅ |
| Rejeição sem motivo | **recusada** ("Informe o motivo…") ✅ |
| Rejeição com motivo | ✅ + e-mail (no-op) |
| Export CSV (`admin.leadsCsv`) | **inclui coluna Indicação** ✅ |
| Rate limit de login | 5 tentativas → 6ª **bloqueada 15 min** ✅ |
| Troca de senha com senha atual errada | **401 "Senha atual incorreta"** ✅ |
| Estorno (`payments.adminRefund` com motivo) | ✅ e guarda **relaciona 412** na etapa pós-gate ✅ |
| Indicações (`referrals.myReferrals`) | match por nome/e-mail/telefone; desconto de **quem indica** ✅ |
| Logout | `Set-Cookie: Max-Age=0; HttpOnly; Secure; SameSite=Lax` ✅ |

## Decisões e observações
- **Desconto de indicação**: corrigido para a regra "quem INDICA ganha" — R$ 100 de desconto na execução de quem tem ≥1 indicado (match em `users.referredBy`/`leads.referredBy`). Indicado paga cheio.
- **E-mails**: sem `RESEND_API_KEY` no ambiente → modo no-op com log (por design). Em produção, preencher a chave.
- **Simulador embutido da home**: calcula client-side pelas mesmas constantes (`contracts/constants.ts`); a página `/simulador` usa o tRPC real.
- **drizzle-kit × TiDB**: `db:push` não converge em re-execuções neste ambiente; entregue baseline em `db/migrations/` — evoluir schema via `db:generate` + `db:migrate` (ver README-DEPLOY.md §3).
- **Dados de teste removidos** do banco antes da entrega (restam: admin bootstrap + catálogo).
- **GitHub**: repo pronto com histórico de commits atômicos; para publicar: `git remote add origin git@github.com:<usuário>/isentapcd.git && git push -u origin master`.

## Credenciais do ambiente de preview
- Admin: `admin@isentapcd.com.br` / (senha no `.env` do ambiente — trocar no deploy real)
