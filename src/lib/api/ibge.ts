import { z } from "zod";

const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

const estadoSchema = z.object({
  sigla: z.string(),
  nome: z.string(),
});

const municipioSchema = z.object({
  nome: z.string(),
});

export type Estado = z.infer<typeof estadoSchema>;
export type Municipio = z.infer<typeof municipioSchema>;

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`IBGE respondeu ${res.status} para ${url}`);
  }
  return res.json();
}

export async function fetchEstados(): Promise<Estado[]> {
  const data = await fetchJson(`${IBGE_BASE_URL}/estados?orderBy=nome`);
  return z.array(estadoSchema).parse(data);
}

export async function fetchMunicipios(uf: string): Promise<Municipio[]> {
  const data = await fetchJson(`${IBGE_BASE_URL}/estados/${uf}/municipios`);
  return z.array(municipioSchema).parse(data);
}
