# Phase 0 Research: Minha Lista

Nenhum `NEEDS CLARIFICATION` ficou pendente no `plan.md` — as decisões
abaixo documentam escolhas feitas reaproveitando padrões já existentes no
código, não pesquisa de tecnologia nova.

## 1. Onde mora o "snapshot" de preço/mercado

**Decision**: A tabela `shopping_list_items` guarda `price` (cópia do valor
na hora do INSERT) e `market_id` (FK para `Market`), mas **não** referencia
`price_report_id`.

**Rationale**: `PriceReport` pode mudar de `status` depois (ex.: um reporte
mais novo supera o antigo como "oferta vigente", ou um reporte é
reprovado) — se o item da lista apontasse pra ele, o preço exibido
dependeria do estado atual de uma linha que não é mais "a oferta atual".
Copiar o número (`Decimal`) no momento do `POST /me/list` garante que o
snapshot realmente não muda depois, como a FR-002 exige. `Market` já é,
na prática, append-only (não existe endpoint de editar mercado) — referenciar
`market_id` por FK entrega o mesmo efeito de "nome/cidade não mudam depois"
sem duplicar `name`/`city`/`uf` como colunas extras (YAGNI).

**Alternatives considered**:
- Guardar `price_report_id` além do preço copiado → rejeitado: dado
  redundante sem uso (nada na spec pede "ver o reporte original"), e sem
  garantia adicional de imutabilidade sobre já copiar o preço.
- Duplicar `market_name`/`market_city`/`market_uf` como colunas de texto →
  rejeitado: mercado não tem endpoint de edição hoje, então FK já é estável;
  duplicar colunas é complexidade sem problema real a resolver (viola
  Princípio VI).

## 2. Concorrência no "um item por produto por pessoa" (FR-003)

**Decision**: Constraint `@@unique([userId, productEan])` no banco +
`upsert` (`update: {}` quando já existe) no service, mesmo padrão já usado
por `PriceConfirmation` (`@@unique([priceReportId, confirmedBy])` +
`priceConfirmation.upsert` em `price-reports.service.ts#confirm`).

**Rationale**: Resolve o edge case de duas abas adicionando o mesmo produto
quase ao mesmo tempo sem precisar de lock explícito — o banco garante a
unicidade, e o `upsert` faz a segunda tentativa ser um no-op idempotente em
vez de erro 500 por violação de constraint.

**Alternatives considered**: Checar existência antes de inserir
(`findFirst` + `create` condicional) → rejeitado: tem race condition real
entre o `findFirst` e o `create` sob concorrência; `upsert` é atômico.

## 3. Autorização em `PATCH`/`DELETE` de um item específico

**Decision**: Toda query usa `asUser(userId, ...)` (RLS filtra por
`user_id = auth.uid()`) **e** o service filtra explicitamente por
`{ id, userId }` antes de alterar — mesmo padrão de dupla camada já usado
em `PriceReportsService.confirm` (busca com `where: { id, status: 'ACTIVE' }`
antes de agir) e exigido pelo Princípio III da constitution (RLS não
substitui checagem explícita no server).

**Rationale**: Se o `id` pertence a outra conta, a query simplesmente não
encontra a linha (RLS já barra a visibilidade) — o service trata isso como
`NotFoundException`, igual ao resto da API, sem vazar se o id existe ou não
para outra conta.

**Alternatives considered**: Confiar só em RLS sem filtro explícito no
`where` → rejeitado, viola Princípio III (funciona por acidente hoje, mas
não é a garantia que a constitution pede).

## 4. Onde calcular "o melhor preço atual" no `POST /me/list`

**Decision**: Reaproveitar a mesma lógica de `latestActivePerMarket` +
"menor preço entre ofertas vigentes" já usada em
`ProductsService.findDetail`/`search`, chamada a partir do novo
`ShoppingListService` (ou extraída para um helper compartilhado se a
duplicação incomodar na implementação — decisão de detalhe, não de design).

**Rationale**: É exatamente a mesma regra de negócio ("oferta vigente" =
reporte `ACTIVE` mais recente por mercado, menor preço entre eles) que já
existe e é testada em `products.service.ts`. Recalcular do zero seria
duplicar lógica com risco de divergir.

**Alternatives considered**: Deixar o front mandar o preço/mercado que
já está renderizado na tela → rejeitado: nunca confiar em preço vindo do
cliente (o snapshot gravado precisa ser o que o servidor validou como
oferta vigente, não o que o navegador diz que está vendo).
