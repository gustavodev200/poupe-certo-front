"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MarketCombobox } from "@/components/market-combobox";
import { ProductImage } from "@/components/product-image";
import { NewMarketInline } from "@/components/new-market-inline";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useMarkets } from "@/hooks/use-markets";
import { useCreatePriceReport } from "@/hooks/use-price-reports";
import { mapApiError } from "@/lib/api/errors";
import {
  priceReportSchema,
  type PriceReportInput,
} from "@/lib/validations/price-report";
import { maskBRL, parseBRL } from "@/lib/money";
import type { ProductDetail } from "@/lib/api/products";

export function ConfirmPriceForm({ product }: Readonly<{ product: ProductDetail }>) {
  const router = useRouter();
  const { isReady } = useRequireAuth(`/confirm-price?ean=${product.ean}`);

  const markets = useMarkets();
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

  const priceField = register("price");

  if (!isReady) return null;

  function onSubmit(values: PriceReportInput) {
    createPriceReport.mutate(
      {
        marketId: values.marketId,
        price: parseBRL(values.price),
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

  return (
    <div className="mx-auto max-w-md px-6 py-6">
      <h1 className="mb-1 text-lg font-semibold">Produto identificado</h1>
      <div className="mb-5 flex items-center gap-3.5 rounded-xl border border-border p-4">
        <ProductImage
          src={product.imageUrl}
          alt={`Foto de ${product.name}`}
          sizes="56px"
          className="size-14"
          iconClassName="size-5"
        />
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
              <MarketCombobox
                id="marketId"
                markets={markets.data ?? []}
                value={field.value}
                onChange={field.onChange}
                placeholder="Escolha o mercado"
              />
            )}
          />
          {errors.marketId && (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.marketId.message}
            </p>
          )}
          <NewMarketInline
            onCreated={(market) =>
              setValue("marketId", market.id, { shouldValidate: true })
            }
          />
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
              {...priceField}
              onChange={(e) => {
                e.target.value = maskBRL(e.target.value);
                void priceField.onChange(e);
              }}
              placeholder="0,00"
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
