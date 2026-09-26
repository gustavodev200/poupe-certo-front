"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useMarkets, useCreateMarket } from "@/hooks/use-markets";
import { useCreatePriceReport } from "@/hooks/use-price-reports";
import { mapApiError } from "@/lib/api/errors";
import {
  createMarketSchema,
  priceReportSchema,
  type CreateMarketInput,
  type PriceReportInput,
} from "@/lib/validations/price-report";
import type { ProductDetail } from "@/lib/api/products";

export function ConfirmPriceForm({ product }: Readonly<{ product: ProductDetail }>) {
  const router = useRouter();
  const { isReady } = useRequireAuth(`/confirm-price?ean=${product.ean}`);
  const [showNewMarket, setShowNewMarket] = useState(false);

  const markets = useMarkets();
  const createMarket = useCreateMarket();
  const createPriceReport = useCreatePriceReport(product.ean);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PriceReportInput>({
    resolver: zodResolver(priceReportSchema),
    defaultValues: { marketId: "", price: "" },
  });

  const {
    register: registerMarket,
    handleSubmit: handleSubmitMarket,
    reset: resetMarketForm,
    formState: { errors: marketErrors },
  } = useForm<CreateMarketInput>({
    resolver: zodResolver(createMarketSchema),
    defaultValues: { name: "" },
  });

  if (!isReady) return null;

  function onSubmit(values: PriceReportInput) {
    createPriceReport.mutate(
      {
        marketId: values.marketId,
        price: Number(values.price.replace(",", ".")),
      },
      {
        onSuccess: (result) => {
          if (result.status === "PENDING_REVIEW") {
            toast.info(
              result.message ??
                "Preço fora do padrão — enviado para revisão."
            );
          } else {
            toast.success(`Preço registrado · +${result.pointsAwarded} pontos`);
          }
          router.push(`/product/${product.ean}`);
        },
        onError: (error) => toast.error(mapApiError(error)),
      }
    );
  }

  function onCreateMarket(values: CreateMarketInput) {
    createMarket.mutate(values, {
      onSuccess: (market) => {
        setValue("marketId", market.id);
        setShowNewMarket(false);
        resetMarketForm();
        toast.success("Mercado cadastrado");
      },
      onError: (error) => toast.error(mapApiError(error)),
    });
  }

  return (
    <div className="mx-auto max-w-md px-6 py-6">
      <h1 className="mb-1 text-lg font-semibold">Produto identificado</h1>
      <div className="mb-5 flex items-center gap-3.5 rounded-xl border border-border p-4">
        <div className="size-14 shrink-0 rounded-lg bg-muted" />
        <div className="min-w-0">
          <div className="text-[15px] font-medium">{product.name}</div>
          <div className="text-sm text-muted-foreground">
            {product.qty} · {product.brand}
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            EAN {product.ean}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label htmlFor="marketId" className="mb-2 block text-sm font-medium">
            Em qual mercado?
          </label>
          <Controller
            control={control}
            name="marketId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="marketId" className="w-full">
                  <SelectValue placeholder="Escolha o mercado" />
                </SelectTrigger>
                <SelectContent>
                  {markets.data?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.marketId && (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.marketId.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowNewMarket((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
          >
            <Plus className="size-3.5" />
            Cadastrar novo mercado
          </button>

          {showNewMarket && (
            <div className="mt-3 flex flex-col gap-2 rounded-lg border border-dashed border-border p-3.5">
              <Input
                placeholder="Nome do mercado"
                {...registerMarket("name")}
              />
              {marketErrors.name && (
                <p className="text-sm text-destructive">
                  {marketErrors.name.message}
                </p>
              )}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={createMarket.isPending}
                onClick={handleSubmitMarket(onCreateMarket)}
              >
                Salvar mercado
              </Button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="price" className="mb-2 block text-sm font-medium">
            Preço na etiqueta
          </label>
          <div className="flex items-baseline gap-2 rounded-lg border border-border px-3.5 py-3">
            <span className="text-lg font-medium text-muted-foreground">
              R$
            </span>
            <input
              id="price"
              {...register("price")}
              placeholder="00,00"
              inputMode="decimal"
              className="min-w-0 flex-1 border-none bg-transparent text-3xl font-semibold tracking-tight tabular-nums outline-none"
            />
          </div>
          {errors.price && (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.price.message}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Valores muito fora da média passam por revisão.
          </p>
        </div>

        <Button type="submit" size="lg" className="mt-1" disabled={createPriceReport.isPending}>
          {createPriceReport.isPending
            ? "Enviando..."
            : "Registrar preço · +2 pontos"}
        </Button>
      </form>
    </div>
  );
}
