export const CITIES: Record<string, [string, string][]> = {
  GO: [
    ["Goianésia", "4 mercados · 312 preços"],
    ["Goiânia", "38 mercados · 8.104 preços"],
    ["Anápolis", "12 mercados · 2.418 preços"],
    ["Ceres", "3 mercados · 189 preços"],
    ["Jaraguá", "2 mercados · 96 preços"],
  ],
  SP: [
    ["São Paulo", "210 mercados · 41.900 preços"],
    ["Campinas", "46 mercados · 9.220 preços"],
    ["Santos", "18 mercados · 3.140 preços"],
  ],
  MG: [
    ["Belo Horizonte", "88 mercados · 19.470 preços"],
    ["Uberlândia", "24 mercados · 4.810 preços"],
  ],
  RJ: [
    ["Rio de Janeiro", "134 mercados · 27.300 preços"],
    ["Niterói", "21 mercados · 3.980 preços"],
  ],
  BA: [
    ["Salvador", "76 mercados · 14.220 preços"],
    ["Feira de Santana", "17 mercados · 2.640 preços"],
  ],
  DF: [["Brasília", "64 mercados · 12.870 preços"]],
  PR: [
    ["Curitiba", "58 mercados · 11.340 preços"],
    ["Londrina", "19 mercados · 3.010 preços"],
  ],
  RS: [["Porto Alegre", "61 mercados · 12.010 preços"]],
};

export const TRENDING_SEARCHES = [
  "arroz 5kg",
  "café 500g",
  "leite 1L",
  "óleo de soja",
];

export const TOP_CONTRIBUTORS = [
  { name: "Marina Alves", initials: "MA", prices: 156, level: 7, confidence: "98%" },
  { name: "Rafael Nunes", initials: "RN", prices: 121, level: 6, confidence: "96%" },
  { name: "Bianca Prado", initials: "BP", prices: 104, level: 5, confidence: "94%" },
];

export const FOOTER_COLUMNS = [
  { title: "Produto", links: ["Comparar preços", "Escanear preço", "Mercados", "Minha lista"] },
  { title: "Comunidade", links: ["Como funciona", "Ranking", "Reputação", "Regras"] },
  { title: "Sobre", links: ["Quem somos", "Cidades", "Contato", "Privacidade"] },
];

export const PLATFORM_STATS = {
  totalPrices: "52.891",
  totalContributors: "1.248",
};
