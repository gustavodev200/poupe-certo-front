# Quickstart: Login só com Google

## Pré-requisitos

- Provider Google ativo no Supabase (Authentication → Providers → Google).
- Supabase → Authentication → URL Configuration: Site URL `http://localhost:3000`; Redirect URLs incluem `http://localhost:3000/auth/callback` (e o domínio de produção + `/auth/callback`).
- `.env.local` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_URL`.
- Backend (`poupe-certo-back`) rodando em `NEXT_PUBLIC_API_URL`.

## Validação

1. `npm run dev`, abrir `/profile` sem sessão → vai para `/login?next=%2Fprofile`.
2. Tela de login mostra só "Continuar com Google".
3. Autorizar → volta em `/profile` com nome/foto do Google.
4. DevTools → Network: chamadas pra API carregam `Authorization: Bearer ...`; `GET /users/me` responde 200.
5. `/login?next=https://evil.com` → após login cai em `/profile`, não em evil.com.
6. `/signup?next=/scan` → redireciona para `/login?next=/scan`.
7. "Sair" no perfil → volta ao login; `/profile` exige login de novo.
8. Cancelar no Google → volta ao login com aviso.
