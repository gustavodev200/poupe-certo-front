# Quickstart: Validar Onboarding com IBGE + Mercados por Cidade

## Pré-requisitos

- `poupe-certo-back` rodando localmente (`npm run start:dev`), migration da
  feature já aplicada (`npx prisma migrate dev`), `DATABASE_URL` apontando
  pro Postgres do Supabase (dev/local conforme `.env` do back).
- `poupe-certo-front` rodando localmente (`npm run dev`),
  `NEXT_PUBLIC_API_URL` apontando pro back acima.
- Sessão autenticada (login Google via Supabase Auth — feature 001 já
  implementada).
- Rede liberada para `servicodados.ibge.gov.br` (API pública do IBGE).

## Cenário 1 — Onboarding com dados reais (US1)

1. Login e, se a pessoa ainda não tem `Profile.city`, é redirecionada para
   `/onboarding` (gate já existente em `(shell)/layout.tsx`).
2. Confirmar que os chips de UF mostram os 27 estados reais (não a lista
   mock antiga de poucos estados).
3. Selecionar um estado pouco comum em testes (ex. `AC` — Acre) e confirmar
   que a lista de cidades carrega os municípios reais daquele estado.
4. Digitar parte do nome de uma cidade no campo de busca e confirmar que o
   filtro funciona sem nova chamada de rede (ver aba Network do browser —
   nenhuma requisição nova ao IBGE por tecla digitada).
5. Selecionar uma cidade e tocar "Continuar".
6. **Esperado**: requisição `PATCH /users/me/location` com `{ city, uf }`
   sai com sucesso (200); navegação para `/` acontece só depois da
   confirmação do backend (ver contracts/api.md#patch-usersmelocation).

## Cenário 2 — Mercados filtrados pela cidade (US2)

1. Com a cidade do Cenário 1 salva, abrir a home (`/`) ou a tela de
   confirmação de preço.
2. **Esperado**: a chamada `GET /markets?city=...&uf=...` (ver Network)
   inclui os parâmetros da cidade atual; nenhum mercado de outra cidade
   aparece na lista.
3. Cadastrar um mercado novo (`POST /markets`) nessa cidade e confirmar que
   ele aparece na listagem filtrada sem precisar recarregar a página
   (invalidação de query do React Query).
4. Repetir com uma cidade sem nenhum mercado cadastrado ainda — confirmar
   estado vazio claro (não lista de outras cidades, não tela quebrada).

## Cenário 3 — Trocar de cidade (US3)

1. Com uma cidade já salva, usar o seletor de cidade do topo do site
   (mencionado no rodapé do onboarding) para trocar para outra cidade.
2. **Esperado**: `PATCH /users/me/location` é chamado com a nova cidade;
   a listagem de mercados visível atualiza para a nova cidade sem precisar
   dar F5.

## Cenário 4 — Falha da API do IBGE (edge case, FR-009)

1. Bloquear `servicodados.ibge.gov.br` (ex. via DevTools → Network →
   block request URL, ou desconectar a rede) e abrir `/onboarding`.
2. **Esperado**: estado de carregamento aparece primeiro; em seguida, uma
   mensagem de erro clara com botão de "tentar novamente" — nenhuma tela em
   branco/quebrada, botão "Continuar" permanece desabilitado.
3. Restaurar a rede e tocar "tentar novamente" — lista de estados carrega
   normalmente.

## Cenário 5 — Pessoa com cidade mock antiga (edge case, SC-004)

1. Simular uma sessão de antes desta feature: no banco, garantir que
   `Profile.city`/`Profile.uf` estão `NULL` para a pessoa de teste (estado
   pós-migration para qualquer perfil pré-existente).
2. Fazer login com essa pessoa.
3. **Esperado**: mesmo que o `localStorage` do navegador tenha uma cidade
   mock antiga salva (`poupe-certo:location`), a pessoa é redirecionada para
   `/onboarding` (o backend, sem `city`, vence a sincronização — ver
   research.md#4) e precisa escolher a cidade pela lista oficial do IBGE.

## Verificação automatizada (referência — implementação em `tasks.md`)

- Front (`vitest`): teste de `use-ibge-locations` (mock de fetch),
  teste do fluxo do onboarding (seleciona UF → cidade → salva), teste de
  `use-markets` incluindo `city`/`uf` na query.
- Back (`*.e2e-spec.ts`): `PATCH /users/me/location` grava só a própria
  linha (tentar outro `userId` não deve ser possível — nem existe esse
  parâmetro); `GET /markets?city=&uf=` filtra corretamente.
