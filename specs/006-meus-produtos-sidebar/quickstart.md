# Quickstart — validar 006

## Automatizado

```bash
# back
cd poupe-certo-back
npm test                 # unit (schema da query)
npm run test:e2e         # 401 sem token / 400 status inválido

# front (matar 3000/3333 antes do playwright)
cd poupe-certo-front
npm test                 # vitest
npx playwright test      # my-products.spec, sidebar.spec, responsive.spec, suíte existente
```

Esperado: tudo verde; suíte existente continua passando (SC-005).

## Manual (browser real, conta Google)

1. `npm run start:dev` (back :3333) e `npm run dev` (front :3000).
2. Logado, abrir `/` em ≥768px → menu lateral com Início, Buscar, Escanear, Minha Lista, Meus produtos, Perfil. Item atual destacado.
3. Recolher menu → só ícones; recarregar → continua recolhido.
4. Escanear EAN inexistente → cadastrar produto → "Meus produtos" mostra contador 1 e o produto na aba Pendentes.
5. (Conta operadora) aprovar em `/admin` → em "Meus produtos" o produto vai para Aprovados e o card leva a `/product/<ean>`.
6. DevTools 375px e 320px → botão menu no topo abre gaveta; tocar item navega e fecha; barra inferior intacta; sem scroll horizontal.
7. Conta não-operadora → sem item "Admin". Deslogado → sem contador, "Meus produtos" leva ao login.
