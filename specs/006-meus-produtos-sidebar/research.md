# Research — 006 Meus produtos + navegação lateral

## 1. Onde mora o endpoint

- **Decision**: `GET /users/me/products` no `UsersController`.
- **Rationale**: segue o padrão "meus dados" (`/users/me/stats`, `/users/me/contributions`, `/users/me/list`). `ProductsController` é catálogo público por cidade.
- **Alternatives**: `GET /products?mine=true` — mistura catálogo público com dado privado e complica cache.

## 2. Autorização / RLS

- **Decision**: `prisma.asUser(userId, tx => tx.product.findMany({ where: { createdBy: userId, status? } }))`.
- **Rationale**: policy `products_select_own` (created_by = auth.uid()) já libera pendentes/rejeitados da própria pessoa; o `where createdBy` explícito evita receber aprovados de terceiros (policy `products_select_approved` também vale para `authenticated`). Defesa dupla (Princípio III).
- **Alternatives**: nenhuma migration necessária.

## 3. Contagens por status (abas + contador do menu)

- **Decision**: resposta inclui `counts: { PENDING, APPROVED, REJECTED }` via `groupBy` na mesma transação.
- **Rationale**: um request dá itens da aba + números de todas as abas; menu usa `status=PENDING&pageSize=1` e lê `counts.PENDING`. Evita endpoint de contagem separado (YAGNI).
- **Alternatives**: `/users/me/products/counts` — mais uma rota sem ganho real.

## 4. Paginação

- **Decision**: `page`/`pageSize` (default 20, máx 50), ordenação `createdAt desc, ean asc` (desempate estável), `useInfiniteQuery` + botão "Carregar mais".
- **Rationale**: mesmo formato de `contributions`; volume por pessoa é pequeno, offset é suficiente.
- **Alternatives**: cursor — desnecessário nesta escala.

## 5. `isOperator` no front

- **Decision**: `GET /users/me` passa a incluir `isOperator: boolean` (lido pela própria pessoa; coluna já tem `GRANT SELECT` para `authenticated`, own-row).
- **Rationale**: evita chamar `/moderation/queue` em toda página só para saber se mostra "Admin". Expor o próprio flag não é sensível; a proteção real segue no `OperatorGuard`.
- **Alternatives**: sondar `/moderation/queue` (custo + 403 no console para todo mundo).

## 6. Sidebar compartilhada

- **Decision**: extrair de `admin-sidebar.tsx` um componente `Sidebar` (rail desktop colapsável + drawer radix Dialog) parametrizado por `brand`, `items`, `footer`, `collapsed/onToggle`, `mobileOpen/onMobileOpenChange`. `AppSidebar` e `AdminSidebar` apenas configuram. Estado em `useSidebarStore` (zustand persist com `partialize` só de `collapsed`; `mobileOpen` efêmero) — uma store por área (`app` e `admin`) via factory simples.
- **Rationale**: o botão de menu mobile fica no `SiteHeader` e a gaveta no layout; store compartilhada evita prop-drilling. Reaproveita o padrão existente (pedido explícito).
- **Alternatives**: shadcn `sidebar` block — traria provider/cookies/muitos arquivos; overkill com o padrão já pronto.

## 7. Layout do shell

- **Decision**: `(shell)/layout.tsx` vira `flex` em linha: `<AppSidebar/>` (sticky `h-svh`, `hidden md:flex`) + coluna `min-w-0 flex-1` com header/main/footer. Header mantém `max-w-6xl` interno.
- **Rationale**: `min-w-0` no filho flex evita overflow horizontal (armadilha já vista no pass responsivo da 002).
- **Alternatives**: sidebar `fixed` + `padding-left` — exige sincronizar largura em dois lugares.

## 8. Header

- **Decision**: remove ícone "Minha Lista" do header (está no menu e na barra inferior); adiciona botão de menu `md:hidden` à esquerda do logo. Mantém "Escanear preço" (CTA), tema e avatar.
