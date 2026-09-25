"use client";

import { Tag } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { SignOutButton } from "@/components/sign-out-button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useLocationStore } from "@/stores/location-store";

const PROFILE_STATS = [
  { value: "87", label: "Preços registrados" },
  { value: "32", label: "Produtos criados" },
  { value: "24", label: "Confirmações" },
  { value: "96%", label: "Confiança" },
];

const CONTRIBUTIONS = [
  { product: "Arroz Camil 5kg", market: "Mercado B", time: "há 2h", price: "25,90" },
  { product: "Leite Italac 1L", market: "Mercado X", time: "há 4h", price: "5,19" },
  { product: "Café Pilão 500g", market: "Mercado A", time: "ontem", price: "12,90" },
  { product: "Feijão Camil 1kg", market: "Mercado B", time: "há 2 dias", price: "7,49" },
];

export default function ProfilePage() {
  const { session, isReady } = useRequireAuth("/profile");
  const { uf, city } = useLocationStore();

  if (!isReady || !session) {
    return null;
  }

  const initials = session.user.name.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto grid max-w-4xl gap-4 px-6 py-6 sm:grid-cols-2">
      <div className="h-fit rounded-xl border border-border p-5.5 shadow-xs">
        <div className="mb-4.5 flex items-center gap-3.5">
          <Avatar size="lg">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-base font-semibold">{session.user.name}</div>
            <div className="text-xs text-muted-foreground">
              {city ? `${city}, ${uf}` : session.user.email} · 8º no ranking
            </div>
          </div>
        </div>
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-muted-foreground">Nível 4 · 132 pts</span>
          <span className="font-medium">66%</span>
        </div>
        <Progress value={66} className="mb-2" />
        <p className="mb-4 text-xs text-muted-foreground">
          68 pontos para o nível 5
        </p>
        <SignOutButton />
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          {PROFILE_STATS.map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-3.5">
              <div className="text-xl font-semibold tabular-nums">
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="mb-3.5 text-base font-semibold">
            Minhas contribuições
          </div>
          <div className="flex flex-col gap-3">
            {CONTRIBUTIONS.map((c) => (
              <div key={c.product + c.time} className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Tag className="size-3.5 opacity-60" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{c.product}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.market} · {c.time}
                  </div>
                </div>
                <div className="text-sm font-medium tabular-nums">
                  R$ {c.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
