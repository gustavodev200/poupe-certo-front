"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw, ScanBarcode, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLocationStore, type RecentCity } from "@/stores/location-store";
import { useEstados, useMunicipios } from "@/hooks/use-ibge-locations";
import { useSaveLocation } from "@/hooks/use-profile-location";
import { ModeToggle } from "@/components/mode-toggle";

export default function OnboardingPage() {
  const router = useRouter();
  const storedUf = useLocationStore((s) => s.uf);
  const storedCity = useLocationStore((s) => s.city);
  const recentCities = useLocationStore((s) => s.recentCities);
  const saveLocation = useSaveLocation();

  const estados = useEstados();
  const [uf, setUf] = useState<string | null>(storedUf);
  const [cityQuery, setCityQuery] = useState("");
  const [city, setCity] = useState<string | null>(storedCity);

  const activeUf = uf ?? estados.data?.[0]?.sigla ?? null;
  const municipios = useMunicipios(activeUf);

  const cityList = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    return (municipios.data ?? []).filter(
      (m) => !q || m.nome.toLowerCase().includes(q)
    );
  }, [municipios.data, cityQuery]);

  function pickUf(next: string) {
    setUf(next);
    setCity(null);
    setCityQuery("");
  }

  function pickRecent(recent: RecentCity) {
    setUf(recent.uf);
    setCity(recent.city);
    setCityQuery("");
  }

  function finish() {
    if (!city || !activeUf) return;
    saveLocation.mutate(
      { city, uf: activeUf },
      { onSuccess: () => router.push("/") }
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <ScanBarcode className="size-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Poupe Certo</span>
        </div>

        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          Onde você faz compras?
        </h1>
        <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
          Cada cidade tem seus preços. Diga onde você compra e mostramos os
          mercados perto de você.
        </p>

        {recentCities.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 text-sm font-medium">Recentes</div>
            <div className="flex flex-wrap gap-2">
              {recentCities.map((recent) => (
                <button
                  key={`${recent.uf}-${recent.city}`}
                  type="button"
                  onClick={() => pickRecent(recent)}
                  className={cn(
                    "rounded-lg border px-3.5 py-2 text-sm font-medium",
                    recent.uf === activeUf && recent.city === city
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent"
                  )}
                >
                  {recent.city}, {recent.uf}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-2 text-sm font-medium">Estado</div>
        {estados.isError ? (
          <div className="mb-5 rounded-lg border border-border p-4 text-center">
            <p className="mb-2.5 text-sm text-muted-foreground">
              Não conseguimos carregar a lista de estados agora.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => estados.refetch()}
            >
              <RefreshCw className="size-3.5" />
              Tentar novamente
            </Button>
          </div>
        ) : estados.isLoading ? (
          <div className="mb-5 text-sm text-muted-foreground">
            Carregando estados…
          </div>
        ) : (
          <div className="mb-5 flex flex-wrap gap-2">
            {estados.data?.map((estado) => (
              <button
                key={estado.sigla}
                type="button"
                onClick={() => pickUf(estado.sigla)}
                className={cn(
                  "shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium",
                  estado.sigla === activeUf
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-transparent"
                )}
              >
                {estado.sigla}
              </button>
            ))}
          </div>
        )}

        <div className="mb-2 text-sm font-medium">Cidade</div>
        <div className="mb-2.5 flex h-10 items-center gap-2 rounded-lg border border-border px-3 shadow-xs">
          <Search className="size-4 opacity-50" />
          <Input
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="Buscar cidade"
            className="h-full border-none px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {municipios.isError ? (
          <div className="mb-5 rounded-lg border border-border p-5 text-center">
            <p className="mb-2.5 text-sm text-muted-foreground">
              Não conseguimos carregar as cidades desse estado agora.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => municipios.refetch()}
            >
              <RefreshCw className="size-3.5" />
              Tentar novamente
            </Button>
          </div>
        ) : municipios.isLoading ? (
          <div className="mb-5 rounded-lg border border-border p-5 text-center text-sm text-muted-foreground">
            Carregando cidades…
          </div>
        ) : (
          <div className="mb-5 max-h-72 overflow-y-auto rounded-lg border border-border">
            {cityList.map((m) => (
              <button
                key={m.nome}
                type="button"
                onClick={() => setCity(m.nome)}
                className={cn(
                  "flex w-full items-center justify-between border-b border-border px-3.5 py-3.5 text-left last:border-b-0",
                  city === m.nome && "bg-muted"
                )}
              >
                <div className="text-sm font-medium">{m.nome}</div>
                {city === m.nome && <Check className="size-4 opacity-75" />}
              </button>
            ))}
            {cityList.length === 0 && (
              <div className="p-5 text-center">
                <p className="mb-2.5 text-sm text-muted-foreground">
                  Nenhuma cidade encontrada nesse estado.
                </p>
                <p className="text-sm font-medium">
                  Podemos abrir sua cidade quando houver preços informados.
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={finish}
          disabled={!city || saveLocation.isPending}
          className="w-full"
          size="lg"
        >
          {saveLocation.isPending ? "Salvando…" : "Continuar"}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Você pode trocar de cidade a qualquer momento no topo do site.
        </p>
      </div>
    </div>
  );
}
