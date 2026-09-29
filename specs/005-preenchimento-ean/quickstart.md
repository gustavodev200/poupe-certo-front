# Quickstart: validar preenchimento pelo EAN

## Pré-requisitos

- `poupe-certo-back/.env` com `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (cloud name do Dashboard Cloudinary) e `OFF_USER_AGENT`.
- Back em `npm run start:dev` (3333), front em `npm run dev` (3000).

## Cenários

1. **Pré-preenchimento** — logado, `/scan` → digitar `7891000100103` (se ainda não cadastrado) → `/new-product` mostra nome/marca/quantidade e foto.
2. **Não encontrado** — EAN `7899999999999` → formulário vazio + aviso "não encontramos dados".
3. **Cache/dedupe** — `curl` 20× `GET /products/ean/7891000100103/lookup` com token → log do back mostra 1 única chamada ao OFF.
4. **Throttle** — 21ª chamada no mesmo minuto → 429.
5. **Foto** — cadastrar (1) → Cloudinary Media Library tem `poupe-certo/products/7891000100103`; aprovar via moderação → `/product/7891000100103` exibe a foto de `res.cloudinary.com`.
6. **Falha tolerada** — `CLOUDINARY_CLOUD_NAME` errado → cadastro conclui, produto sem foto.

## Automático

- back: `npm test` (parser, cache/dedupe, assinatura) e `npm run test:e2e`.
- front: `npm test` e `npx playwright test` (matar 3000/3333 antes).
