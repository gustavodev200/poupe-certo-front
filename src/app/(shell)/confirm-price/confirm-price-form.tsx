"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  priceReportSchema,
  type PriceReportInput,
} from "@/lib/validations/price-report";
import type { Product } from "@/lib/mock/catalog";

export function ConfirmPriceForm({ product }: Readonly<{ product: Product }>) {
  const router = useRouter();
  const { isReady } = useRequireAuth(`/confirm-price?ean=${product.ean}`);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PriceReportInput>({
    resolver: zodResolver(priceReportSchema),
    defaultValues: { market: product.offers[0]?.market ?? "", price: "" },
  });

  if (!isReady) return null;

  function onSubmit() {
    router.push("/");
    toast.success("Preço registrado · +2 pontos");
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
          <label htmlFor="market" className="mb-2 block text-sm font-medium">
            Em qual mercado?
          </label>
          <Controller
            control={control}
            name="market"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="market" className="w-full">
                  <SelectValue placeholder="Escolha o mercado" />
                </SelectTrigger>
                <SelectContent>
                  {product.offers.map((o) => (
                    <SelectItem key={o.market} value={o.market}>
                      {o.market}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.market && (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.market.message}
            </p>
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
              className="flex-1 border-none bg-transparent text-3xl font-semibold tracking-tight tabular-nums outline-none"
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

        <Button type="submit" size="lg" className="mt-1">
          Registrar preço · +2 pontos
        </Button>
      </form>
    </div>
  );
}
