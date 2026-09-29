"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Info, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarketCombobox } from "@/components/market-combobox";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCreateProduct } from "@/hooks/use-create-product";
import { useEanLookup } from "@/hooks/use-ean-lookup";
import { useMarkets, useCreateMarket } from "@/hooks/use-markets";
import { mapApiError } from "@/lib/api/errors";
import { CATEGORIES } from "@/lib/categories";
import { pickPrefill } from "@/lib/ean-prefill";
import {
  createMarketSchema,
  newProductSchema,
  type CreateMarketInput,
  type NewProductInput,
} from "@/lib/validations/price-report";

export function NewProductForm({ ean }: Readonly<{ ean: string }>) {
  const router = useRouter();
  const { isReady } = useRequireAuth(`/new-product?ean=${ean}`);
  const createProduct = useCreateProduct();
  const [showNewMarket, setShowNewMarket] = useState(false);

  const lookup = useEanLookup(ean, isReady);
  const suggestion = lookup.data?.found ? lookup.data : undefined;

  const markets = useMarkets();
  const createMarket = useCreateMarket();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<NewProductInput>({
    resolver: zodResolver(newProductSchema),
    defaultValues: {
      name: "",
      brand: "",
      qty: "",
      category: undefined,
      marketId: "",
      price: "",
    },
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

  // Aplica a sugestão uma vez, quando chega — só em campos intocados.
  useEffect(() => {
    if (!lookup.data) return;
    const prefill = pickPrefill(lookup.data, getValues(), dirtyFields);
    for (const [field, value] of Object.entries(prefill)) {
      setValue(field as keyof typeof prefill, value, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup.data]);

  if (!isReady) return null;

  function onSubmit(values: NewProductInput) {
    createProduct.mutate(
      {
        ean,
        name: values.name,
        brand: values.brand,
        qty: values.qty,
        category: values.category,
        marketId: values.marketId,
        price: Number(values.price.replace(",", ".")),
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Produto enviado para aprovação · +${result.pointsAwarded} pontos`
          );
          router.push("/");
        },
        onError: (error) => {
          if (error instanceof AxiosError && error.response?.status === 409) {
            setError("name", {
              message: "Esse EAN já foi cadastrado por outra pessoa.",
            });
            toast.error("Produto já cadastrado — confira o preço dele.");
            return;
          }
          toast.error(mapApiError(error));
        },
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
      <h1 className="mb-3.5 text-lg font-semibold">Cadastrar produto</h1>

      <div className="mb-5 flex gap-2.5 rounded-lg border border-border p-3.5">
        <Info className="mt-0.5 size-4 shrink-0 opacity-60" />
        <div>
          <div className="mb-0.5 text-sm font-medium">
            Esse código ainda não está na base
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            EAN <span className="font-mono">{ean}</span> — preencha os dados e
            ele passará por aprovação.
          </p>
          {lookup.isLoading && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Buscando dados do produto…
            </p>
          )}
          {suggestion && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="size-3.5" />
              Preenchemos com dados do Open Food Facts — confira antes de enviar.
            </p>
          )}
          {(lookup.isError || (lookup.data && !lookup.data.found)) && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Não encontramos dados desse código — preencha manualmente.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome do produto</Label>
          <Input
            id="name"
            placeholder="ex: Feijão Preto Camil"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" placeholder="ex: Camil" {...register("brand")} />
          {errors.brand && (
            <p className="text-sm text-destructive">{errors.brand.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="qty">Quantidade</Label>
          <Input
            id="qty"
            placeholder="ex: 1kg, 500ml"
            {...register("qty")}
          />
          {errors.qty && (
            <p className="text-sm text-destructive">{errors.qty.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Escolha uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-sm text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="marketId">Em qual mercado?</Label>
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
            <p className="text-sm text-destructive">
              {errors.marketId.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowNewMarket((v) => !v)}
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
          >
            <Plus className="size-3.5" />
            Cadastrar novo mercado
          </button>

          {showNewMarket && (
            <div className="mt-1 flex flex-col gap-2 rounded-lg border border-dashed border-border p-3.5">
              <Input placeholder="Nome do mercado" {...registerMarket("name")} />
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Preço na etiqueta</Label>
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
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
        {suggestion?.imageUrl && (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Image
              src={suggestion.imageUrl}
              alt={`Foto de ${suggestion.name ?? "produto"}`}
              width={72}
              height={72}
              unoptimized
              className="size-18 shrink-0 rounded-md bg-muted object-contain"
            />
            <p className="text-sm text-muted-foreground">
              Esta foto será salva junto com o produto.
            </p>
          </div>
        )}
        {createProduct.isError &&
          !(
            createProduct.error instanceof AxiosError &&
            createProduct.error.response?.status === 409
          ) && (
            <p className="text-sm text-destructive">
              {mapApiError(createProduct.error)}
            </p>
          )}
        <Button type="submit" size="lg" className="mt-1" disabled={createProduct.isPending}>
          {createProduct.isPending
            ? "Enviando..."
            : "Enviar para aprovação · +5 pontos"}
        </Button>
        <Link
          href={`/confirm-price?ean=${ean}`}
          className="text-center text-sm text-muted-foreground underline underline-offset-4"
        >
          Na verdade já existe — confirmar preço
        </Link>
      </form>
    </div>
  );
}
