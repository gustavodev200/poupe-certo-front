# Quickstart: Catálogo e Preços — Integração com API Real

## Pré-requisitos

1. `poupe-certo-back` rodando localmente (`npm run start:dev` no repo
   `poupe-certo-back`, porta padrão 3333, `DATABASE_URL`/Supabase
   configurados conforme o `.env` dele).
2. `poupe-certo-front`: `.env.local` com `NEXT_PUBLIC_API_URL` apontando
   pro backend acima, e `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (mesmos da feature 001).
3. `npm install` neste repo (adiciona Vitest, Testing Library e
   Playwright — ver `tasks.md` Setup).
4. Login com Google (feature 001) funcionando — necessário para os
   fluxos de escrita.

## Rodar

```bash
npm run dev      # http://localhost:3000
```

## Validação manual (caminho feliz)

1. **Busca real**: abrir `/search?q=<termo existente no backend>` →
   resultados vêm de `GET /products/search` (checar Network, não
   `src/lib/mock`).
2. **Detalhe real**: abrir `/product/<ean aprovado>` → ofertas,
   estatísticas e histórico vêm de `GET /products/:ean`.
3. **Scan → confirmar preço**: `/scan`, digitar um EAN existente e
   aprovado → deve navegar para `/confirm-price?ean=...`; escolher
   mercado (lista real de `GET /markets`) e enviar preço → toast com
   pontos ganhos; voltar ao detalhe do produto e ver a nova oferta.
4. **Scan → cadastrar produto**: digitar um EAN inexistente → navega
   para `/new-product?ean=...`; preencher e enviar → toast "pendente de
   aprovação" com pontos.
5. **Confirmar preço vigente**: no detalhe de um produto com oferta,
   clicar "Sim, está correto" → contagem de confirmações incrementa sem
   reload.
6. **Perfil real**: `/profile` autenticado → estatísticas, nível e
   contribuições recentes vêm de `GET /users/me/stats` e
   `GET /users/me/contributions`.
7. **Ranking real**: home → seção "top contribuidores" vem de
   `GET /leaderboard`.

## Testes automatizados

```bash
npm run test          # Vitest — unidade (schemas Zod, lib/api parsing)
npm run test:e2e       # Playwright — instala browsers na 1ª vez (npx playwright install)
```

`test:e2e` sobe o próprio `next dev` (via `webServer` do Playwright
config) contra o backend já no ar; ver `playwright.config.ts` (criado
em `tasks.md`) para `baseURL` e projetos de viewport (`Mobile`,
`Desktop`).

## Checagem de responsividade

Sem MCP do Playwright disponível nesta sessão de execução — a
verificação visual multi-viewport pedida pelo usuário foi coberta com
o **framework** `@playwright/test` (não o MCP): os specs em
`tests/e2e/` rodam em dois projetos de viewport (375×667 e 1440×900) e
falham se houver overflow horizontal (`document.documentElement.scrollWidth`
vs. viewport width) nas telas afetadas. Ver tasks.md fase Polish para o
teste específico `tests/e2e/responsive.spec.ts`.

## Critério de "funciona"

Todos os passos 1–7 completam sem erro no console e sem tela branca;
`npm run build`, `npm run lint`, `npm run test` e `npm run test:e2e`
passam.
