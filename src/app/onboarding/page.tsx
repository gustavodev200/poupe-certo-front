"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ScanBarcode, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CITIES } from "@/lib/mock/community";
import { useLocationStore } from "@/stores/location-store";
import { ModeToggle } from "@/components/mode-toggle";

const UFS = Object.keys(CITIES);

export default function OnboardingPage() {
  const router = useRouter();
  const setLocation = useLocationStore((s) => s.setLocation);
  const [uf, setUf] = useState(UFS[0]);
  const [cityQuery, setCityQuery] = useState("");
  const [city, setCity] = useState<string | null>(null);

  const cityList = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    return (CITIES[uf] ?? []).filter(
      (name) => !q || name.toLowerCase().includes(q)
    );
  }, [uf, cityQuery]);

  function pickUf(next: string) {
    setUf(next);
    setCity(null);
    setCityQuery("");
  }

  function finish() {
    if (!city) return;
    setLocation(uf, city);
    router.push("/");
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

        <div className="mb-2 text-sm font-medium">Estado</div>
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
          {UFS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => pickUf(option)}
              className={cn(
                "shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium",
                option === uf
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent"
              )}
            >
              {option}
            </button>
          ))}
        </div>

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

        <div className="mb-5 overflow-hidden rounded-lg border border-border">
          {cityList.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCity(name)}
              className={cn(
                "flex w-full items-center justify-between border-b border-border px-3.5 py-3.5 text-left last:border-b-0",
                city === name && "bg-muted"
              )}
            >
              <div className="text-sm font-medium">{name}</div>
              {city === name && <Check className="size-4 opacity-75" />}
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

        <Button
          onClick={finish}
          disabled={!city}
          className="w-full"
          size="lg"
        >
          Continuar
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Você pode trocar de cidade a qualquer momento no topo do site.
        </p>
      </div>
    </div>
  );
}
