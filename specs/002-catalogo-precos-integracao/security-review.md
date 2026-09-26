# Security Review: Catálogo e Preços — Integração com API Real

- **Plan relacionado**: `plan.md`
- **Status**: Aprovado com ressalvas

Processo seguido: `.claude/skills/security/references/pre-deploy-gate.md`.
Escopo: apenas o frontend consumindo uma API já existente — nenhum
endpoint/service/tabela do backend foi criado ou alterado nesta feature,
então autenticação/autorização de servidor, RLS e schema de banco não
foram tocados e não são reauditados aqui (já são responsabilidade da
feature/gate do próprio `poupe-certo-back`).

## Escopo da alteração

- **Feature**: substituição de dados mock por chamadas reais à API em
  `src/lib/api/{products,markets,price-reports,leaderboard,users}.ts`,
  hooks em `src/hooks/use-*`, e reescrita das telas home, busca, detalhe
  de produto, scan, cadastrar produto, confirmar preço e perfil.
- **Endpoints consumidos** (nenhum criado/alterado): `GET /products/search`,
  `GET /products/ean/:ean/exists`, `GET /products/:ean`,
  `POST /products`, `GET /markets`, `POST /markets`,
  `POST /products/:ean/price-reports`,
  `POST /price-reports/:id/confirmations`, `GET /leaderboard`,
  `GET /users/me/stats`, `GET /users/me/contributions`.
- **Blast radius**: `src/lib/api/client.ts` (interceptor Bearer) é
  reutilizado por todos os módulos novos, sem alteração — nenhum outro
  consumidor existente (login/feature 001) foi modificado.
- Teste mental "sem confiar no frontend": todo controle observado abaixo
  (aprovação de produto, autoria de contribuição, idempotência de
  confirmação, throttle de escrita) já é aplicado no backend
  (`SupabaseJwtGuard`, `ZodValidationPipe`, `WriteThrottle`,
  services) — o frontend só reflete o resultado, nunca decide.

## Achados

```text
Vulnerabilidade: Nenhuma vulnerabilidade CRITICAL/HIGH introduzida por esta feature.
Severidade: INFORMATIONAL
Arquivo: next.config.ts
Linha: -
Componente/Endpoint: app inteiro (pré-existente, não desta feature)
Evidência: CONFIRMADO (ausência de headers() no config)
Como pode ser explorada: N/A diretamente — ausência de CSP/HSTS/X-Content-Type-Options
  reduz defesa em profundidade contra XSS/clickjacking/downgrade, mas não é uma
  vulnerabilidade em si e é anterior a esta feature (já valia para /login, /onboarding etc.).
Impacto: Hardening geral do site, não específico desta feature.
Correção recomendada: tratar no /security-audit (auditoria de toda a plataforma),
  não bloquear esta feature por um gap pré-existente fora do seu escopo.
Como validar a correção: revisar next.config.ts com headers() num /security-audit dedicado.
```

```text
Vulnerabilidade: Sessão Supabase falsa usada em testes e2e (tests/e2e/fixtures/auth.ts)
  poderia, em tese, disparar refresh contra o Supabase Auth real.
Severidade: LOW
Arquivo: tests/e2e/fixtures/auth.ts
Linha: 21-35
Componente/Endpoint: apenas suíte de testes (nunca faz parte do bundle de produção)
Evidência: PROVÁVEL (não reproduzido — expires_at é 1h no futuro, refresh nunca dispara
  durante a duração de um teste)
Como pode ser explorada: se um teste ficasse pendurado por >1h, o supabase-js tentaria
  renovar o refresh_token fake contra https://mcuipdmthhpfbjneuspw.supabase.co real,
  que rejeitaria (401 invalid_grant) — não há forja de sessão válida possível, só uma
  falha de teste (flake), não uma vulnerabilidade de segurança.
Impacto: Nenhum — não expõe dado real nem permite bypass de auth real.
Correção recomendada: nenhuma ação necessária; registrado apenas por transparência.
Como validar a correção: N/A.
```

Nenhum outro achado CONFIRMADO/PROVÁVEL de severidade MEDIUM+ nesta
rodada. Pontos verificados ativamente e sem problema:

- **IDOR**: `useConfirmPrice`/`confirmPrice(priceReportId)` permite
  confirmar qualquer preço ativo — isso é o modelo de dados pretendido
  (confirmação comunitária, não restrita ao autor; ver comentário do
  próprio `PriceReportsController`), não uma falha de ownership.
  `getMyStats`/`getMyContributions` só leem `/users/me/*` — sem
  parâmetro de ID manipulável para acessar dado de outra pessoa.
- **Mass assignment**: `CreateProductInput`/`CreatePriceReportInput`/
  `CreateMarketInput` no frontend enviam só os campos que o formulário
  captura (nome, marca, qty, categoria, ean / marketId, price / name,
  address, city, uf) — nenhum campo administrativo (`status`,
  `createdBy`, `isOperator`, `reviewedBy`) é sequer exposto no formulário
  para ser enviado. A autoridade final continua sendo a validação Zod do
  backend, que o frontend não pode contornar de qualquer forma (um
  atacante chamando a API direto ignora o frontend por completo).
- **XSS**: nenhum `dangerouslySetInnerHTML` introduzido; todo dado da API
  (nome de produto, mercado, mensagem de erro) é renderizado via JSX
  (escape automático). Mensagens de erro exibidas ao usuário
  (`src/lib/api/errors.ts`) são strings fixas mapeadas por status HTTP —
  nunca o corpo bruto da resposta do backend é ecoado na tela (mitigação
  explícita contra refletir conteúdo não controlado).
- **Open redirect**: valores de `next` passados a `useRequireAuth` nesta
  feature são sempre literais internos (`/confirm-price?ean=...`,
  `/new-product?ean=...`, `/profile`) — nunca construídos a partir de
  input de terceiro que pudesse escapar do próprio domínio; a validação
  existente `safeNextPath` (feature 001, não alterada) continua sendo a
  última linha de defesa.
- **CORS do fixture de teste** (`tests/e2e/fixtures/mock-backend.ts`,
  `Access-Control-Allow-Origin: *`): existe só em `tests/e2e/`, fora da
  árvore `src/` que o `next build` empacota — confirmado no output do
  build (rotas geradas não incluem nada de `tests/`). Não é uma
  superfície de produção.
- **Segredos**: nenhum novo secret introduzido; `NEXT_PUBLIC_*` usados
  são publishable/públicos por desenho (mesma nota já registrada na
  feature 001 / `project.config.json`).
- **Double-submit / throttle**: botões de submit (`confirm-price`,
  `new-product`, criar mercado) desabilitam durante a mutação
  (`disabled={mutation.isPending}`) — reduz 409/429 espúrio; o controle
  real de rate limit continua sendo o `WriteThrottle` do backend.

## Checklist por tópico

### Autenticação e Autorização (`references/auth-authz.md`)

- [x] Toda ação de escrita desta feature (criar produto, criar mercado,
      reportar preço, confirmar preço) passa por rota que já exige
      `SupabaseJwtGuard` no backend — Aplicável — Resolvido (backend
      pré-existente, verificado nos controllers).
- [x] Nenhuma checagem de autorização nova foi implementada só no
      frontend — Aplicável — Resolvido (frontend só reflete 401/redireciona
      para login via `useRequireAuth`, já existente).
- [x] IDOR — Aplicável — Resolvido (ver "Achados" acima; confirmação de
      preço é intencionalmente aberta à comunidade, não ownership-based).

### Injection: XSS/CSRF/SSRF (`references/injection.md`)

- [x] XSS — Aplicável — Resolvido (JSX escapa por padrão; sem
      `dangerouslySetInnerHTML`; erros mapeados, nunca ecoados brutos).
- [ ] CSRF — Não aplicável (autenticação por Bearer token em header, não
      cookie — CSRF clássico não se aplica a este padrão).
- [ ] SSRF — Não aplicável (nenhuma URL fornecida por usuário é buscada
      pelo servidor nesta feature).

### API: Rate limiting, CORS, Mass Assignment (`references/api-security.md`)

- [x] Rate limiting nas rotas de escrita — Aplicável — Resolvido
      (`WriteThrottle` no backend, pré-existente).
- [x] Mass assignment — Aplicável — Resolvido (ver "Achados").
- [ ] CORS/headers de segurança do app — Pendente, mas fora do escopo
      desta feature (pré-existente, sem `headers()` em `next.config.ts`)
      — ver achado INFORMATIONAL acima; recomendado tratar via
      `/security-audit`, registrado em "Riscos aceitos explicitamente".

### Secrets, Exposição de Dados, Logs (`references/data-secrets-logging.md`)

- [x] Sem secret novo introduzido — Aplicável — Resolvido.
- [x] Sem log de dado sensível — Aplicável — Resolvido (nenhum
      `console.log`/`console.error` adicionado no código de produção).
- [x] Exposição de dado entre usuários — Aplicável — Resolvido
      (`/users/me/*` escopado por JWT no backend).

### Upload de Arquivos / RLS Supabase

Não aplicável — esta feature não adiciona upload de arquivo, e este
repositório (frontend puro) não acessa tabela Supabase diretamente (só
Auth) — RLS é responsabilidade do `poupe-certo-back`, não deste plano.

## Riscos aceitos explicitamente

- Ausência de `headers()` (CSP/HSTS/X-Content-Type-Options/
  Referrer-Policy) em `next.config.ts` — pré-existente ao workspace,
  fora do escopo desta feature de integração de API. Aceito como risco
  de baixo impacto imediato (não específico desta feature) a ser tratado
  num `/security-audit` da plataforma, não bloqueando este Code Review.

## Security Gate

```text
Status: PASS WITH WARNINGS

CRITICAL: 0
HIGH: 0
MEDIUM: 0
LOW: 1
INFORMATIONAL: 1
```

- **PASS WITH WARNINGS**: nada crítico ou alto; os dois itens registrados
  (headers de segurança sitewide pré-existentes, e o refresh teórico do
  token fake de teste) não bloqueiam o Code Review — liberado para
  `/review`.
