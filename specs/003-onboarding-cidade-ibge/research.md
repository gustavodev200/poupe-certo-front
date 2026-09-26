# Research: Onboarding com Localização Real (IBGE) e Mercados por Cidade

Nenhum `NEEDS CLARIFICATION` restou no Technical Context do `plan.md` — as
decisões abaixo documentam por que cada escolha foi feita (sem alternativas
pendentes de decisão do usuário, já resolvidas na fase de spec).

## 1. Fonte de dados de estados/cidades

**Decision**: API pública de Localidades do IBGE —
`GET https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome`
(lista de UFs) e
`GET https://servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios`
(municípios de uma UF).

**Rationale**: Gratuita, pública, sem autenticação/API key, mantida pelo
governo federal (fonte oficial de divisão territorial), sem limite de uso
documentado para este volume (27 chamadas de estado + 1 chamada por UF
selecionada). Cobre exatamente o par estado→cidades que a tela de onboarding
já modela hoje com o mock `CITIES`.

**Alternatives considered**:
- **ViaCEP** (`viacep.com.br`) — descartada: só resolve CEP→endereço
  (uf/localidade únicos), não expõe "listar municípios de uma UF". Serviria
  para um fluxo de "digite seu CEP", mas isso muda o layout da tela (uma
  clarificação já resolvida com o usuário optando por manter o layout atual
  de dropdown UF + lista de cidade).
- **Base estática embarcada** (gerar um JSON de UFs/municípios no build) —
  descartada por YAGNI: adiciona um passo de build/manutenção sem benefício
  real, já que o IBGE já serve exatamente esse dado, atualizado, de graça.

## 2. Cache/estratégia de busca no frontend

**Decision**: `@tanstack/react-query` com `staleTime` longo — estados
praticamente nunca mudam (`Infinity` ou equivalente a "nunca refetch
automático nesta sessão"); municípios por UF também são estáveis, `staleTime`
de várias horas é suficiente. Busca por texto (campo já existente) continua
100% client-side sobre a lista de municípios já carregada da UF selecionada —
nenhuma chamada de rede por tecla digitada.

**Rationale**: Já é o padrão usado pelo projeto para outros dados
(`use-markets.ts`, `use-profile-stats`, etc.), reaproveita a mesma
`QueryClientProvider` já configurada. Evita repetir chamadas ao trocar de UF
e voltar à mesma UF na mesma sessão.

**Alternatives considered**: `SWR` ou fetch manual com `useState` — descartado
por inconsistência com o padrão já estabelecido no repositório (todo dado
assíncrono do front já passa por hooks `use-*` com React Query).

## 3. Onde vive a cidade/UF do usuário (fonte de verdade)

**Decision**: `Profile.city` / `Profile.uf` no backend (Postgres via Prisma)
passam a ser a fonte de verdade. O `location-store` (zustand + `persist`) do
front continua existindo, mas como espelho local/otimista — sincronizado a
partir de `GET /users/me` sempre que uma sessão autenticada carrega o shell
autenticado, sobrescrevendo qualquer valor antigo salvo só no navegador.

**Rationale**: Requisito explícito do usuário (FR-005): a cidade precisa
sobreviver a troca de dispositivo/navegador. Manter o zustand como cache
local evita um flash de loading em toda navegação dentro do shell (já
hidrata instantâneo do `localStorage` enquanto a chamada de rede ao backend
confirma/corrige em segundo plano).

**Alternatives considered**:
- **Só backend, sem zustand** — descartada: perderia a hidratação instantânea
  já existente (`useLocationHydrated`), usada hoje para decidir
  render/redirecionamento sem flash; reescrever esse mecanismo não traz
  benefício e authenticaria toda navegação num round-trip de rede.
- **Só zustand/localStorage (comportamento atual)** — é exatamente o problema
  que esta feature resolve (não sobrevive a troca de dispositivo); descartado
  por contradizer FR-005.

## 4. Migração de pessoas com cidade mock salva antes desta feature

**Decision**: Tratadas como "onboarding incompleto" — como o backend não tem
`city`/`uf` para essas pessoas (coluna nova, `NULL` por padrão), o gate atual
do `(shell)/layout.tsx` (redireciona para `/onboarding` quando não há cidade)
continua funcionando sem mudança de lógica, agora lendo a verdade do backend
em vez do `localStorage`.

**Rationale**: Simplicidade (YAGNI) — não existe uma forma confiável de
mapear os nomes de cidade do mock antigo (poucas cidades de exemplo) para a
grafia oficial do IBGE sem risco de erro; pedir para escolher de novo é
seguro e rápido (< 1 minuto, mesma UX do onboarding original).

**Alternatives considered**: Script de migração de dados tentando casar nome
de cidade mock → município IBGE — descartado por YAGNI/risco: o mock só tinha
poucas cidades de exemplo, universo de usuários afetado é o de testes
internos antes do lançamento real.

## 5. Filtro de mercados por cidade — nível de comparação

**Decision**: Igualdade de `city` (case-insensitive, mesmo padrão já usado em
`markets.service.ts#createOrReuse` para nome de mercado) + `uf` (exato, já
normalizado para maiúsculas na entrada). Sem introduzir um identificador
numérico de município.

**Rationale**: Ambos os lados (perfil da pessoa e mercado) passam a ser
alimentados pela mesma fonte (lista oficial do IBGE), então o nome da cidade
tende a ser grafado de forma idêntica; case-insensitive absorve a única
variação plausível (maiúsculas/minúsculas ao digitar o nome do mercado
manualmente). Consistente com YAGNI (Princípio VI) — não introduz nova coluna
`municipioId` sem necessidade comprovada.

**Alternatives considered**: Guardar o código IBGE do município em `Profile`
e `Market` e comparar por ID — mais robusto a variação de grafia, mas
prematuro: `Market.city`/`Market.uf` já existem como texto livre desde a
feature anterior (002) e mudar esse contrato agora está fora do escopo
pedido pelo usuário.

## 6. Autorização e RLS para as novas colunas de `Profile`

**Decision**: Reaproveitar a policy `profiles_update_own_points` já existente
(`FOR UPDATE ... USING (id = auth.uid()) WITH CHECK (id = auth.uid())`),
adicionando apenas `GRANT UPDATE ("city", "uf") ON public.profiles TO
authenticated`. Nenhuma policy nova.

**Rationale**: RLS no Postgres é por linha, não por coluna — o controle fino
de "quais colunas uma role pode tocar" já é feito neste projeto via `GRANT
UPDATE (<colunas>)` explícito (mesmo padrão usado para `points`, `status` em
`products`/`price_reports`). A policy de linha (`id = auth.uid()`) já garante
que só a própria pessoa edita seu próprio perfil; falta só liberar as
colunas novas.

**Alternatives considered**: Criar uma policy nova
`profiles_update_own_location` idêntica — redundante (mesma condição de
linha da policy existente); PostgreSQL permite múltiplas policies
permissivas para o mesmo comando, mas não há necessidade real de
segregar por "tipo" de UPDATE aqui.
