"use client";

import { useState } from "react";
import { PackagePlus, ThumbsUp } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SignOutButton } from "@/components/sign-out-button";
import { QueryError } from "@/components/query-error";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useProfileStats, useContributions } from "@/hooks/use-profile";
import { getDisplayUser } from "@/lib/auth";
import { useLocationStore } from "@/stores/location-store";
import { formatAge } from "@/lib/trust";
import type { ContributionItem } from "@/lib/api/users";

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",");
}

function ContributionRow({ item }: Readonly<{ item: ContributionItem }>) {
  const isPrice = item.type === "price_report";
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        {isPrice ? (
          <ThumbsUp className="size-3.5 opacity-60" />
        ) : (
          <PackagePlus className="size-3.5 opacity-60" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{item.product.name}</div>
        <div className="text-xs text-muted-foreground">
          {isPrice && item.market ? `${item.market.name} · ` : ""}
          {formatAge(item.createdAt)}
        </div>
      </div>
      {isPrice && item.price !== undefined && (
        <div className="text-sm font-medium tabular-nums">
          R$ {formatPrice(item.price)}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { session, isReady } = useRequireAuth("/profile");
  const { uf, city } = useLocationStore();
  const stats = useProfileStats();
  const [contributionsPageSize, setContributionsPageSize] = useState(10);
  const contributions = useContributions({ pageSize: contributionsPageSize });

  if (!isReady || !session) {
    return null;
  }

  const user = getDisplayUser(session);

  return (
    <div className="mx-auto grid max-w-4xl gap-4 px-6 py-6 sm:grid-cols-2">
      <div className="h-fit rounded-xl border border-border p-5.5 shadow-xs">
        <div className="mb-4.5 flex items-center gap-3.5">
          <Avatar size="lg">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="text-lg">{user.initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-base font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">
              {city ? `${city}, ${uf}` : user.email}
              {stats.data && ` · ${stats.data.rankPosition}º no ranking`}
            </div>
          </div>
        </div>

        {stats.isPending && (
          <div className="h-16 animate-pulse rounded-lg bg-muted/40" />
        )}
        {stats.isError && (
          <QueryError error={undefined} onRetry={() => stats.refetch()} />
        )}
        {stats.data && (
          <>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-muted-foreground">
                Nível {stats.data.level} · {stats.data.points} pts
              </span>
              <span className="font-medium">{stats.data.progressPercent}%</span>
            </div>
            <Progress value={stats.data.progressPercent} className="mb-2" />
            <p className="mb-4 text-xs text-muted-foreground">
              {stats.data.pointsToNextLevel} pontos para o próximo nível
            </p>
          </>
        )}
        <SignOutButton />
      </div>

      <div className="flex flex-col gap-3">
        {stats.data && (
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { value: stats.data.pricesReported, label: "Preços registrados" },
              { value: stats.data.productsCreated, label: "Produtos criados" },
              { value: stats.data.confirmationsGiven, label: "Confirmações" },
              { value: `${stats.data.confidencePercent}%`, label: "Confiança" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border p-3.5">
                <div className="text-xl font-semibold tabular-nums">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-border p-5">
          <div className="mb-3.5 text-base font-semibold">
            Minhas contribuições
          </div>
          {contributions.isPending && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-muted/40" />
              ))}
            </div>
          )}
          {contributions.isError && (
            <QueryError error={undefined} onRetry={() => contributions.refetch()} />
          )}
          {contributions.data && (
            <div className="flex flex-col gap-3">
              {contributions.data.items.map((item, i) => (
                <ContributionRow key={`${item.product.ean}-${i}`} item={item} />
              ))}
              {contributions.data.items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma contribuição ainda — escaneie um preço para começar.
                </p>
              )}
              {contributions.data.total > contributions.data.items.length && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 self-center"
                  onClick={() => setContributionsPageSize((n) => n + 10)}
                >
                  Carregar mais
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
