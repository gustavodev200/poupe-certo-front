# Feature Specification: Preenchimento automático de produto pelo EAN

**Feature Branch**: `005-preenchimento-ean` (nos dois repos: `poupe-certo-front` e `poupe-certo-back`)

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Ao escanear o EAN ou digitar manualmente, buscar na API de EANs (Open Food Facts) para preencher as informações do produto. Tratar a requisição para não fazer várias, sempre bloquear com segurança. Se a API trouxer imagens, salvar as imagens no Cloudinary."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastro de produto já vem preenchido (Priority: P1)

Uma pessoa logada escaneia (ou digita) o código de barras de um produto que ainda
não existe no Poupe Certo. Ao cair na tela "Cadastrar produto", nome, marca,
quantidade e — quando dá pra inferir — categoria já vêm preenchidos com dados de
uma base pública de produtos. Ela só confere, escolhe o mercado, digita o preço e envia.

**Why this priority**: É o objetivo principal do pedido — reduz digitação no
celular dentro do mercado e aumenta a qualidade/uniformidade dos nomes cadastrados.

**Independent Test**: Escanear um EAN real conhecido na base pública (ex.:
7891000100103, Leite Condensado Moça) que não esteja cadastrado; a tela de
cadastro mostra os campos preenchidos e editáveis.

**Acceptance Scenarios**:

1. **Given** EAN inexistente no Poupe Certo e presente na base pública, **When** a pessoa abre o cadastro, **Then** nome, marca e quantidade aparecem preenchidos e continuam editáveis.
2. **Given** EAN inexistente nas duas bases, **When** a pessoa abre o cadastro, **Then** o formulário aparece vazio, sem erro bloqueante, com aviso discreto de que não achamos dados.
3. **Given** a base pública está fora do ar ou lenta, **When** a pessoa abre o cadastro, **Then** em no máximo alguns segundos o formulário fica disponível vazio para preenchimento manual.
4. **Given** a pessoa já começou a digitar em um campo, **When** os dados sugeridos chegam, **Then** o que ela digitou não é sobrescrito.

---

### User Story 2 - Foto do produto salva e exibida (Priority: P2)

Quando a base pública tem foto do produto, a pessoa vê uma prévia da foto no
cadastro; ao enviar, o Poupe Certo guarda uma cópia própria dessa foto e ela passa
a aparecer na página do produto.

**Why this priority**: Foto ajuda a reconhecer o produto na prateleira, mas o
cadastro funciona sem ela.

**Independent Test**: Cadastrar um produto cujo EAN tem foto na base pública,
aprovar via moderação e abrir a página do produto — a foto aparece, servida pelo
armazenamento próprio do Poupe Certo (não pelo site da base pública).

**Acceptance Scenarios**:

1. **Given** EAN com foto na base pública, **When** a pessoa abre o cadastro, **Then** vê a prévia da foto.
2. **Given** EAN com foto, **When** o produto é cadastrado, **Then** a foto fica guardada no armazenamento de imagens do Poupe Certo e vinculada ao produto.
3. **Given** o armazenamento de imagens falha, **When** o produto é cadastrado, **Then** o cadastro conclui normalmente, só sem foto.
4. **Given** produto aprovado com foto, **When** alguém abre a página do produto, **Then** a foto aparece; sem foto, a página continua como hoje.

---

### Edge Cases

- Mesma pessoa (ou várias) consultando o mesmo EAN repetidamente/simultaneamente: só uma consulta real à base pública por EAN dentro da janela de cache; demais reaproveitam o resultado.
- Pessoa disparando consultas em massa para EANs diferentes: limitada por taxa por pessoa; ao estourar, formulário cai no modo manual.
- EAN com formato inválido: rejeitado antes de qualquer consulta externa.
- Resposta da base pública em formato inesperado, campos gigantes ou vazios: tratada como "não encontrado" ou campos truncados/ignorados; nunca quebra a tela.
- Categoria da base pública sem correspondência nas categorias do Poupe Certo: categoria fica vazia para a pessoa escolher.
- Link de foto apontando para fora da base pública: ignorado (só se aceita foto vinda do domínio de imagens da base pública).
- Mesmo EAN cadastrado duas vezes (conflito): a foto não é duplicada no armazenamento.
- Tentativa de enviar link de foto arbitrário no cadastro: ignorado pelo servidor.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer, a pessoas logadas, a consulta de dados sugeridos de um produto a partir do EAN (nome, marca, quantidade, categoria sugerida, foto).
- **FR-002**: A consulta à base pública MUST ser feita pelo servidor do Poupe Certo, nunca diretamente pelo navegador.
- **FR-003**: O sistema MUST validar o EAN (8 a 14 dígitos) antes de qualquer consulta externa.
- **FR-004**: O sistema MUST reaproveitar resultados recentes (encontrados e não encontrados) por um período, sem consultar de novo a base pública.
- **FR-005**: Consultas simultâneas ao mesmo EAN MUST resultar em uma única consulta externa.
- **FR-006**: A consulta externa MUST ter tempo máximo de espera; ao estourar, o resultado é "indisponível" e o cadastro segue manual.
- **FR-007**: O sistema MUST limitar o número de consultas por pessoa por minuto.
- **FR-008**: O sistema MUST validar e sanitizar a resposta externa (tamanho dos textos, formato, domínio da foto) antes de repassá-la.
- **FR-009**: O formulário de cadastro MUST aplicar os dados sugeridos só em campos que a pessoa ainda não editou, e todos continuam editáveis.
- **FR-010**: O formulário MUST exibir prévia da foto quando houver.
- **FR-011**: Ao cadastrar o produto, o servidor MUST obter a foto a partir do próprio EAN (não de dado enviado pelo navegador) e guardá-la no armazenamento de imagens do Poupe Certo, de forma idempotente por EAN.
- **FR-012**: O servidor MUST ignorar qualquer link de foto enviado pelo navegador no cadastro.
- **FR-013**: Falha na base pública ou no armazenamento de imagens MUST NOT impedir o cadastro.
- **FR-014**: As credenciais do armazenamento de imagens MUST existir só no servidor, em variáveis de ambiente, nunca no repositório nem no navegador.
- **FR-015**: A página do produto MUST exibir a foto quando existir.
- **FR-016**: A página de scan não muda de comportamento: produto conhecido → confirmar preço; desconhecido → cadastro (agora pré-preenchido).

### Key Entities

- **Sugestão de produto (transitória)**: dados vindos da base pública para um EAN — nome, marca, quantidade, categoria sugerida, link da foto de origem. Não é persistida no banco; vive só no cache do servidor.
- **Produto (existente)**: ganha a foto guardada no armazenamento próprio (campo de foto já existente, antes nunca preenchido).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Para EANs presentes na base pública, a pessoa chega ao formulário com nome, marca e quantidade preenchidos em até 3 segundos.
- **SC-002**: Com a base pública fora do ar, o formulário fica utilizável para preenchimento manual em até 6 segundos.
- **SC-003**: 20 consultas ao mesmo EAN no intervalo do cache geram no máximo 1 consulta externa.
- **SC-004**: 100% dos produtos cadastrados com foto disponível na base pública ficam com foto própria (salvo falha do armazenamento, que não bloqueia).
- **SC-005**: Nenhuma credencial do armazenamento de imagens aparece no código versionado nem no pacote entregue ao navegador.

## Assumptions

- Base pública: Open Food Facts (gratuita, sem chave; exige identificação da aplicação na requisição e pede uso moderado).
- Armazenamento de imagens: Cloudinary (conta já existente do Poupe Certo). O nome da conta ("cloud name") ainda precisa ser informado pela pessoa dona do projeto — as credenciais testadas não correspondem a "poupe-certo".
- Cache em memória do servidor é suficiente (servidor na Vercel pode reiniciar; perder cache só custa uma nova consulta). Sem tabela nova no banco.
- Foto é enviada ao armazenamento só no cadastro, não na consulta — evita encher o armazenamento com EANs que ninguém cadastrou.
- Prévia no formulário usa a foto direto do domínio de imagens da base pública (é só exibição).
- Mapeamento de categoria é heurístico e conservador: sem certeza, fica vazio.
- Lista de busca e cards continuam sem foto nesta versão (só página do produto).
