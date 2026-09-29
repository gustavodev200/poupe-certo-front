# Quickstart: Validar Minha Lista

## Pré-requisitos

- `poupe-certo-back` rodando localmente (`npm run start:dev`), migration da
  feature já aplicada (`npx prisma migrate dev`).
- `poupe-certo-front` rodando localmente (`npm run dev`),
  `NEXT_PUBLIC_API_URL` apontando pro back acima.
- Sessão autenticada (login Google via Supabase Auth).
- Pelo menos um produto com oferta `ACTIVE` já cadastrada (ex.: seguir o
  quickstart da feature 002 até ter um preço reportado).

## Cenário 1 — Adicionar produto à lista (US1)

1. Abrir a página de um produto (`/product/:ean`) que tem "MELHOR PREÇO"
   visível.
2. Clicar em "Adicionar à lista".
3. **Esperado**: `POST /users/me/list` sai com `{ productEan }` e responde 201; o
   botão passa a indicar que o produto já está na lista (FR-009).
4. Abrir "Minha Lista" (nova entrada de navegação) e confirmar que o item
   aparece com o mesmo preço/mercado que estavam na tela do produto.
5. Voltar à página do produto e reportar um preço novo, mais baixo, para o
   mesmo produto/mercado (fluxo já existente de "Registrar preço").
6. Reabrir "Minha Lista" — **esperado**: o preço do item **não muda**
   (snapshot imutável, FR-002), mesmo com uma oferta mais barata agora
   disponível no catálogo.
7. Clicar em "Adicionar à lista" de novo no mesmo produto — **esperado**:
   nenhum item duplicado aparece em "Minha Lista" (FR-003).

## Cenário 2 — Marcar como comprado (US2)

1. Em "Minha Lista", com pelo menos um item pendente, marcar seu checkbox.
2. **Esperado**: `PATCH /users/me/list/:id` sai com `{ purchased: true }`; o item
   aparece riscado mas continua na lista.
3. Desmarcar o checkbox — **esperado**: `PATCH` com `{ purchased: false }`;
   item volta ao estado normal.

## Cenário 3 — Remover item (US3)

1. Em "Minha Lista", remover um item (comprado ou pendente).
2. **Esperado**: `DELETE /users/me/list/:id` responde 204; o item some da tela
   imediatamente.
3. Recarregar a página (F5) — **esperado**: o item removido não volta.

## Cenário 4 — Isolamento entre contas (FR-007, edge case de segurança)

1. Logado como conta A, adicionar um produto à lista e copiar o `id` do
   item (via Network tab da resposta de `POST /users/me/list`).
2. Trocar para uma conta B (logout + login com outra conta Google).
3. Tentar `PATCH /users/me/list/:id` ou `DELETE /users/me/list/:id` com o `id` da
   conta A (via `curl`/Postman, já que a UI de B nunca mostra esse id).
4. **Esperado**: 404 em ambas as tentativas — nunca 200, nunca um erro que
   confirme "o id existe mas não é seu".
5. `GET /users/me/list` da conta B **esperado**: não inclui o item da conta A.

## Cenário 5 — Estado vazio

1. Com uma conta nova (sem nenhum item adicionado), abrir "Minha Lista".
2. **Esperado**: mensagem de lista vazia convidando a escanear/buscar um
   produto — nunca uma tela em branco ou erro.
