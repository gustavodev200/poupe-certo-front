# Implementation Plan: Login só com Google

**Branch**: `001-login-google` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-login-google/spec.md`

## Summary

Remove Better Auth (e-mail/senha) do front e troca por `@supabase/supabase-js` rodando só no navegador, fluxo OAuth PKCE com Google. Login vira um botão; callback client-side (`/auth/callback`) espera a troca automática do `code` pela sessão e devolve a pessoa pro `next`. O `access_token` da sessão vai como `Authorization: Bearer` em toda chamada axios pro Nest (`poupe-certo-back`), que valida via JWKS.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.3 (App Router)

**Primary Dependencies**: `@supabase/supabase-js` (novo), axios, @tanstack/react-query, sonner, shadcn/ui. Remove: `better-auth`.

**Storage**: sessão no `localStorage` do navegador (padrão supabase-js). Nenhum acesso a tabela Supabase pelo front.

**Testing**: validação manual via `quickstart.md` (fase `/test` decide automação).

**Target Platform**: navegador (Vercel, free tier)

**Project Type**: web app (frontend)

**Performance Goals**: SC-001 (<15s do clique ao destino), dominado pelo round-trip do Google.

**Constraints**: sem SSR dependente de sessão (todas as telas protegidas já são Client Components com `useRequireAuth`); nada de segredo no bundle — só URL do projeto e publishable key (públicas por desenho).

**Scale/Scope**: ~12 arquivos tocados, 1 rota nova (`/auth/callback`), 1 rota removida (`/signup`).

## Constitution Check

| Princípio | Avaliação |
|---|---|
| I. Stack Declarada | PASS — `project.config.json` atualizado: `auth: "supabase-auth"` como desvio pontual documentado. |
| II. Zod na Borda | PASS — única entrada externa nova é o query param `next`, validado por `safeNextPath` (allowlist de caminho interno). Zod de login/signup removido junto com os formulários. |
| III. Autorização no Servidor | PASS — front só esconde/redireciona; autorização real fica no Nest (guard JWKS + RLS). |
| IV. RLS | N/A no front — não acessa tabela. |
| V. Segurança antes do Review | PLANEJADO — `/security` cobre open redirect do `next`, armazenamento do token, CORS com o back. |
| VI. YAGNI | PASS — sem `@supabase/ssr`, sem proxy/middleware, sem route handler server-side: nenhuma tela usa sessão no servidor. |
| VII. Rastreabilidade | PASS — spec, plan, research, quickstart, tasks. |

## Project Structure

### Documentation

```text
specs/001-login-google/
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md
```

Contrato consumido: `poupe-certo-back/specs/001-login-social-com/contracts/api.md` (`GET /users/me` com Bearer).

### Source Code

```text
src/
├── lib/
│   ├── supabase.ts          # NOVO — client browser (PKCE)
│   ├── auth.ts              # NOVO — signInWithGoogle, signOut, safeNextPath, getDisplayUser
│   ├── auth-client.ts       # REMOVIDO (Better Auth)
│   ├── validations/auth.ts  # REMOVIDO (schemas de e-mail/senha)
│   └── api/client.ts        # Bearer interceptor, sem withCredentials
├── hooks/
│   ├── use-session.ts       # NOVO — useSyncExternalStore sobre onAuthStateChange
│   └── use-require-auth.ts  # usa useSession novo
├── app/
│   ├── login/               # botão Google único
│   ├── auth/callback/       # NOVO — espera sessão e redireciona
│   └── signup/              # REMOVIDO (redirect em next.config.ts)
└── components/
    ├── site-header.tsx      # nome/foto do Google
    ├── site-footer.tsx      # remove "Criar conta"
    └── sign-out-button.tsx  # signOut do supabase
```

**Structure Decision**: mantém estrutura atual do repo; só troca a camada de auth.

## Complexity Tracking

Sem violações.
