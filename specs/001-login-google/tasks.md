# Tasks: Login só com Google

**Input**: Design documents from `/specs/001-login-google/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: não solicitados — fase `/test` do workspace.

## Phase 1: Setup

- [X] T001 Instalar `@supabase/supabase-js` e remover `better-auth` em `package.json`
- [X] T002 [P] Atualizar `.env.example` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (sem mencionar Better Auth)

## Phase 2: Foundational

- [X] T003 Criar client browser PKCE em `src/lib/supabase.ts` per `research.md#1`
- [X] T004 Criar `src/lib/auth.ts` com `signInWithGoogle(next)`, `signOut()`, `safeNextPath(raw)`, `getDisplayUser(session)` per `research.md#4`
- [X] T005 Criar `src/hooks/use-session.ts` (useSyncExternalStore + onAuthStateChange) per `research.md#2`
- [X] T006 [P] Interceptor Bearer e remoção de `withCredentials` em `src/lib/api/client.ts` per `research.md#3`
- [X] T007 Remover `src/lib/auth-client.ts` e `src/lib/validations/auth.ts`

## Phase 3: User Story 1 - Entrar com Google (P1) 🎯 MVP

**Independent Test**: `quickstart.md` passos 1–6 e 8.

- [X] T008 [US1] Reescrever `src/app/login/login-form.tsx` com botão único "Continuar com Google", aviso de erro via `?error`, e redirect imediato se já houver sessão
- [X] T009 [US1] Criar `src/app/auth/callback/page.tsx` + `callback-view.tsx` (Suspense; espera sessão; `router.replace(safeNextPath(next))` ou volta ao login com erro)
- [X] T010 [US1] Atualizar `src/hooks/use-require-auth.ts` para o `useSession` novo
- [X] T011 [P] [US1] Atualizar `src/components/site-header.tsx` (iniciais + foto via `getDisplayUser`)
- [X] T012 [P] [US1] Atualizar `src/app/(shell)/profile/page.tsx` (nome/e-mail/foto via `getDisplayUser`)
- [X] T013 [US1] Remover `src/app/signup/` e adicionar redirect `/signup` → `/login` em `next.config.ts`
- [X] T014 [P] [US1] Remover link "Criar conta" de `src/components/site-footer.tsx`

## Phase 4: User Story 2 - Sair (P2)

- [X] T015 [US2] `src/components/sign-out-button.tsx` usa `signOut` de `src/lib/auth.ts`

## Phase 5: Polish

- [X] T016 `npm run lint` e `npm run build` sem erro; grep sem resquício de `better-auth`
- [ ] T017 Rodar `quickstart.md` ponta a ponta (depende do provider Google configurado e do back no ar)

## Dependencies

Setup → Foundational (T003 antes de T004/T005/T006) → US1 → US2 → Polish. US2 depende só de T004.
