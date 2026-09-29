import http from "node:http";

/**
 * Servidor HTTP mínimo que substitui o poupe-certo-back durante os testes
 * e2e, escutando na mesma porta de `NEXT_PUBLIC_API_URL`. Necessário porque
 * `page.route` do Playwright só intercepta requisições feitas pelo
 * navegador — as Server Components (ex.: `/product/[ean]`) chamam a API
 * direto do processo Node do `next dev`, fora do alcance do `page.route`.
 * Roda com `workers: 1` (ver playwright.config.ts) para o estado em memória
 * abaixo ser seguro entre specs.
 */

interface MockRoute {
  method: string;
  pattern: RegExp;
  handler: (
    match: string[],
    body: unknown,
    query: URLSearchParams
  ) => { status?: number; json: unknown };
}

let server: http.Server | null = null;
let routes: MockRoute[] = [];

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
  });
}

function ensureServer(port: number) {
  if (server) return;
  server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", "http://mock");
    const pathname = url.pathname;
    void readBody(req).then((body) => {
      const route = routes.find(
        (r) => r.method === req.method && r.pattern.test(pathname)
      );
      if (!route) {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ message: "no mock route", pathname }));
        return;
      }
      const match = pathname.match(route.pattern);
      const result = route.handler(match ? match.slice(1) : [], body, url.searchParams);
      res.writeHead(result.status ?? 200, { "content-type": "application/json" });
      res.end(JSON.stringify(result.json));
    });
  });
  server.listen(port);
}

export function startMockBackend() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
  ensureServer(Number(new URL(apiUrl).port));
}

export function mockRoute(
  method: string,
  pattern: RegExp,
  handler: MockRoute["handler"]
) {
  routes.push({ method, pattern, handler });
}

export function mockJson(method: string, pattern: RegExp, json: unknown, status = 200) {
  mockRoute(method, pattern, () => ({ status, json }));
}

export function resetMockRoutes() {
  routes = [];
}
