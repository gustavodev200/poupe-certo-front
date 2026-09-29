# Feature Specification: Meus produtos + navegação lateral

**Feature Branch**: `006-meus-produtos-sidebar`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Meus produtos + sidebar de navegação. (1) Nova página "Meus produtos" (/my-products) onde a pessoa logada vê os produtos que ela cadastrou, agrupados por status: Pendentes (aguardando aprovação do admin), Aprovados e Rejeitados — sem motivo de rejeição (só o status). Aprovado leva para a página do produto. Backend precisa de GET /users/me/products (filtro opcional por status, paginado) lido via asUser (RLS products_select_own já existe). (2) Sidebar de navegação para o app (shell) — desktop: trilho colapsável à esquerda com Início, Buscar, Escanear, Minha Lista, Meus produtos (com contador de pendentes), Perfil e Admin (só para operador); mobile: gaveta aberta por botão de menu no header, barra inferior atual mantida. Reaproveitar/extrair o padrão já existente do AdminSidebar. Header fica mais enxuto (cidade, busca, categorias). Minha Lista (/list, feature 004) já existe — só ganha destaque na sidebar. Tudo responsivo 320–1920px. Frontend no repo poupe-certo-front, endpoint no poupe-certo-back."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acompanhar produtos que cadastrei (Priority: P1)

Uma pessoa cadastrou um produto novo (escaneou um código de barras que ainda não existia no catálogo). O produto fica aguardando aprovação de um admin antes de aparecer para todo mundo. Hoje ela não tem como saber se o produto foi aprovado, recusado ou ainda está na fila. Ela abre "Meus produtos" e vê cada produto que cadastrou com seu status atual.

**Why this priority**: É a necessidade principal pedida — dar retorno a quem contribui. Sem isso a pessoa cadastra "no escuro" e não volta a contribuir.

**Independent Test**: Cadastrar um produto novo, abrir "Meus produtos" e ver o produto na aba "Pendentes"; após um admin aprovar/rejeitar, o produto aparece na aba correspondente.

**Acceptance Scenarios**:

1. **Given** uma pessoa logada que cadastrou produtos com status variados, **When** ela abre "Meus produtos", **Then** vê os produtos separados em Pendentes, Aprovados e Rejeitados, cada um com foto (se houver), nome, marca, quantidade, código de barras e data de envio.
2. **Given** a aba "Aprovados", **When** a pessoa toca num produto, **Then** vai para a página pública daquele produto.
3. **Given** um produto pendente ou rejeitado, **When** a pessoa o vê na lista, **Then** ele é exibido apenas como informação (sem link para página pública, que não existe para ele).
4. **Given** uma pessoa que nunca cadastrou produto, **When** abre "Meus produtos", **Then** vê um estado vazio explicando como cadastrar (escanear um código que ainda não existe) com atalho para escanear.
5. **Given** uma pessoa com mais produtos em uma aba do que cabem numa página, **When** chega ao fim da lista, **Then** consegue carregar os próximos.
6. **Given** uma pessoa não logada, **When** tenta abrir "Meus produtos", **Then** é levada ao login e volta para "Meus produtos" depois.

---

### User Story 2 - Navegar pelo app por um menu lateral (Priority: P2)

O app está ganhando várias áreas (Início, Buscar, Escanear, Minha Lista, Meus produtos, Perfil, e Admin para operadores). Uma pessoa quer achar qualquer uma delas rapidamente, em qualquer tamanho de tela, sem depender de ícones soltos no topo.

**Why this priority**: Necessário para que "Meus produtos" (e futuras áreas) sejam encontráveis, mas o conteúdo de P1 já entrega valor acessado por link direto.

**Independent Test**: Em desktop, ver o menu lateral fixo com todos os itens, recolher/expandir e navegar; em celular, abrir o menu pelo botão no topo, tocar num item e ver o menu fechar e a página mudar.

**Acceptance Scenarios**:

1. **Given** uma tela larga (desktop/tablet horizontal), **When** a pessoa abre qualquer página do app, **Then** vê um menu lateral com Início, Buscar, Escanear, Minha Lista, Meus produtos e Perfil, com o item da página atual destacado.
2. **Given** o menu lateral expandido em tela larga, **When** a pessoa o recolhe, **Then** ele passa a mostrar só ícones (com o nome ao passar o mouse) e a escolha é lembrada ao voltar ao app.
3. **Given** uma tela estreita (celular), **When** a pessoa toca no botão de menu no topo, **Then** o menu abre como gaveta sobre a página; tocar num item navega e fecha a gaveta; tocar fora ou no X fecha sem navegar.
4. **Given** uma pessoa operadora (admin), **When** vê o menu, **Then** também aparece o item "Admin"; para quem não é operador esse item não aparece.
5. **Given** uma pessoa logada com produtos pendentes, **When** vê o menu, **Then** o item "Meus produtos" mostra quantos estão pendentes; sem pendentes, nenhum contador aparece.
6. **Given** uma pessoa não logada, **When** vê o menu, **Then** os itens que exigem conta levam ao login ao serem usados (mesmo comportamento atual dessas páginas), sem contador e sem item Admin.
7. **Given** um celular, **When** a pessoa usa o app, **Then** a barra inferior atual (Início, Minha Lista, Escanear, Perfil) continua disponível.

---

### User Story 3 - Topo mais enxuto (Priority: P3)

Com a navegação indo para o menu lateral, o topo do app fica focado no que é de cada página: cidade escolhida, busca e categorias.

**Why this priority**: Ajuste visual consequente da P2; sem ele nada quebra, apenas há duplicação de atalhos.

**Independent Test**: Verificar que o topo mostra cidade, busca, categorias, alternância de tema e avatar, e que os atalhos duplicados de navegação saíram do topo em telas largas.

**Acceptance Scenarios**:

1. **Given** qualquer página do app em tela larga, **When** a pessoa olha o topo, **Then** vê cidade, busca, categorias, alternância de tema e avatar — sem os atalhos de navegação que já estão no menu lateral.
2. **Given** qualquer largura entre 320px e 1920px, **When** a página é exibida, **Then** não há rolagem horizontal nem elementos sobrepostos no topo, menu ou "Meus produtos".

---

### Edge Cases

- Nome de produto muito longo: truncado sem quebrar o layout do card.
- Produto sem foto: mostra um marcador visual neutro no lugar da imagem.
- Falha ao carregar "Meus produtos": mensagem de erro com opção de tentar de novo, sem perder a aba escolhida.
- Falha ao carregar o contador de pendentes: o menu continua funcionando, apenas sem contador.
- Produto aprovado/rejeitado por um admin enquanto a pessoa está com a página aberta: o novo status aparece ao recarregar ou voltar à página (sem tempo real).
- Pessoa tenta ver produtos de outra conta: impossível — a consulta só devolve produtos da própria pessoa logada.
- Muitos pendentes: contador mostra no máximo "99+".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer uma página "Meus produtos" acessível só por pessoas logadas, listando os produtos que a própria pessoa cadastrou.
- **FR-002**: A página MUST separar os produtos por status — Pendentes, Aprovados, Rejeitados — com a aba Pendentes selecionada por padrão, e cada aba mostrando a quantidade de itens.
- **FR-003**: Cada produto MUST exibir foto (quando houver), nome, marca, quantidade, código de barras e data de envio; produtos da mesma aba ordenados do mais recente para o mais antigo.
- **FR-004**: Produtos aprovados MUST levar à página pública do produto; pendentes e rejeitados MUST NOT ter link para página pública.
- **FR-005**: A lista de cada aba MUST ser paginada, permitindo carregar mais itens sob demanda.
- **FR-006**: O sistema MUST garantir, no servidor, que a pessoa só receba os próprios produtos, independente do que o navegador envie.
- **FR-007**: O filtro de status recebido pelo servidor MUST ser validado; valores inválidos são recusados.
- **FR-008**: O app MUST ter um menu de navegação lateral em todas as páginas da área principal com: Início, Buscar, Escanear, Minha Lista, Meus produtos, Perfil — e Admin somente para operadores.
- **FR-009**: Em telas largas, o menu MUST ficar fixo à esquerda e poder ser recolhido para modo só-ícones; a preferência MUST persistir entre visitas no mesmo navegador.
- **FR-010**: Em telas estreitas, o menu MUST abrir como gaveta a partir de um botão no topo e fechar ao navegar, ao tocar fora ou no botão de fechar.
- **FR-011**: O item da página atual MUST aparecer destacado no menu.
- **FR-012**: O item "Meus produtos" MUST mostrar a quantidade de produtos pendentes da pessoa logada quando maior que zero (limitado a "99+").
- **FR-013**: O sistema MUST informar ao app se a pessoa logada é operadora, para decidir a exibição do item Admin; a proteção real da área Admin continua no servidor.
- **FR-014**: A barra inferior atual em telas estreitas MUST ser mantida sem mudanças.
- **FR-015**: O topo MUST deixar de repetir atalhos de navegação presentes no menu lateral (Minha Lista), mantendo cidade, busca, categorias, tema e avatar; o botão principal "Escanear preço" pode continuar no topo como ação de destaque.
- **FR-016**: O painel Admin MUST continuar funcionando com seu próprio menu, compartilhando o mesmo comportamento visual (recolher em telas largas, gaveta em estreitas).
- **FR-017**: Todas as telas afetadas MUST funcionar sem rolagem horizontal entre 320px e 1920px de largura.

### Key Entities *(include if feature involves data)*

- **Produto cadastrado pela pessoa**: produto do catálogo cujo criador é a pessoa logada; atributos exibidos — código de barras, nome, marca, quantidade, categoria, foto, status (pendente/aprovado/rejeitado), data de envio, data de revisão (quando revisado).
- **Perfil**: passa a expor à própria pessoa se ela é operadora (somente leitura).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa que cadastrou um produto encontra o status dele em até 2 toques/cliques a partir de qualquer página do app.
- **SC-002**: 100% das consultas de "Meus produtos" devolvem apenas produtos da própria pessoa (verificado por teste com duas contas).
- **SC-003**: Todas as áreas do app (7 itens incluindo Admin para operador) ficam acessíveis pelo menu em qualquer largura entre 320px e 1920px, sem rolagem horizontal.
- **SC-004**: A página "Meus produtos" mostra o conteúdo inicial em menos de 2 segundos numa conexão móvel comum.
- **SC-005**: Nenhum fluxo existente (busca, escanear, página de produto, Minha Lista, perfil, admin) deixa de funcionar — suíte automatizada existente continua verde.

## Assumptions

- Motivo de rejeição fica fora de escopo (decisão do usuário: mostrar apenas o status). Pode virar feature futura.
- Sem notificação ativa (e-mail/push) quando o status muda — a pessoa consulta a página.
- Não é possível editar ou excluir um produto enviado a partir de "Meus produtos" nesta versão.
- A área Admin continua com layout próprio (sem o menu do app), apenas reaproveitando o mesmo componente de menu.
- A preferência de menu recolhido é por navegador (local), não sincronizada entre dispositivos.
- Visitantes não logados continuam podendo navegar nas páginas públicas; o menu aparece para eles também.
- Reaproveita a regra de acesso já existente no banco que permite a cada pessoa ler os próprios produtos, inclusive pendentes/rejeitados.
