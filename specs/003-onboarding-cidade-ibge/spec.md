# Feature Specification: Onboarding com Localização Real (IBGE) e Mercados por Cidade

**Feature Branch**: `003-onboarding-cidade-ibge`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Onboarding: trocar lista mock de estados/cidades por dados reais da API pública do IBGE (Localidades — GET /api/v1/localidades/estados e GET /api/v1/localidades/estados/{UF}/municipios), mantendo o layout e design atuais da tela /onboarding (mesmos botões de UF, mesma lista/busca de cidade, mesmo fluxo). Ao confirmar, salvar a cidade/UF escolhida no perfil do usuário (backend, Profile.city/uf via Nest+Prisma), não só em localStorage. A listagem de mercados (GET /markets) deve filtrar pelos mercados da cidade salva do usuário, em vez de mostrar todos os mercados de todas as cidades."

## Clarifications

- Confirmado com o usuário que a API do IBGE (Localidades) é gratuita, pública
  e sem chave de acesso — adequada para uso neste projeto sem custo adicional.
- Confirmado com o usuário para manter o layout atual do onboarding (botões de
  UF + lista/busca de cidade), descartando a alternativa de campo único de CEP
  (ViaCEP), que exigiria redesenhar a tela e não expõe uma listagem de
  municípios por estado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escolher estado e cidade reais no onboarding (Priority: P1) 🎯 MVP

Uma pessoa nova abre `/onboarding`, escolhe seu estado entre os 27 estados
reais do Brasil e, em seguida, escolhe (ou busca) sua cidade entre as cidades
reais daquele estado — não mais uma lista fixa de poucas cidades de exemplo.

**Why this priority**: É a porta de entrada do produto. Hoje a lista de
cidades é mock (poucos estados/cidades fixos), então a maioria das pessoas
reais não encontra sua cidade e não consegue completar o onboarding.

**Independent Test**: Selecionar um estado qualquer (incluindo um pouco usado
em testes, ex. Acre) e confirmar que a lista de cidades exibida corresponde
aos municípios reais daquele estado, com busca funcionando por texto parcial.

**Acceptance Scenarios**:

1. **Given** a tela de onboarding carregada, **When** a pessoa visualiza os
   botões de estado, **Then** os 27 estados (UFs) reais do Brasil são
   exibidos, na mesma disposição visual de hoje (chips horizontais roláveis).
2. **Given** um estado selecionado, **When** a lista de cidades carrega,
   **Then** todas as cidades reais daquele estado ficam disponíveis para
   busca e seleção, na mesma lista vertical de hoje.
3. **Given** a lista de cidades carregada, **When** a pessoa digita parte do
   nome de uma cidade no campo de busca, **Then** a lista filtra para as
   cidades daquele estado cujo nome contém o texto digitado (sem chamada nova
   à API — filtro local sobre as cidades já carregadas do estado).
4. **Given** uma cidade selecionada, **When** a pessoa toca em "Continuar",
   **Then** a cidade/UF escolhida é salva no perfil da pessoa e ela é levada
   para a página inicial.

---

### User Story 2 - Ver apenas mercados da própria cidade (Priority: P1) 🎯 MVP

Depois de concluir o onboarding (ou já tendo uma cidade salva de antes), a
pessoa vê, nas telas que listam mercados (home, confirmação de preço,
cadastro de mercado), somente os mercados localizados na sua própria cidade —
não mercados de outras cidades do país.

**Why this priority**: Preço de mercado é hiperlocal — mostrar mercado de
outra cidade não tem valor e confunde/prejudica a decisão de compra. Sem
esse filtro, a integração de localização do onboarding fica sem efeito
prático no restante do produto.

**Independent Test**: Com uma cidade salva no perfil, abrir uma tela que
lista mercados e confirmar que nenhum mercado de outra cidade aparece;
cadastrar um mercado novo nessa cidade e confirmar que ele aparece na
listagem filtrada.

**Acceptance Scenarios**:

1. **Given** uma pessoa com cidade salva no perfil, **When** ela abre uma
   tela que lista mercados, **Then** somente mercados cuja cidade/UF
   corresponde à cidade/UF salva no perfil aparecem na lista.
2. **Given** uma pessoa com cidade salva, **When** não existe nenhum mercado
   cadastrado ainda na cidade dela, **Then** a tela mostra um estado vazio
   claro (em vez de mercados de outras cidades ou lista quebrada).
3. **Given** uma pessoa sem cidade salva no perfil (ainda não completou o
   onboarding), **When** ela tenta acessar telas que dependem de mercados
   locais, **Then** ela é direcionada para completar o onboarding antes.

---

### User Story 3 - Trocar de cidade depois do onboarding (Priority: P2)

Uma pessoa que já tem cidade salva consegue trocar de cidade a qualquer
momento (o rodapé do onboarding já promete isso: "Você pode trocar de cidade
a qualquer momento no topo do site"), e essa troca atualiza tanto o perfil
salvo quanto a listagem de mercados exibida, sem precisar recarregar a
sessão.

**Why this priority**: Importante para pessoas que se mudam ou compram em
mais de uma cidade, mas não bloqueia o valor central do onboarding (US1) nem
do filtro de mercados (US2) — pode chegar em uma segunda fatia.

**Independent Test**: Com uma cidade já salva, trocar para outra cidade pelo
seletor existente no topo do site e confirmar que a listagem de mercados
passa a refletir a nova cidade imediatamente.

**Acceptance Scenarios**:

1. **Given** uma pessoa com cidade A salva, **When** ela troca para a cidade
   B pelo seletor do topo do site, **Then** o perfil passa a ter a cidade B
   salva e as listagens de mercado passam a mostrar mercados da cidade B.

---

### Edge Cases

- O que acontece se a API do IBGE estiver indisponível ou lenta ao carregar
  estados ou cidades? A tela deve mostrar um estado de carregamento e, em
  caso de falha, uma mensagem de erro com opção de tentar novamente — sem
  quebrar a tela nem travar o botão "Continuar" indefinidamente.
- O que acontece se a pessoa selecionar um estado mas a lista de cidades
  daquele estado vier vazia da API (situação anômala, já que todo estado tem
  municípios)? Mostrar o mesmo estado vazio que já existe hoje para "nenhuma
  cidade encontrada".
- O que acontece com pessoas que já completaram o onboarding antes desta
  mudança (cidade salva apenas em localStorage, mock)? No primeiro acesso
  após a mudança, se o perfil não tiver cidade salva no backend, tratar como
  onboarding incompleto e pedir para escolher a cidade novamente (a lista de
  cidades mock antiga não é uma fonte confiável de nomes reais do IBGE).
- O que acontece se o nome de uma cidade salva anteriormente não corresponder
  exatamente à grafia oficial do IBGE (acentos, abreviações)? Fora de escopo
  corrigir dados antigos automaticamente — trata-se como onboarding
  incompleto (ver ponto anterior), pedindo nova seleção pela lista oficial.
- Uma pessoa digita uma busca de cidade que não corresponde a nenhuma cidade
  do estado selecionado: mantém o mesmo estado vazio "Nenhuma cidade
  encontrada nesse estado" já existente na tela hoje.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir, na tela de onboarding, a lista completa
  dos 27 estados (UFs) do Brasil a partir de uma fonte de dados oficial e
  atualizada, substituindo a lista fixa/mock atual.
- **FR-002**: O sistema DEVE exibir, ao selecionar um estado, a lista
  completa de cidades (municípios) reais daquele estado, a partir de uma
  fonte de dados oficial e atualizada.
- **FR-003**: O sistema DEVE permitir buscar/filtrar a lista de cidades do
  estado selecionado por texto parcial, sem exigir nova consulta à fonte de
  dados para cada tecla digitada.
- **FR-004**: O sistema DEVE preservar o layout, os componentes visuais e o
  fluxo de interação atuais da tela de onboarding (chips de UF, lista de
  cidade com busca, botão "Continuar" desabilitado até uma cidade ser
  escolhida).
- **FR-005**: O sistema DEVE persistir a cidade/UF escolhida no perfil da
  pessoa autenticada, de forma que ela esteja disponível em qualquer sessão
  ou dispositivo em que a pessoa fizer login — não apenas no navegador atual.
- **FR-006**: O sistema DEVE, ao listar mercados em qualquer tela do produto,
  restringir os resultados aos mercados localizados na cidade/UF salva no
  perfil da pessoa autenticada.
- **FR-007**: O sistema DEVE tratar de forma explícita o caso de a pessoa
  autenticada ainda não ter cidade salva no perfil, direcionando-a para
  completar o onboarding antes de ver listagens de mercado dependentes de
  localização.
- **FR-008**: O sistema DEVE permitir que a pessoa troque sua cidade salva
  depois do onboarding inicial, e essa troca DEVE refletir imediatamente nas
  listagens de mercado subsequentes.
- **FR-009**: O sistema DEVE comunicar falha de carregamento de estados ou
  cidades (indisponibilidade da fonte de dados) com uma mensagem clara e
  opção de tentar novamente, sem deixar a tela em estado quebrado ou
  indefinidamente carregando.
- **FR-010**: O sistema DEVE continuar oferecendo o cadastro de um mercado
  novo associado à cidade/UF atual da pessoa (comportamento hoje já existente
  de cadastro de mercado), de forma consistente com o filtro de listagem por
  cidade.

### Key Entities *(include if feature involves data)*

- **Estado (UF)**: Unidade federativa do Brasil; usada como filtro de
  primeiro nível para cidades e para mercados. Identificada por sigla de 2
  letras e nome oficial.
- **Cidade (Município)**: Município real pertencente a um estado; usada como
  a granularidade final de localização da pessoa e dos mercados.
- **Perfil da pessoa**: Já existe hoje; passa a incluir a cidade/UF de
  localização escolhida no onboarding, usada como filtro em listagens de
  mercado.
- **Mercado**: Já existe hoje (nome, endereço, cidade, UF); passa a ser
  filtrado nas listagens pela cidade/UF do perfil da pessoa que está vendo a
  tela, em vez de sempre listar todos os mercados cadastrados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos 27 estados brasileiros ficam selecionáveis no
  onboarding, e cada um exibe corretamente suas cidades reais (validado por
  amostragem em ao menos um estado de cada região do país).
- **SC-002**: Uma pessoa consegue concluir o onboarding (escolher estado,
  buscar e confirmar cidade) em menos de 1 minuto, sem alteração perceptível
  no tempo de resposta da tela em relação ao comportamento atual com dados
  mock.
- **SC-003**: Depois de concluir o onboarding, 100% das listagens de mercado
  vistas pela pessoa mostram apenas mercados da cidade escolhida — nenhum
  mercado de outra cidade aparece nas listagens.
- **SC-004**: Pessoas que completaram o onboarding antes da mudança e voltam
  ao produto são levadas a escolher a cidade novamente a partir da lista
  oficial, sem erros ou telas quebradas.

## Assumptions

- A fonte oficial de estados/cidades é a API pública de Localidades do IBGE
  (gratuita, sem autenticação), conforme confirmado com o usuário — em
  substituição tanto ao mock atual (`CITIES`) quanto à API do ViaCEP
  (descartada por não expor listagem de municípios por estado).
- "Cidade" e "UF" continuam sendo representadas como texto livre (nome da
  cidade + sigla da UF) no perfil e no mercado, mesmo vindo de uma fonte
  estruturada — não é necessário introduzir um identificador numérico de
  município (código IBGE) nesta fase, já que o restante do produto
  (cadastro de mercado, listagens) já usa nome de cidade + UF como texto.
- A comparação de cidade entre perfil e mercado é feita por igualdade de
  nome de cidade + UF; variações de grafia são resolvidas por ambos os
  lados usarem a mesma lista oficial do IBGE como origem dos dados.
- O onboarding continua sendo obrigatório uma única vez por pessoa (não por
  dispositivo), refletindo a mudança de "salvo só no navegador" para "salvo
  no perfil".
- Trocar de cidade pelo seletor do topo do site (já mencionado no texto de
  apoio do onboarding) está dentro do escopo desta feature como User Story 2,
  reaproveitando a mesma persistência no perfil.
