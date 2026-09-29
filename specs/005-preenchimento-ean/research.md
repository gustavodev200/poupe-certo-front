# Research: Preenchimento automático pelo EAN

## 1. Qual endpoint do Open Food Facts

- **Decision**: `GET https://world.openfoodfacts.org/api/v2/product/{ean}.json?fields=product_name,product_name_pt,brands,quantity,image_front_url,categories_tags` com header `User-Agent: PoupeCerto/0.1 (<contato>)`.
- **Rationale**: v2 aceita `fields` (payload ~1 KB em vez de ~100 KB). OFF exige User-Agent identificável e limita leitura de produto a 100 req/min por IP. Testado em 2026-09-28 com 7891000100103 → `status: 1`, nome, marca, `quantity: "395 g"`, `image_front_url` em `images.openfoodfacts.org`.
- **Alternatives**: v0 (URL passada pelo pedido) — mesma base, sem `fields`; aceito como equivalente. Chamada direta do browser — rejeitada (FR-002, sem controle de taxa, CORS/UA).

## 2. Proteção contra requisições repetidas

- **Decision**: no back, `Map<ean, {value, expiresAt}>` com TTL 24 h para encontrado, 1 h para não encontrado, 1 min para erro/timeout; tamanho máximo 1000 entradas (remove a mais antiga — `Map` preserva ordem de inserção). `Map<ean, Promise>` de requisições em voo: chamadas concorrentes aguardam a mesma Promise. Timeout 4 s via `AbortSignal.timeout`. Throttle do endpoint: 20/min por cliente (`@Throttle`). No front, `useQuery(['ean-lookup', ean], { staleTime: Infinity, retry: false })` e trava no scan para não navegar duas vezes.
- **Rationale**: serverless → cache por instância, mas ainda corta a grande maioria (scan repetido do mesmo produto). Sem infra extra (YAGNI).
- **Alternatives**: Redis/Upstash, tabela `ean_cache` — rejeitadas por ora (infra/migração a mais para ganho marginal).

## 3. Upload no Cloudinary

- **Decision**: `POST https://api.cloudinary.com/v1_1/{cloud}/image/upload` form-urlencoded com `file=<url OFF>`, `public_id=poupe-certo/products/<ean>`, `overwrite=false`, `timestamp`, `api_key`, `signature = sha1("overwrite=false&public_id=...&timestamp=..." + secret)`. Resposta validada por Zod (`secure_url`). Timeout 8 s.
- **Rationale**: Cloudinary busca a URL remota ele mesmo (back não baixa bytes). `public_id` determinístico + `overwrite=false` = idempotente (reenvio devolve o asset existente). Assinatura manual documentada oficialmente; evita dependência (`cloudinary` SDK) para uma única chamada.
- **Alternatives**: SDK oficial — ok mas desnecessário; upload na hora do lookup — rejeitado (encheria o storage com EANs nunca cadastrados).

## 4. Quando/como gravar a foto

- **Decision**: em `POST /products`, antes da transação: `lookup(ean)` (cache) → se tem foto → upload (try/catch, falha = sem foto) → `imageUrl` no `create`. `imageUrl` removida do schema de entrada (Zod `strip` descarta campo extra).
- **Rationale**: FR-011/012/013. Upload fora da transação não segura conexão do pooler. Em 409, o asset fica órfão mas com `public_id` do próprio EAN — é o mesmo que o produto existente usaria.

## 5. SSRF / domínio da foto

- **Decision**: só aceitar `https://images.openfoodfacts.org/...` ou `https://static.openfoodfacts.org/...` (checado no parser). Outras → sem foto.

## 6. Mapeamento de categoria

- **Decision**: heurístico sobre `categories_tags` (`en:beverages`→beb, `en:dairies`/`en:cheeses`/`en:meats`→fri, `en:breads`/`en:biscuits-and-cakes`→pad, ...). Sem match → `null`. Produtos não alimentares (limpeza/higiene) raramente estão no OFF — ficam `null`.

## 7. Cloud name

- **Decision**: env `CLOUDINARY_CLOUD_NAME`. Testado 2026-09-28: `poupe-certo` retorna `cloud_name mismatch` com a chave fornecida → dono precisa informar o valor do Dashboard. Envs Cloudinary opcionais: ausentes → upload desligado (log de aviso uma vez), cadastro segue.
