export type TrustLevel = "fresh" | "warning" | "stale" | "expired";

const TRUST_LABEL: Record<TrustLevel, string> = {
  fresh: "Alta confiança",
  warning: "Pode ter mudado",
  stale: "Desatualizado",
  expired: "Expirado",
};

const TRUST_COLOR_VAR: Record<TrustLevel, string> = {
  fresh: "var(--trust-fresh)",
  warning: "var(--trust-warning)",
  stale: "var(--trust-stale)",
  expired: "var(--destructive)",
};

export function ageInDays(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function trustLevel(isoDate: string): TrustLevel {
  const days = ageInDays(isoDate);
  if (days <= 3) return "fresh";
  if (days <= 7) return "warning";
  if (days <= 14) return "stale";
  return "expired";
}

export function trustLabel(level: TrustLevel): string {
  return TRUST_LABEL[level];
}

export function trustColorVar(level: TrustLevel): string {
  return TRUST_COLOR_VAR[level];
}

export function formatAge(isoDate: string): string {
  const days = ageInDays(isoDate);
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}
