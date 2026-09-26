# Feature Specification: Catálogo e Preços — Integração com API Real

**Feature Branch**: `002-catalogo-precos-integracao`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Integração real do frontend com a API do backend (poupe-certo-back): substituir todos os dados mock do catálogo (produtos, ofertas, mercados, busca, scan, cadastro de produto, confirmação/reporte de preço, perfil/estatísticas, ranking de contribuidores) por chamadas reais aos endpoints REST já existentes (products, markets, price-reports, leaderboard, users). Cobre também melhorar responsividade de todas as telas (mobile-first até desktop) e adicionar testes automatizados (unitários + e2e) do fluxo. Login com Google já está implementado (feature 001) e não faz parte desta feature."

## Clarifications

Nenhuma pergunta enviada ao usuário nesta rodada — decisões abaixo tomadas
por padrão razoável (ver Assumptions) porque o usuário sinalizou execução
autônoma sem interrupções. Se algum padrão não servir, ajustar via nova
sessão de `/speckit-clarify`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Buscar e comparar preços reais (Priority: P1) 🎯 MVP

Uma pessoa autenticada abre o site, busca um produto (por nome ou
categoria) e vê os preços reais informados pela comunidade em cada
mercado, ordenados por menor preço ou mais recente, com indicação de
quão confiável é cada preço (idade + confirmações).

**Why this priority**: É o valor central do produto — sem isso, todo o
resto (cadastro, scan, perfil) não tem propósito. Hoje a busca e a home
mostram só 4 produtos fixos de mentira.

**Independent Test**: Buscar por um termo existente na base real do
backend e confirmar que os resultados vêm da API (não do arquivo mock),
refletindo produtos/preços cadastrados de fato, incluindo o caso de
zero resultados.

**Acceptance Scenarios**:

1. **Given** a home carregada, **When** a pessoa digita um termo na busca,
   **Then** a lista de resultados reflete produtos aprovados retornados
   pela API `GET /products/search`, com o menor preço e o mercado de cada
   oferta.
2. **Given** um produto específico, **When** a pessoa abre sua página de
   detalhe, **Then** vê todas as ofertas por mercado, estatísticas
   (menor/média/maior) e histórico de preço vindos de
   `GET /products/:ean`.
3. **Given** a home sem busca, **When** a página carrega, **Then** a
   seção "menores preços perto de você" mostra produtos reais (não mock)
   — usando os resultados mais recentes/mais baratos disponíveis.
4. **Given** uma busca sem resultados, **When** a pessoa vê a tela,
   **Then** aparece uma mensagem convidando a cadastrar o produto, sem
   erro visual.

---

### User Story 2 - Escanear e informar/confirmar preço real (Priority: P1) 🎯 MVP

Uma pessoa autenticada escaneia (ou digita) o código de barras de um
produto na gôndola. Se o produto já existe na base, ela escolhe o
mercado e envia o preço observado (ou confirma que o preço vigente
ainda está correto). Se o produto não existe, ela o cadastra.

**Why this priority**: É o mecanismo que alimenta a base de preços —
sem escrita real, a User Story 1 nunca teria dados verdadeiros.

**Independent Test**: A partir de um EAN conhecido, completar o fluxo
de reportar preço e ver o ponto ganho refletido; a partir de um EAN
desconhecido, cadastrar o produto e ver status "pendente de aprovação".

**Acceptance Scenarios**:

1. **Given** um EAN escaneado/digitado, **When** o sistema verifica via
   `GET /products/ean/:ean/exists`, **Then** a pessoa é levada para
   "confirmar preço" (produto existe) ou "cadastrar produto" (não
   existe).
2. **Given** a tela de confirmar preço com produto existente, **When** a
   pessoa escolhe um mercado (da lista real de `GET /markets`, com opção
   de cadastrar um mercado novo) e informa o preço, **Then** o preço é
   enviado via `POST /products/:ean/price-reports` e a pessoa vê os
   pontos ganhos e o status (aceito direto ou em revisão).
3. **Given** a tela de detalhe do produto, **When** a pessoa confirma que
   o preço vigente ainda está correto, **Then** o sistema chama
   `POST /price-reports/:id/confirmations` e atualiza a contagem de
   confirmações exibida.
4. **Given** a tela de cadastro de produto novo, **When** a pessoa
   preenche nome/marca/quantidade/categoria e envia, **Then** o produto
   é criado via `POST /products` com status pendente e a pessoa recebe
   os pontos de cadastro.
5. **Given** um preço fora do padrão de mercado, **When** o backend
   retorna status "pendente de revisão", **Then** a pessoa vê mensagem
   explicando que o preço será revisado antes de aparecer publicamente.

---

### User Story 3 - Ver meu perfil, estatísticas e ranking reais (Priority: P2)

Uma pessoa autenticada vê no próprio perfil: pontos, nível, posição no
ranking, estatísticas de contribuição e o feed das próprias
contribuições recentes — todos vindos da API, não de números fixos.

**Why this priority**: Reforça o incentivo de gamificação (retenção),
mas o produto funciona sem isso no primeiro uso.

**Independent Test**: Abrir `/profile` autenticado e confirmar que os
números vêm de `GET /users/me/stats` e o feed vem de
`GET /users/me/contributions`, mudando conforme a pessoa contribui.

**Acceptance Scenarios**:

1. **Given** uma pessoa autenticada em `/profile`, **When** a página
   carrega, **Then** pontos, nível, progresso até o próximo nível e
   posição no ranking vêm de `GET /users/me/stats`.
2. **Given** a mesma página, **When** a seção "minhas contribuições"
   carrega, **Then** mostra os itens reais (preço reportado ou produto
   criado) de `GET /users/me/contributions`, paginado.
3. **Given** a home, **When** a seção "top contribuidores" carrega,
   **Then** mostra o ranking real de `GET /leaderboard`.

---

### Edge Cases

- API do backend fora do ar ou lenta: cada tela mostra estado de
  carregamento e, em caso de erro, mensagem amigável com opção de tentar
  de novo — nunca uma tela em branco ou crash.
- Sessão expirada durante uma ação de escrita (reportar preço, cadastrar
  produto/mercado, confirmar preço): a pessoa é redirecionada ao login
  preservando a intenção (`next`), sem perder o que já preencheu quando
  possível.
- Preço com formato inválido (texto, negativo, zero): bloqueado no
  cliente antes do envio, com mensagem clara — mesma regra do backend
  (Zod na borda nos dois lados).
- Confirmar um preço que já foi confirmado por essa mesma pessoa antes:
  a ação é idempotente (backend já garante isso) — a tela não deve
  mostrar erro, apenas o estado já confirmado.
- Cadastrar um EAN que já existe (corrida entre duas pessoas escaneando
  o mesmo produto ao mesmo tempo): backend responde 409, tela informa
  que o produto já foi cadastrado e oferece ir direto para "confirmar
  preço".
- Tela em qualquer largura entre a menor usada por celulares comuns e
  telas grandes de desktop: nenhum conteúdo corta, sobrepõe ou exige
  rolagem horizontal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE listar/buscar produtos aprovados a partir da
  API real (nome, marca, categoria, ordenação por menor preço ou mais
  recente, paginação), substituindo por completo o catálogo mock.
- **FR-002**: O sistema DEVE exibir o detalhe de um produto (ofertas por
  mercado, estatística de menor/média/maior preço, histórico) a partir
  da API real.
- **FR-003**: O sistema DEVE, no fluxo de escaneamento/digitação de EAN,
  consultar a API para saber se o produto existe e direcionar para
  "confirmar preço" ou "cadastrar produto" de acordo com o resultado
  real (não mais um lookup local).
- **FR-004**: O sistema DEVE permitir cadastrar produto novo via API,
  exigindo sessão autenticada, e comunicar claramente o status
  "pendente de aprovação" e os pontos ganhos.
- **FR-005**: O sistema DEVE permitir reportar preço de um produto num
  mercado via API, exigindo sessão autenticada, com a lista de mercados
  vinda da API (com opção de cadastrar mercado novo por nome).
- **FR-006**: O sistema DEVE permitir confirmar que um preço ativo ainda
  está correto via API, exigindo sessão autenticada, refletindo o novo
  total de confirmações sem recarregar a página.
- **FR-007**: O sistema DEVE exibir estatísticas, nível/progresso e
  posição no ranking da própria pessoa a partir da API real em `/profile`.
- **FR-008**: O sistema DEVE exibir o feed de contribuições recentes da
  própria pessoa a partir da API real, paginado.
- **FR-009**: O sistema DEVE exibir o ranking público de contribuidores
  (leaderboard) a partir da API real na home.
- **FR-010**: Todo envio de dado para a API (reportar preço, cadastrar
  produto, cadastrar mercado) DEVE ser validado no cliente com Zod antes
  do envio, com mensagens de erro claras, refletindo as mesmas regras já
  aplicadas no backend.
- **FR-011**: Toda chamada autenticada à API DEVE enviar o token de
  sessão do Supabase como Bearer (mecanismo já existente em
  `src/lib/api/client.ts`); nenhuma tela nova deve duplicar essa lógica.
- **FR-012**: O sistema DEVE tratar de forma visível (sem crash) os
  estados de carregamento, vazio e erro de cada chamada à API em todas
  as telas afetadas.
- **FR-013**: O sistema DEVE remover o uso de `src/lib/mock/catalog.ts` e
  `src/lib/mock/community.ts` como fonte de dados de produto/preço/
  mercado/ranking nas telas de produção (dados estáticos de copy/textos
  institucionais, como colunas do rodapé, podem permanecer locais).
- **FR-014**: Toda tela do catálogo (home, busca, detalhe de produto,
  scan, cadastrar produto, confirmar preço, perfil) DEVE ser utilizável
  sem rolagem horizontal e sem sobreposição de conteúdo em qualquer
  largura de viewport entre 320px e 1920px.
- **FR-015**: O projeto DEVE ter testes automatizados cobrindo: (a)
  unidade das funções puras de validação/formatação/mapeamento de dados
  da API, e (b) end-to-end do caminho feliz de cada User Story P1 (busca
  → ver produto; escanear → reportar preço / cadastrar produto).

### Key Entities *(include if feature involves data)*

- **Produto**: EAN, nome, marca, quantidade, categoria, status de
  aprovação; pertence a um catálogo público só quando aprovado.
- **Oferta**: preço de um Produto observado em um Mercado por uma
  pessoa, com data e número de confirmações da comunidade.
- **Mercado**: estabelecimento físico onde ofertas são observadas;
  catálogo aberto (qualquer pessoa autenticada pode cadastrar).
- **Perfil**: pontos, nível, posição no ranking e histórico de
  contribuições (preços reportados, produtos criados, confirmações
  dadas) de uma pessoa autenticada.
- **Ranking**: lista pública ordenada dos principais contribuidores por
  pontos/contribuições.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das telas de catálogo (home, busca, detalhe, scan,
  cadastrar produto, confirmar preço, perfil) exibem dados vindos da API
  real — zero referências a dados de produto/preço/mercado/ranking
  fixos no código de produção.
- **SC-002**: Uma pessoa consegue ir de "escanear um código" a "ver os
  pontos ganhos por reportar o preço" em uma sessão contínua, sem erro
  não tratado, em pelo menos 95% das tentativas em ambiente de teste.
- **SC-003**: Todas as telas afetadas permanecem sem rolagem horizontal
  e sem sobreposição de texto/botão em larguras de 320px, 375px, 768px,
  1024px e 1440px+.
- **SC-004**: Ao menos um teste end-to-end automatizado cobre cada User
  Story P1 do caminho feliz, executável localmente e em CI sem
  intervenção manual.
- **SC-005**: Uma falha de rede/API em qualquer tela afetada resulta em
  mensagem de erro visível e ação de "tentar novamente", nunca em tela
  branca ou exceção não tratada no console.

## Assumptions

- O backend (`poupe-certo-back`) já expõe e mantém estáveis os contratos
  hoje existentes em `products`, `markets`, `price-reports`, `leaderboard`
  e `users` — esta feature consome, não altera, a API.
- Autenticação (login com Google via Supabase) já está pronta (feature
  001) e fora de escopo; esta feature assume sempre um Bearer token
  válido disponível quando a pessoa está autenticada.
- "Perto de você" na home usa apenas o filtro de localização já
  persistido no cliente (`location-store`); geolocalização por
  distância real do dispositivo não está no contrato atual da API e
  fica fora de escopo.
- Moderação (fila de aprovação, decisões de operador) é tela/fluxo de
  outra persona (operador) e não faz parte desta feature — a API já a
  expõe, mas o consumo por esta feature é só o efeito (produto/preço
  aparece como pendente).
- "Testes de ponta a ponta" e "testes unitários" seguem a pirâmide do
  workspace (`.claude/skills/testing/SKILL.md`): unitário para lógica
  pura, e2e (Playwright) para o caminho feliz das User Stories P1 — sem
  perseguir 100% de cobertura.
- Responsividade cobre da menor largura comum de celular (320px) até
  telas grandes de desktop (1920px), mobile-first, reaproveitando os
  breakpoints Tailwind já usados no projeto.
