"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateMarket } from "@/hooks/use-markets";
import { mapApiError } from "@/lib/api/errors";
import type { Market } from "@/lib/api/markets";
import { createMarketSchema } from "@/lib/validations/price-report";
import { useLocationStore } from "@/stores/location-store";

// Cadastro rápido de mercado dentro de outro formulário. Estado local de
// propósito (sem um segundo useForm): o `reset()` do react-hook-form chama
// `form.reset()` nativo no <form> mais próximo — que é o formulário pai — e
// apagava tudo que a pessoa já tinha preenchido nele.
export function NewMarketInline({
  onCreated,
}: Readonly<{ onCreated: (market: Market) => void }>) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createMarket = useCreateMarket();
  const uf = useLocationStore((s) => s.uf);
  const city = useLocationStore((s) => s.city);

  function save() {
    if (!city || !uf) {
      setError("Escolha sua cidade antes de cadastrar um mercado.");
      return;
    }
    const parsed = createMarketSchema.shape.name.safeParse(name.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Nome inválido");
      return;
    }
    setError(null);
    // Mercado nasce na cidade atual — é por ela que a lista é filtrada.
    createMarket.mutate(
      { name: parsed.data, city, uf },
      {
        onSuccess: (market) => {
          onCreated(market);
          setName("");
          setOpen(false);
          toast.success("Mercado cadastrado");
        },
        onError: (err) => toast.error(mapApiError(err)),
      }
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
      >
        <Plus className="size-3.5" />
        Cadastrar novo mercado
      </button>

      {open && (
        <div className="mt-1 flex flex-col gap-2 rounded-lg border border-dashed border-border p-3.5">
          <Input
            placeholder="Nome do mercado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // Enter aqui não pode submeter o formulário pai.
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
          />
          {city && uf && (
            <p className="text-xs text-muted-foreground">
              Em {city} · {uf}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={createMarket.isPending}
            onClick={save}
          >
            {createMarket.isPending ? "Salvando..." : "Salvar mercado"}
          </Button>
        </div>
      )}
    </>
  );
}
