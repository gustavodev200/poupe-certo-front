# Research: Login só com Google

## 1. Client só no navegador vs `@supabase/ssr`

**Decision**: `createClient` do `@supabase/supabase-js` com `auth.flowType: 'pkce'`, `detectSessionInUrl: true`, `persistSession: true`, `autoRefreshToken: true`.

**Rationale**: Docs atuais do Supabase (via Context7, guia PKCE): no navegador, `signInWithOAuth` redireciona pro Google e, na volta, o client com `detectSessionInUrl` troca o `code` pela sessão sozinho (o code verifier ficou no storage do mesmo navegador). Nenhuma tela do app usa sessão no servidor — todas as protegidas são Client Components.

**Alternatives considered**: `@supabase/ssr` + `app/auth/callback/route.ts` + proxy de refresh de cookie — padrão oficial para Server-Side Auth; rejeitado por YAGNI (adiciona proxy, cliente server, cookies) sem nenhuma tela que precise. Vira a escolha certa no dia que alguma página renderizar dado do usuário no servidor.

## 2. Estado de sessão em React

**Decision**: store de módulo + `useSyncExternalStore`, alimentado por `supabase.auth.onAuthStateChange` (evento `INITIAL_SESSION` marca fim do carregamento).

**Rationale**: evita `setState` dentro de `useEffect` (regra de lint do projeto já corrigida em `ed3c337`), um único listener pro app todo, snapshot de servidor constante (`isPending: true`) — sem mismatch de hidratação.

## 3. Credencial pro Nest

**Decision**: interceptor axios lê `supabase.auth.getSession()` e seta `Authorization: Bearer <access_token>`; remove `withCredentials` (não há mais cookie de sessão entre domínios).

**Rationale**: é o que o guard do Nest espera (`contracts/api.md` do back). `getSession()` já devolve token renovado quando `autoRefreshToken` está ligado.

## 4. `next` e open redirect

**Decision**: `safeNextPath(raw)` aceita só string que começa com `/` e não com `//` nem `/\`; senão `/profile`.

**Rationale**: `next` passa por `redirectTo` do OAuth e volta na URL — sem allowlist vira open redirect (checklist `security`).

## 5. Rota `/signup`

**Decision**: remover a página; `redirects()` no `next.config.ts` manda `/signup` → `/login` (307), preservando query (`next`).

**Rationale**: doc do Next 16 (`next-config-js/redirects.md`) — query é repassada ao destino automaticamente.
