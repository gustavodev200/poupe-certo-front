# Research: Catálogo e Preços — Integração com API Real

## 1. Camada de acesso à API

**Decision**: Um arquivo por recurso em `src/lib/api/{products,markets,price-reports,leaderboard,users}.ts`,
cada um exportando funções `async` finas que chamam `api` (axios,
`src/lib/api/client.ts`) e retornam o resultado já validado por um
schema Zod local ao arquivo (`z.object(...).parse(response.data)`).
Nenhuma classe, nenhum "repository" genérico.

**Rationale**: `client.ts` já resolve Bearer token e baseURL — não há
nada a abstrair além do parsing/tipagem por recurso. Zod na resposta
garante que uma mudança de contrato no backend quebra em teste/dev
(erro claro) em vez de silenciosamente corromper a UI. Espelha a
convenção de módulo por recurso já usada no backend (`products.dto.ts`,
`market.dto.ts`, etc.), facilitando achar o par request/response.

**Alternatives considered**:
- *Um client único "catálogo" com todos os métodos*: rejeitado — mistura
  5 recursos independentes num arquivo grande, dificulta code review e
  contraria YAGNI (nenhuma necessidade real de agrupar).
- *Gerar client a partir do OpenAPI/Swagger do Nest*: mais robusto a
  longo prazo, mas exige pipeline de geração de código que não existe
  hoje e é desproporcional a 5 recursos estáveis — não adicionado agora
  (YAGNI); pode ser revisitado se o contrato crescer muito.

## 2. Data fetching / cache

**Decision**: Um hook por caso de uso em `src/hooks/use-<recurso>.ts`
usando `useQuery`/`useMutation` do TanStack Query já provido em
`providers.tsx`. Query keys como array tipado, ex.:
`["products", "search", { q, category, sort, page }]`.

**Rationale**: TanStack Query já está instalado e provido — reaproveitar
é a opção YAGNI. `useMutation` com `onSuccess: () => queryClient.invalidateQueries(...)`
cobre o caso de reportar/confirmar preço refletir na tela de detalhe
sem lógica de cache manual.

**Alternatives considered**:
- *Fetch direto em Server Component*: adequado para SEO/first paint, mas
  a maioria destas telas já é `"use client"` (formulários, interação
  imediata como confirmar preço) — misturar os dois padrões sem
  necessidade aumenta complexidade. Mantido client-side com
  TanStack Query, consistente com o que já existe.

## 3. Validação de formulários (Zod na borda)

**Decision**: Ajustar `src/lib/validations/price-report.ts`:
- `priceReportSchema`: `marketId` (uuid, vem de um `<Select>` populado
  pela API) + `price` como string de input transformada em número
  (`Number(v.replace(",", "."))`), replicando a regra "> 0" que o
  backend também aplica.
- `newProductSchema`: mantém forma atual (`name`, `brand`, `qty`,
  `category` como um dos `CATEGORY_CODES`), já compatível com
  `CreateProductDto`.
- Novo `createMarketSchema` (nome obrigatório, endereço/cidade/UF
  opcionais) para o formulário inline de "cadastrar mercado novo".

**Rationale**: Mesma regra do backend replicada no cliente só para dar
feedback imediato — a fonte de verdade da validação continua sendo o
backend (`ZodValidationPipe` lá); isso é UX, não uma segunda camada de
autorização.

**Alternatives considered**: compartilhar literalmente o mesmo arquivo
de schema Zod entre os dois repositórios via package — rejeitado por
YAGNI (dois repos separados, sem workspace/monorepo configurado; criar
um pacote compartilhado agora é desproporcional a 2-3 schemas).

## 4. Categorias

**Decision**: Nenhuma mudança — `CATEGORIES`/`CategoryId` do frontend já
usa exatamente os mesmos códigos (`merc`, `beb`, `lim`, `hig`, `fri`,
`pad`) que `CATEGORY_CODES` do backend (`poupe-certo-back/src/products/categories.ts`).
Mover essa constante de `src/lib/mock/catalog.ts` para
`src/lib/api/products.ts` (ou um `src/lib/categories.ts` próprio) antes
de apagar o arquivo mock.

**Rationale**: Zero tradução necessária entre front e back — dado já
projetado para bater 1:1 (comentário no próprio código do backend
confirma a intenção).

## 5. Fluxo de scan (existência de EAN)

**Decision**: `scan/page.tsx` troca `getProductByEan(ean)` síncrono por
`await` a uma função `checkEanExists(ean)` (`GET /products/ean/:ean/exists`)
no momento da detecção, com estado de "verificando" enquanto a chamada
está em voo antes de navegar.

**Rationale**: Contrato do backend já foi desenhado exatamente para
este passo (`ProductExistsDto { exists, approved }`) — usar direto,
sem reinventar.

**Alternatives considered**: usar `GET /products/:ean` (detalhe) e
tratar 404 como "não existe" — funciona, mas gasta uma query maior
(ofertas, histórico) só para saber um booleano; o endpoint `exists` já
existe justamente para isso.

## 6. Responsividade

**Decision**: Mobile-first com os breakpoints Tailwind já usados no
projeto (`sm`, `md`, `lg` — ver classes existentes em `page.tsx`,
`results-view.tsx`). Pontos identificados que precisam de ajuste:
- `ProductView`: `Table` de ofertas (`src/components/ui/table.tsx`)
  vira lista de cards em telas < `sm`, tabela em `sm+` (mesma
  informação, layout diferente) — tabela HTML crua costuma exigir
  scroll horizontal em 320–375px.
- `ConfirmPriceForm`/`NewProductForm`: já são `max-w-md`, mas o
  `<Select>` de mercado e o novo botão "cadastrar mercado" precisam
  caber em 320px sem quebrar o teclado numérico do input de preço.
- Home: grid de produtos (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`)
  e o card de top contribuidores já são responsivos — validar apenas
  com dado real (nomes/preços mais longos que o mock).
- `mobile-action-bar.tsx` (já existe) — confirmar que continua fixo e
  não sobrepõe conteúdo novo (ex.: formulário de mercado inline).

**Rationale**: Reaproveita o design system Tailwind já adotado; não
introduz breakpoint customizado sem necessidade (YAGNI). Validação via
Playwright com viewports fixos (ver `quickstart.md`) substitui a
inspeção manual pedida (MCP do Playwright indisponível nesta sessão —
ver nota em `tasks.md`).

## 7. Testes — ferramentas novas

**Decision**:
- Unitário/componente: **Vitest** + `@testing-library/react` +
  `@testing-library/jest-dom`, ambiente `jsdom`. Escopo: schemas Zod
  (validations), funções puras de `src/lib/api/*.ts` (parsing/mapeamento),
  e 1-2 componentes com lógica não-trivial (ex.: `ResultsView` ordenação).
- E2E: **`@playwright/test`**, contra `next dev` local (`baseURL`via
  env), cobrindo os dois caminhos felizes P1 do spec (busca→produto;
  scan→reportar preço) + 1 fluxo de cadastro de produto novo. Projetos
  de viewport (`Mobile` 375×667 e `Desktop` 1440×900) para also servir
  de checagem de responsividade automatizada.

**Rationale**: Segue exatamente a pirâmide da skill `testing`
(unitário rápido sem I/O + poucos e2e focados no caminho feliz);
nenhum dos dois frameworks existia no projeto, então não há
duplicação/conflito com nada pré-existente.

**Alternatives considered**: Jest em vez de Vitest — rejeitado porque
o projeto já usa Vite-like tooling (Next 16 + Turbopack) e Vitest tem
setup mais simples com ESM/TS nativo do que Jest neste contexto; ver
memória do workspace sobre Jest exigir `--experimental-vm-modules` em
outro projeto do mesmo usuário (fricção evitável aqui).

## 8. Segurança — pontos que a Security Review (`/security`) vai olhar

**Decision (só apontado aqui, decidido na fase `/security`)**: rate
limit de escrita já existe no backend (`WriteThrottle`); frontend deve
desabilitar o botão de submit durante a mutação (evita double-submit,
não é controle de segurança por si, mas reduz 409/429 espúrio).
Nenhum dado sensível (token) é logado; erros de API mostrados ao
usuário não devem ecoar mensagem bruta do backend sem sanitização
(evitar refletir HTML/stack trace).
