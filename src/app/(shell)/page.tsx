"use client";

import Link from "next/link";
import { BadgeCheck, ScanBarcode, Store, Sparkles, Trophy, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QueryError } from "@/components/query-error";
import { TRENDING_SEARCHES } from "@/lib/mock/community";
import { useLocationStore } from "@/stores/location-store";
import { trustColorVar, trustLevel } from "@/lib/trust";
import { useSearchProducts } from "@/hooks/use-products";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useMarkets } from "@/hooks/use-markets";

function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",");
}

function initialsOf(name: string | null): string {
  if (!name) return "??";
  return name.slice(0, 2).toUpperCase();
}

function marketLocation(m: { address: string | null; city: string | null; uf: string | null }): string | null {
  if (m.city) return m.uf ? `${m.city}, ${m.uf}` : m.city;
  return m.address;
}

export default function HomePage() {
  const city = useLocationStore((s) => s.city);
  const cityShort = city ?? "sua cidade";

  const featured = useSearchProducts({ sort: "recente", pageSize: 8 });
  const leaderboard = useLeaderboard(3);
  const markets = useMarkets();

  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-11 md:grid-cols-2 md:items-center">
          <div>
            <div className="mb-4.5 inline-flex items-center gap-1.5 rounded-lg border border-primary-foreground/20 px-2.5 py-1 text-xs font-medium">
              <BadgeCheck className="size-3.5 text-trust-fresh" />
              Preço conferido por quem compra
            </div>
            <h1 className="mb-3.5 text-4xl leading-tight font-semibold tracking-tight text-balance md:text-5xl">
              Compre certo. Poupe em {cityShort}.
            </h1>
            <p className="mb-5.5 max-w-md text-[15px] leading-relaxed text-primary-foreground/70">
              Veja em qual mercado cada produto está mais barato hoje — com
              preços que a própria vizinhança confere na gôndola.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link href="/scan">
                  <ScanBarcode className="size-4.5" />
                  Escanear produto
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/search">Ver preços</Link>
              </Button>
            </div>
            <div className="mt-4.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-primary-foreground/50">
                Sugestões de busca:
              </span>
              {TRENDING_SEARCHES.map((t) => (
                <Link
                  key={t}
                  href={`/search?q=${encodeURIComponent(t)}`}
                  className="rounded-lg border border-primary-foreground/15 px-2.5 py-1 text-xs font-medium no-underline"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>

          <Card className="text-card-foreground">
            <CardContent className="pt-1">
              <div className="mb-1 flex items-center gap-2">
                <Trophy className="size-4 text-reward" />
                <div className="text-[15px] font-semibold">
                  Top contribuidores
                </div>
              </div>
              <div className="mb-4 text-xs text-muted-foreground">
                Quem mais informou preços com alta confiança.
              </div>
              {leaderboard.isPending && (
                <div className="flex flex-col gap-2.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-lg bg-muted/60"
                    />
                  ))}
                </div>
              )}
              {leaderboard.isError && (
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar o ranking agora.
                </p>
              )}
              {leaderboard.data && (
                <div className="flex flex-col gap-2.5">
                  {leaderboard.data.map((c, i) => (
                    <div
                      key={`${c.displayName}-${i}`}
                      className={
                        "flex items-center gap-3 rounded-lg border border-border p-2.5" +
                        (i === 0 ? " bg-muted" : "")
                      }
                    >
                      <div
                        className={
                          "flex size-6.5 shrink-0 items-center justify-center rounded-full text-xs font-semibold" +
                          (i === 0
                            ? " bg-primary text-primary-foreground"
                            : " bg-muted text-foreground")
                        }
                      >
                        {i + 1}
                      </div>
                      <Avatar>
                        {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt="" />}
                        <AvatarFallback>{initialsOf(c.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {c.displayName ?? "Anônimo"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.pricesReported} preços · nível {c.level}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-0.5 text-xs font-medium">
                          <span className="size-1.5 rounded-full bg-trust-fresh" />
                          {c.points} pts
                        </div>
                      </div>
                    </div>
                  ))}
                  {leaderboard.data.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Ninguém no ranking ainda — seja o primeiro.
                    </p>
                  )}
                </div>
              )}
              <Link
                href="/profile"
                className="mt-3.5 inline-block text-sm font-medium underline underline-offset-4"
              >
                Ver meu ranking
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Produtos com preço recente
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Comparando preços em {cityShort}
            </p>
          </div>
          <Link
            href="/search"
            className="text-sm font-medium underline underline-offset-4"
          >
            Ver todos
          </Link>
        </div>

        {featured.isPending && (
          <div className="mb-11 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-border bg-muted/40"
              />
            ))}
          </div>
        )}

        {featured.isError && (
          <div className="mb-11">
            <QueryError error={undefined} onRetry={() => featured.refetch()} />
          </div>
        )}

        {featured.data && (
          <div className="mb-11 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.data.items.map((p) => (
              <Link
                key={p.ean}
                href={`/product/${p.ean}`}
                className="rounded-xl border border-border p-3.5 shadow-xs"
              >
                <div className="mb-3 aspect-[1.2] w-full rounded-lg bg-muted" />
                <div className="text-sm font-medium leading-snug">
                  {p.name}
                </div>
                <div className="mb-2.5 text-xs text-muted-foreground">
                  {p.qty}
                </div>
                {p.lowestOffer ? (
                  <>
                    <div className="text-xl font-semibold tracking-tight tabular-nums">
                      R$ {formatPrice(p.lowestOffer.price)}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5">
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: trustColorVar(
                            trustLevel(p.lowestOffer.reportedAt)
                          ),
                        }}
                      />
                      <span className="truncate text-[11px] text-muted-foreground">
                        {p.lowestOffer.market.name}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mt-2.5 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                    sem preço ainda
                  </div>
                )}
              </Link>
            ))}
            {featured.data.items.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                Ainda não há produtos cadastrados. Escaneie o primeiro!
              </p>
            )}
          </div>
        )}
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-7 px-6 py-9 sm:grid-cols-3">
          {[
            {
              icon: ScanBarcode,
              title: "Escaneie na gôndola",
              desc: "Abra o site no celular, aponte a câmera para o código de barras e o produto é identificado na hora.",
            },
            {
              icon: BadgeCheck,
              title: "A comunidade confirma",
              desc: "Outras pessoas confirmam ou corrigem. Cada preço carrega sua idade e o número de confirmações.",
            },
            {
              icon: TrendingDown,
              title: "Compare e economize",
              desc: "Veja o mesmo produto em todos os mercados da cidade e descubra onde a compra sai mais barata.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg border border-border bg-background">
                  <Icon className="size-3.5 opacity-70" />
                </div>
                <div className="text-base font-semibold">{title}</div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-9 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Mercados cadastrados</h2>
          <div className="flex flex-col gap-2">
            {markets.isPending &&
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-muted/40"
                />
              ))}
            {markets.isError && (
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar os mercados agora.
              </p>
            )}
            {markets.data?.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3.5"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Store className="size-4 opacity-60" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{m.name}</div>
                  {marketLocation(m) && (
                    <div className="text-xs text-muted-foreground">
                      {marketLocation(m)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {markets.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum mercado cadastrado ainda.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-xl bg-primary p-7 text-primary-foreground">
          <div className="mb-3.5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-primary-foreground/20 px-2.5 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" />
            Você ganha pontos
          </div>
          <h3 className="mb-2.5 text-xl font-semibold tracking-tight">
            Achou um preço melhor? Conte pra todo mundo em 10 segundos.
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-primary-foreground/70">
            Cada preço informado mantém a base viva e te aproxima do próximo
            nível — e do topo do ranking.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/scan">Escanear agora</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href="/profile">Meu perfil</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
