# Feature Specification: Login só com Google

**Feature Branch**: `001-login-google`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Trocar login e cadastro por e-mail/senha (Better Auth) por um unico botao Continuar com Google via Supabase Auth, enviando o token da sessao para a API"

**Relacionada**: `poupe-certo-back/specs/001-login-social-com/spec.md` (mesmas user stories, lado do servidor).

## Clarifications

### Session 2026-09-26

- Q: Mantém cadastro/login por e-mail e senha junto do Google? → A: Não — só Google, um botão para entrar e prosseguir (decisão do usuário).
- Q: Exclusão de conta entra agora? → A: Não — débito conhecido, herdado da spec do backend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar com Google (Priority: P1)

A pessoa abre uma área que exige conta (perfil, escanear preço, cadastrar produto, confirmar preço) ou a tela de login, vê um único botão "Continuar com Google", autoriza e volta exatamente para onde estava, já autenticada, com nome e foto do Google no cabeçalho/perfil.

**Why this priority**: É a única porta de entrada — sem isso nenhuma área protegida funciona.

**Independent Test**: Sem sessão, abrir `/profile` → cai no login → "Continuar com Google" → autoriza → volta para `/profile` mostrando o nome da conta Google.

**Acceptance Scenarios**:

1. **Given** pessoa sem sessão, **When** abre `/scan`, **Then** vai para `/login?next=/scan`, e após autorizar no Google volta para `/scan` autenticada.
2. **Given** pessoa já autenticada, **When** recarrega a página ou volta outro dia (sessão ainda válida), **Then** continua autenticada sem novo login.
3. **Given** pessoa na tela de Google, **When** cancela a autorização, **Then** volta à tela de login com aviso de que o login não foi concluído.

---

### User Story 2 - Sair (Priority: P2)

Pessoa autenticada clica em "Sair" no perfil e volta ao estado não autenticado.

**Independent Test**: Com sessão, clicar "Sair" → é levada ao login; abrir `/profile` de novo exige login.

**Acceptance Scenarios**:

1. **Given** pessoa autenticada, **When** clica "Sair", **Then** a sessão é encerrada e áreas protegidas voltam a exigir login.

---

### Edge Cases

- Link antigo para `/signup` (rodapé, favoritos) leva ao login — não existe mais cadastro separado.
- Parâmetro `next` apontando para outro domínio (`next=https://evil.com` ou `//evil.com`) é ignorado — sempre volta para rota interna (evita open redirect).
- Sessão expirada em meio ao uso: a próxima ação protegida pede login de novo, sem travar a tela.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de login DEVE oferecer apenas o botão "Continuar com Google" — sem campos de e-mail/senha e sem link de cadastro.
- **FR-002**: Após autorizar, a pessoa DEVE voltar para a rota interna de onde saiu (`next`), ou para o perfil se não houver.
- **FR-003**: O sistema DEVE aceitar em `next` somente caminhos internos (começando com `/` e não com `//`).
- **FR-004**: Cabeçalho e perfil DEVEM exibir nome e foto (quando houver) vindos da conta Google.
- **FR-005**: Toda chamada à API da plataforma DEVE carregar a credencial da sessão atual, para o backend identificar a pessoa.
- **FR-006**: "Sair" DEVE encerrar a sessão e levar para o login.
- **FR-007**: A rota `/signup` DEVE deixar de existir como tela e redirecionar para o login.

### Key Entities

- **Sessão**: estado autenticado da pessoa no navegador — nome, e-mail, foto, credencial enviada à API.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pessoa nova vai do clique em "Continuar com Google" à tela de destino em menos de 15 segundos.
- **SC-002**: 100% das áreas protegidas redirecionam para o login quando não há sessão.
- **SC-003**: Zero formulários de senha restantes na interface.

## Assumptions

- Provider Google habilitado no Supabase Dashboard com as URLs de redirect do front (local e produção) — passo manual.
- Sessão fica no navegador (armazenamento do cliente de auth); não há renderização no servidor que dependa da sessão nesta fase.
