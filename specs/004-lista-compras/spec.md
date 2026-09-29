# Feature Specification: Minha Lista (lista de compras pessoal)

**Feature Branch**: `004-lista-compras`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Minha Lista — lista de compras pessoal. Usuário logado adiciona um produto à lista a partir da página de detalhe do produto (substitui o botão "Adicionar à lista" que hoje só mostra um toast, sem persistir nada, e substitui também o botão de coração/favoritar que é um stub local sem persistência — os dois somem, viram este único conceito). Cada item da lista guarda um snapshot do melhor preço e mercado do produto no momento em que foi adicionado (não atualiza dinamicamente depois). Um usuário só pode ter um item por produto na lista — adicionar de novo o mesmo produto não duplica. Na tela "Minha Lista" (nova rota, com entrada de navegação na mobile-action-bar e no site-header, ao lado de Início/Escanear/Perfil), cada item pode ser marcado como comprado (checkbox, risca visualmente mas continua na lista) e removido (exclusão definitiva do item). É dado de usuário autenticado — precisa RLS own-row (auth.uid() = user_id), seguindo o mesmo padrão asUser/asPublic já usado em price-reports e profiles. Sem funcionalidade de compartilhar lista, sem quantidade por item, sem notificação de mudança de preço — fora de escopo por ora."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adicionar produto à lista (Priority: P1)

Uma pessoa logada está vendo o preço de um produto e decide que quer comprá-lo. Ela adiciona o produto à sua lista de compras diretamente da página do produto, sem sair dela, guardando o melhor preço e mercado vistos naquele momento.

**Why this priority**: É a porta de entrada da feature — sem conseguir adicionar um item, não existe lista para gerenciar depois.

**Independent Test**: Pode ser testado abrindo a página de um produto, clicando em "Adicionar à lista" e confirmando que o item aparece na tela "Minha Lista" com o preço/mercado do momento.

**Acceptance Scenarios**:

1. **Given** uma pessoa logada na página de um produto com oferta ativa, **When** ela clica em "Adicionar à lista", **Then** o produto passa a aparecer em "Minha Lista" com o preço e mercado exibidos na página no momento do clique.
2. **Given** um produto que já está na lista da pessoa, **When** ela clica em "Adicionar à lista" novamente para o mesmo produto, **Then** nenhum item duplicado é criado — o botão reflete que o produto já está na lista.
3. **Given** uma pessoa não logada na página de um produto, **When** ela vê o botão "Adicionar à lista", **Then** clicar leva ao fluxo de login (mesmo padrão já usado por outras ações que exigem conta).

---

### User Story 2 - Marcar item como comprado (Priority: P2)

Uma pessoa está no mercado com sua lista aberta e, conforme coloca cada produto no carrinho, marca o item correspondente como comprado para acompanhar o que falta.

**Why this priority**: É o uso corrente da lista — sem isso a tela vira uma lista estática sem utilidade prática durante a compra.

**Independent Test**: Pode ser testado abrindo "Minha Lista" com pelo menos um item, marcando seu checkbox e confirmando que o item aparece riscado mas continua na lista.

**Acceptance Scenarios**:

1. **Given** um item pendente em "Minha Lista", **When** a pessoa marca seu checkbox, **Then** o item passa a aparecer riscado/marcado como comprado e continua visível na lista.
2. **Given** um item já marcado como comprado, **When** a pessoa desmarca o checkbox, **Then** o item volta ao estado pendente.

---

### User Story 3 - Remover item da lista (Priority: P3)

Uma pessoa decide que não quer mais aquele produto na lista (já comprou em outro lugar, mudou de ideia, ou só quer limpar itens já comprados) e o remove definitivamente.

**Why this priority**: Importante para manter a lista útil ao longo do tempo, mas a lista já entrega valor com adicionar (P1) e marcar comprado (P2) mesmo sem remoção no primeiro uso.

**Independent Test**: Pode ser testado abrindo "Minha Lista" com pelo menos um item, removendo-o e confirmando que ele não aparece mais na lista nem retorna após atualizar a página.

**Acceptance Scenarios**:

1. **Given** um item em "Minha Lista" (comprado ou pendente), **When** a pessoa remove o item, **Then** ele desaparece imediatamente da lista e não retorna ao recarregar a página.

---

### Edge Cases

- O que acontece quando a pessoa abre "Minha Lista" e nunca adicionou nenhum item? Mostrar estado vazio convidando a escanear/buscar um produto.
- O que acontece se o produto de um item da lista deixar de ter oferta ativa depois de adicionado (ex.: preço expirou)? O item continua na lista com o snapshot salvo — a lista não depende da oferta continuar existindo.
- O que acontece se duas abas/dispositivos da mesma conta adicionarem o mesmo produto quase ao mesmo tempo? Resultado final é um único item (sem duplicar), sem erro visível para a pessoa.
- O que acontece ao tentar marcar como comprado ou remover um item que não pertence à pessoa logada (ex.: id de outra conta)? A ação é negada e o item não é alterado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que uma pessoa autenticada adicione um produto à sua lista de compras a partir da página de detalhe do produto.
- **FR-002**: Ao adicionar um item, o sistema MUST guardar um snapshot do melhor preço, mercado e data/hora vistos naquele momento — esse snapshot MUST NOT ser atualizado automaticamente depois, mesmo que o preço mude.
- **FR-003**: O sistema MUST impedir mais de um item por produto por pessoa — adicionar um produto já presente na lista não cria duplicata nem duplica o snapshot.
- **FR-004**: O sistema MUST fornecer uma tela dedicada ("Minha Lista") listando todos os itens da pessoa logada, com atalho de navegação acessível a partir de qualquer página autenticada.
- **FR-005**: O sistema MUST permitir marcar e desmarcar cada item da lista como comprado, sem removê-lo.
- **FR-006**: O sistema MUST permitir remover definitivamente um item da lista.
- **FR-007**: O sistema MUST garantir que uma pessoa só veja, altere ou remova os itens da própria lista — itens de outras contas nunca são visíveis nem alteráveis.
- **FR-008**: O sistema MUST substituir o botão de favoritar (coração) hoje existente na página do produto pelo botão de adicionar/já-está-na-lista, evitando dois conceitos concorrentes de "guardar produto".
- **FR-009**: O sistema MUST refletir no botão da página do produto se aquele produto já está na lista da pessoa logada.

### Key Entities *(include if feature involves data)*

- **Item de lista**: pertence a uma pessoa e a um produto; guarda o snapshot do preço, do mercado e da data em que foi adicionado, mais o estado comprado/pendente e a data de criação. Um item por combinação pessoa+produto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa consegue adicionar um produto à lista a partir da página do produto em no máximo 1 clique/toque.
- **SC-002**: Itens adicionados à lista continuam visíveis e com o mesmo preço/mercado salvos mesmo depois de o preço do produto mudar no catálogo.
- **SC-003**: Marcar/desmarcar um item como comprado ou removê-lo se reflete na tela em menos de 1 segundo, sem precisar recarregar a página.
- **SC-004**: 100% das tentativas de acessar ou alterar item de lista de outra conta são bloqueadas.

## Assumptions

- A lista é individual por conta — não existe lista compartilhada ou colaborativa nesta versão.
- Cada item tem quantidade implícita de 1 — não há campo de quantidade nesta versão.
- Não há notificação/alerta quando o preço do produto muda depois de adicionado à lista.
- Pessoas não autenticadas não têm lista — o botão de adicionar exige login, reaproveitando o fluxo de autenticação já existente no produto (mesmo padrão de "Sim, está correto" e "Registrar preço").
- Itens sem limite de quantidade total por lista nesta versão.
