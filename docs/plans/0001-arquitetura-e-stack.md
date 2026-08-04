# Conta Gorda — Arquitetura, Stack e Plano de Infra

## Context

Conta Gorda é um app de finanças pessoais, greenfield — `/Users/thadeu/code/contagorda`
está vazia. O v1 é um PWA mobile-first em `app.contagorda.com`, que depois vira app
iOS nativo (developer account já paga). Não há landing page: só o app autenticado.

Duas restrições moldam tudo:

1. **Custo.** Já existem uma VM com Postgres e uma VM na Digital Ocean para a API,
   ambas operadas via `voodu` (PaaS self-hosted do próprio usuário). O front vai
   para Cloudflare Pages — estático, custo zero.
2. **Uma única API** serve o PWA e o futuro app iOS. Mesmo contrato, mesmo fluxo de
   auth, um conjunto de bugs.

A exploração de `clowk-js` e `clowk-ruby` revelou que o Clowk, no estado atual, não
suporta o padrão SPA-stateless + mobile nativo que o Conta Gorda exige. A decisão
tomada foi **endurecer o Clowk primeiro** e só então construir o Conta Gorda em cima
dele — o Conta Gorda é o cliente #1 que força o Clowk a virar um auth provider de
verdade.

## Stack fechada

| Camada | Escolha | Porquê |
|---|---|---|
| Front | Vite + React SPA no Cloudflare Pages | App 100% autenticado não ganha nada com SSR. PWA declarativo via `vite-plugin-pwa`. Mesmo caminho de auth que o iOS. |
| API | Rails 8 API-only, VM da DO via voodu | Maior fluência do usuário. |
| Banco | Postgres na VM dedicada, UUIDv7 como PK | Nunca expõe ID sequencial. Rede privada — Postgres não vai à internet. |
| Auth | Clowk, após a Trilha 1 abaixo | Já existe; Conta Gorda vira consumidor e motor de evolução. |
| Sessão web | Access token em memória + refresh em cookie httpOnly | XSS não rouba sessão longa. |
| Sessão iOS | Access em memória + refresh no Keychain | Equivalente nativo do httpOnly. |
| Recorrência | `recurring_series` + ocorrências materializadas | Modelo Google Calendar: "todas as futuras" vira `WHERE date >= today`. |
| Deploy | `vd apply -f voodu.hcl -r prod` | Build-mode via SSH, ingress Let's Encrypt, `init "migrate"`. |
| Realtime | **Fora do v1** | Finanças single-user não precisa. Blackevin entra com conta compartilhada/família. |

## Escopo v1

**Entra:** Contas/Bancos · Categorias · Transações (despesa **e** receita) ·
Recorrência com editar/apagar futuras · Dashboard card-based mobile-first.

**Fora:** Limites/orçamento (v2) · Realtime · Integração bancária (Pluggy/Belvo).

---

# Trilha 1 — Endurecer o Clowk

Pré-requisito do Conta Gorda. Cada item abaixo é um gap confirmado no código atual.

## 1.1 RS256 + JWKS (o item mais crítico)

**Hoje:** `clowk-ruby/lib/clowk/jwt_verifier.rb` fixa `ALGORITHM = "HS256"` e verifica
com `@secret_key` — a mesma chave que assina. Qualquer app consumidor pode forjar
token de qualquer outro app Clowk. Não há `kid`, rotação, nem verificação de `aud`.

**Alvo:**
- Servidor Clowk assina com RS256 (ou ES256), chave privada nunca sai do Clowk.
- Expor `GET /.well-known/jwks.json` com `kid`, suportando duas chaves ativas
  simultâneas para rotação sem downtime.
- `Clowk::JwtVerifier` busca JWKS, cacheia por `kid` com TTL, e refaz o fetch quando
  aparece um `kid` desconhecido. Adicionar `jwks_url` em `Clowk::Configuration`
  (hoje inexistente).
- Verificar **`aud`** — cada app declara seu audience. Sem isso, token de um app vale
  em outro mesmo com RS256.
- Manter HS256 atrás de flag por um ciclo, para não quebrar consumidores existentes.

## 1.2 Refresh token rotativo

**Hoje:** o gem nunca emite nem renova token; o SDK JS não tem nenhuma lógica de
refresh (grep por `refresh` retorna zero).

**Alvo:**
- Access token curto (~15 min) + refresh token opaco de vida longa, persistido no
  Clowk (permite revogação real).
- Rotação a cada uso + detecção de reuso: refresh reutilizado invalida a família
  inteira de tokens. É o que transforma roubo de token em incidente detectável.
- `POST /sessions/refresh`. Entrega do refresh por canal: cookie httpOnly/Secure/
  `SameSite=Lax` no web, corpo da resposta no mobile (que guarda no Keychain).

## 1.3 Persistência e renovação no SDK JS

**Hoje:** `clowk-js/packages/react/src/provider.tsx` guarda token só em `useState`.
Reload = logout. `useSession`/`onSessionExpired` exigem `secretKey` no client — ou
seja, publicar o segredo no bundle; inutilizáveis no browser.

**Alvo:**
- No boot, tentar `POST /sessions/refresh` com o cookie httpOnly antes de decidir que
  o usuário está deslogado. Isso é o que faz a sessão sobreviver ao reload.
- `getToken(): Promise<string>` que renova sozinho perto do `exp`, com deduplicação
  de chamadas concorrentes (uma renovação, N esperando).
- Remover a dependência de `secretKey` do caminho de browser por completo.
- Manter o token só em memória — a persistência é o cookie httpOnly, não localStorage.

## 1.4 Suporte real a API-only no gem Ruby

**Hoje:** `Clowk::Engine` só engancha `ActiveSupport.on_load(:action_controller_base)`.
`Clowk::Authenticable#persist_clowk_session` chama `session[...]` e `cookies[...]`
incondicionalmente a cada verificação bem-sucedida — API-only não tem nenhum dos dois.
E `clowk_handle_unauthenticated` só devolve 401 se `request.format.json?`.

**Alvo:**
- Hook em `:action_controller_api` também, incluindo `Clowk::Helpers::UrlHelpers`.
- `persist_clowk_session` vira no-op quando não há `session`/`cookies` — requisição
  Bearer não deve gerar `Set-Cookie`.
- Modo API responde 401 JSON sempre, sem depender do header `Accept`.
- Revogação stateless: cache do status de sessão fora da session do Rails (Redis ou
  cache em processo com TTL curto). Hoje o cache do `enforce_active_session` vive em
  `session`, o que não existe numa API stateless.

## 1.5 Claims de autorização

**Hoje:** `Clowk::Current` expõe `id, email, name, avatar_url, provider, instance_id,
app_id, session_id`. Sem `role`, `scope` ou `org_id`.

**Alvo para o Conta Gorda v1:** basta `sub` estável + `aud`. Papéis/organizações só
importam quando houver conta compartilhada — deixar para quando o caso existir.

**Arquivos-chave da Trilha 1:**
`clowk-ruby/lib/clowk/jwt_verifier.rb` · `configuration.rb` · `authenticable.rb` ·
`engine.rb` · `clowk-js/packages/react/src/provider.tsx` ·
`clowk-js/packages/core/src/{config,jwt-verifier,token-extractor}.ts`

---

# Trilha 2 — Conta Gorda

## 2.1 Modelo de dados

Todas as PKs em **UUIDv7** (ordenável por tempo, bom para índice; PG 18 tem `uuidv7()`
nativo, abaixo disso gera na aplicação). Nenhum ID sequencial cruza a fronteira da API.

```
users              clowk_sub (unique), email            — espelho local da identidade Clowk
accounts           user_id, name, kind, institution, initial_balance_cents, archived_at
categories         user_id, name, icon, color, kind
transactions       user_id, account_id, category_id, kind(expense|income),
                   amount_cents, date, description, paid_at,
                   recurring_series_id (nullable), occurrence_date
recurring_series   user_id, account_id, category_id, kind, amount_cents,
                   frequency, interval, day_rule, starts_on, ends_on
```

Decisões que evitam dor depois:

- **Dinheiro em `amount_cents` (integer).** Nunca float. `Money` como value object.
- **Sinal pela coluna `kind`, não pelo sinal do valor.** `amount_cents` é sempre
  positivo; relatórios agregam por `kind`. Evita a classe de bug "esqueci o `abs`".
- **Escopo por `user_id` em toda query**, via default scope explícito no controller
  (`current_user.transactions`), nunca `Transaction.find(params[:id])`. É a defesa
  contra IDOR — e com UUIDv7 o ID não é adivinhável, mas isso é defesa em profundidade,
  não a defesa principal.

## 2.2 Recorrência (o ponto de maior complexidade)

Modelo escolhido: **série + ocorrências materializadas**.

- `recurring_series` guarda a regra. Um job materializa `transactions` concretas até
  ~12 meses à frente, cada uma com `recurring_series_id` e `occurrence_date`.
- **Editar "todas as futuras"**: atualiza a série e reescreve as `transactions` da
  série com `date >= hoje` que ainda não foram tocadas individualmente. Ocorrências
  já editadas à mão ganham um flag `detached` e são preservadas — senão o usuário
  perde edições sem entender por quê.
- **Apagar "todas as futuras"**: `ends_on = hoje` na série + delete das ocorrências
  futuras. O passado é histórico financeiro e **nunca** é apagado.
- **Dia 31 em mês de 30**: `day_rule` precisa decidir explicitamente (último dia do
  mês vs. pular). Definir antes de codar — é a fonte clássica de bug aqui.
- Cronjob voodu diário estende a janela de materialização.

## 2.3 API

Rails 8 API-only, versionada (`/api/v1`), JSON. Serialização explícita — nunca
`render json: model` direto, para não vazar coluna nova sem querer.

Postura de segurança:
- HTTPS ponta a ponta; HSTS. Cloudflare em modo proxied, Full (strict).
- CORS restrito a `https://app.contagorda.com`, com `credentials: true` para o cookie
  de refresh funcionar.
- Rate limit por IP e por usuário (`rack-attack`), mais agressivo nas rotas de auth.
- Postgres só na rede privada da DO ou via WireGuard — nunca porta pública.
- Logs sem PII e sem valores monetários; `filter_parameters` para token/refresh.
- Idempotency key nos POSTs de transação (mobile em rede ruim reenvia).

## 2.4 Front

Vite + React + TypeScript, `vite-plugin-pwa`. Mobile-first, card-based.

Do CLAUDE.md do usuário, aplicar: `manifest.json` com `display: standalone`, ícones
192/512/maskable, `apple-icon.png` 180x180, `viewport-fit=cover`,
`pt-[env(safe-area-inset-top)]` no `<header>` fixo, `bg-color` do body igual à cor
escura da marca (senão aparece faixa branca acima do header em modo PWA).

ESLint em flat config (`eslint.config.mjs`) com as regras do CLAUDE.md. Sem comentários
em JSX. `pnpm` para dependências.

Camada de dados: TanStack Query com cache persistido, para o app abrir mostrando os
últimos dados conhecidos em vez de spinner. Mutações otimistas nas ações de marcar
como pago.

## 2.5 Estrutura do repositório (monorepo poliglota)

```
contagorda/
  apps/
    pwa/                  Vite + React + TS (PWA)
    rapi/                 Rails 8 API-only
    ios/                  SwiftUI (fase 2)
  packages/
    api-client/           cliente TS tipado da API, gerado do OpenAPI
    shared/               tipos e regras puras (Money, day_rule, formatação BRL)
    ui/                   componentes React compartilhados (só se o iOS não for RN)
  infra/
    voodu.hcl             deployment + ingress + cronjob
    configs/              postgresql.conf, pg_hba.conf (via asset do voodu)
  docs/
    decisions/            ADRs — RS256, recorrência, UUIDv7
    api/                  openapi.yaml (fonte da verdade do contrato)
  tools/                  scripts de dev, seeds, geradores
  pnpm-workspace.yaml
```

Pontos que valem decidir agora:

- **`pnpm workspaces` cobre só o JS** (`apps/pwa`, `packages/*`). `apps/rapi` tem seu
  próprio `Gemfile` e `apps/ios` seu `.xcodeproj` — são pastas irmãs, fora do workspace.
  Não tente unificar gerenciador de pacotes; poliglota se resolve por convenção, não
  por ferramenta.
- **`docs/api/openapi.yaml` é a fonte da verdade do contrato.** O Rails valida contra
  ele (rspec + committee) e `packages/api-client` é gerado dele. É o que impede PWA e
  iOS de divergirem — o motivo pelo qual você quis uma API só.
- **`packages/shared`** guarda o que os dois clientes precisam concordar: formatação de
  centavos, cálculo de próxima ocorrência, enums de frequência. O iOS não consome TS,
  mas ter a regra escrita e testada num lugar só dá a referência para portar.
- **CI por app** (paths filter): mudou `apps/rapi` roda RSpec + `vd apply`; mudou
  `apps/pwa` roda lint/build + deploy no Pages. Sem isso todo push roda tudo.
- **`infra/voodu.hcl` na raiz do monorepo, mas `build { context = "apps/rapi" }`** —
  o tarball sobe só a API, não o monorepo inteiro.

## 2.6 Deploy (voodu)

Um `voodu.hcl` no repo da API:

- `deployment "contagorda" "api"` em build-mode (`build { lang { name = "ruby" } }`),
  tarball via SSH — sem precisar de registry.
- `init "migrate" { command = ["bin/rails", "db:migrate"] }` roda antes do container
  principal subir.
- `probes { readiness { http_get { path = "/up" } } }` — o voodu deriva o health check
  do caddy do probe de readiness automaticamente, sem config extra no ingress.
- `ingress "contagorda" "api"` com `host = "api.contagorda.com"` e `tls { email = ... }`.
- `cronjob` diário para materializar recorrências.
- Segredos via `vd config contagorda/api set DATABASE_URL=... CLOWK_...` — nunca no HCL.
- Postgres na outra VM: `DATABASE_URL` apontando para o IP privado.

Front no Cloudflare Pages, build `pnpm build`, deploy por git push.

---

## Sequenciamento sugerido

1. **Trilha 1** — RS256/JWKS + `aud` (1.1) e refresh rotativo (1.2) primeiro; são o
   que destrava o resto. Depois SDK JS (1.3) e API-only no gem (1.4).
2. **Trilha 2** — schema + auth ponta a ponta (login no PWA, token válido na API Rails).
   Provar esse caminho **antes** de escrever qualquer CRUD.
3. CRUD de contas/categorias → transações → recorrência (última, é a mais complexa).
4. Dashboard por último, quando já houver dado real para exibir.

## Verificação

- **Auth**: login no PWA → recarregar a página → sessão sobrevive. Access token expira
  → renova sozinho sem o usuário perceber. Token de outro `aud` é rejeitado com 401.
  Refresh reutilizado invalida a família inteira.
- **Rails**: request `Authorization: Bearer` não devolve `Set-Cookie`. Request sem
  `Accept: application/json` ainda recebe 401 JSON, não redirect.
- **Isolamento**: token do usuário A não acessa recurso do usuário B — teste de request
  explícito para cada endpoint.
- **Recorrência**: série mensal criada em 31/jan gera ocorrência correta em fevereiro.
  Editar futuras preserva ocorrência editada à mão. Apagar futuras mantém o passado.
- **PWA iOS**: instalar na home screen, mandar para background, voltar depois — sessão
  intacta, sem faixa branca acima do header, safe area respeitada.
- **Deploy**: `vd diff -f voodu.hcl -r prod` limpo após apply; `vd logs contagorda/api -f`.
