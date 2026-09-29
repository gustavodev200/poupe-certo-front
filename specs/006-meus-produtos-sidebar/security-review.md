# Security Review: Meus produtos + navegação lateral

- **Plan relacionado**: `plan.md`
- **Status**: Aprovado

## Escopo da alteração

- Feature: listagem dos próprios produtos por status + menu lateral no app.
- Back: `GET /users/me/products` (novo), `GET /users/me` passa a devolver `isOperator`. Sem migration, sem escrita.
- Front: `/my-products`, `AppSidebar`/`Sidebar`, header, `profileSchema`.
- Blast radius: `UsersService.findMe` (consumido por `/users/me` e pelo shell/onboarding do front — campo adicional, não removido). `AdminSidebar` refatorado (só UI; proteção do admin segue no `OperatorGuard`).

## Achados

Nenhum achado CRITICAL/HIGH/MEDIUM.

```text
Vulnerabilidade: Exposição do flag is_operator à própria pessoa
Severidade: INFORMATIONAL
Arquivo: poupe-certo-back/src/users/users.service.ts
Componente/Endpoint: GET /users/me
Evidência: CONFIRMADO (intencional)
Como pode ser explorada: não pode — só revela o próprio papel, que a pessoa já descobriria recebendo 403 em /moderation/*.
Impacto: nenhum; o item "Admin" escondido no front não é controle de acesso.
Correção recomendada: nenhuma.
Como validar a correção: n/a
```

## Checklist por tópico

### Autenticação e Autorização

- [x] Endpoint novo exige JWT — Resolvido — `@UseGuards(SupabaseJwtGuard)` no controller inteiro; e2e `401 sem token`.
- [x] Ownership no servidor — Resolvido — `where createdBy: userId` (do token, nunca do cliente) **e** leitura via `asUser` (RLS `products_select_own`). O filtro explícito é necessário porque `products_select_approved` também vale para `authenticated`.
- [x] IDOR — Não aplicável — endpoint não recebe id de usuário/produto.
- [x] Admin só por UI? — Resolvido — `OperatorGuard` continua protegendo `/moderation/*`; menu só decide exibição.

### Injection

- [x] SQLi — Resolvido — Prisma parametrizado; `status` restrito a enum Zod.
- [x] XSS — Resolvido — React escapa texto; `imageUrl` é gravada pelo servidor (Cloudinary, feature 005), não pelo cliente.

### API

- [x] Validação de query — Resolvido — Zod (`status` enum, `page ≥ 1`, `pageSize ≤ 50`) via `ZodValidationPipe`; unit test.
- [x] Custo por request — Resolvido — paginação limitada a 50; `count` + `groupBy` sobre `created_by` (sem índice dedicado hoje — ok na escala atual; adicionar `@@index([createdBy])` se o catálogo crescer). Sem rate limit dedicado, igual aos demais `/users/me/*`.
- [x] Mass assignment — Não aplicável — somente leitura.

### Secrets, Exposição de Dados, Logs

- [x] Resposta só com campos do próprio produto (sem `createdBy`/`reviewedBy`) — Resolvido.
- [x] Cache do front entre contas — Resolvido — `queryClient.clear()` na troca de usuário (feature 002) cobre as chaves `["users","me","products",…]`; queries desabilitadas para anônimo.

### Upload de Arquivos

Não aplicável.

### RLS no Supabase

- [x] Sem tabela nova — Não aplicável. Leitura reusa `products_select_own` via `asUser`.

## Gate final

PASS — nenhum achado bloqueante.
