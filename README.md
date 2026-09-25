# Poupe Certo — Frontend

Frontend do Poupe Certo, em Next.js (App Router). Só frontend — sem banco,
sem Prisma. Autenticação e dados vêm de um backend separado (repo próprio,
ainda não criado; Nest.js + Prisma + Better Auth, conforme o preset deste
workspace).

## Stack

- **Next.js 16** (App Router, Turbopack, TypeScript)
- **shadcn/ui** (base Radix, preset Nova) + **Tailwind CSS v4**
- **lucide-react** — ícones
- **TanStack React Query** — estado de servidor / cache de requisições
- **Zustand** — estado de cliente (UI, etc.)
- **Axios** — cliente HTTP pra API do backend (`NEXT_PUBLIC_API_URL`)
- **Better Auth** (client) — login/cadastro consumindo o backend
- **Zod** + **react-hook-form** — validação de formulário

Deploy alvo: **Vercel** (free tier).

## Setup local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. `cp .env.example .env.local` e preencha:

   - `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` em dev.
   - `NEXT_PUBLIC_API_URL` — URL do backend (Better Auth + API ficam lá).

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   `/`, `/login` e `/signup` já funcionam assim que o backend estiver de pé
   e `NEXT_PUBLIC_API_URL` apontar pra ele. `/dashboard` usa `useSession()`
   (client-side) e redireciona pra `/login` sem sessão.

> Sem o backend rodando, login/cadastro vão falhar (não tem pra onde
> chamar) — isso é esperado até o outro repo existir.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção |
| `npm run lint` | ESLint |

## Estrutura

```
src/
  app/
    login/, signup/, dashboard/  # páginas de auth (client components)
    providers.tsx                # QueryClientProvider (TanStack Query)
  components/ui/                 # componentes shadcn (gerados, editáveis)
  lib/
    auth-client.ts                # Better Auth client (signIn/signUp/useSession)
    api/client.ts                 # instância axios (NEXT_PUBLIC_API_URL)
    validations/                  # schemas Zod
```

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure `NEXT_PUBLIC_APP_URL` (URL de produção do front) e
   `NEXT_PUBLIC_API_URL` (URL de produção do backend) em Settings →
   Environment Variables.
3. Confirme CORS/cookies no backend: se front e backend ficarem em domínios
   diferentes, o backend precisa liberar a origem do front
   (`trustedOrigins` no Better Auth) e o cookie de sessão precisa
   `SameSite=None; Secure` pra sobreviver cross-site.

## Workflow (SpecKit)

Este repo herda o motor do [spec-kit](https://github.com/github/spec-kit) do
workspace-template original. Fluxo por feature:

```
/speckit-specify → /speckit-clarify → /speckit-plan → /speckit-tasks → /speckit-implement → /test → /security → /review
```

- `/speckit-specify "descrição da feature"` — cria `specs/NNN-slug/spec.md`.
- `/speckit-clarify` — o agente faz até 5 perguntas pra fechar ambiguidade.
- `/speckit-plan` — gera `plan.md` (lê `project.config.json` e
  `.specify/memory/constitution.md` como gate).
- `/speckit-tasks` — quebra em `tasks.md`.
- `/speckit-implement` — executa as tasks.
- `/test`, `/security`, `/review` — próprios deste workspace, rodam depois.

`project.config.json` é a fonte da verdade da stack — `backend: "nestjs"`
aponta pro repo separado (ainda não criado), `database: null` porque este
repo não toca banco. Skills de `prisma`/`database` não se aplicam aqui; ver
campo `notes` do config.

## Segurança

Toda Server Action/rota que recebe input do usuário valida com Zod antes de
tocar lógica de negócio (ver `src/lib/validations/`). Autorização fina
(ownership, role) é sempre responsabilidade do backend — este frontend
nunca deve ser a única barreira de proteção. Ver `SECURITY.md` e a skill
`security` antes de mexer em autenticação ou dado sensível.
