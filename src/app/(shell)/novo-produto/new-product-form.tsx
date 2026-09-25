"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
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
import { useRequireAuth } from "@/hooks/use-require-auth";
import { CATEGORIES } from "@/lib/mock/catalog";
import {
  newProductSchema,
  type NewProductInput,
} from "@/lib/validations/price-report";

export function NewProductForm({ ean }: Readonly<{ ean: string }>) {
  const router = useRouter();
  const { isReady } = useRequireAuth(`/novo-produto?ean=${ean}`);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewProductInput>({
    resolver: zodResolver(newProductSchema),
    defaultValues: { name: "", brand: "", qty: "", category: "" },
  });

  if (!isReady) return null;

  function onSubmit() {
    router.push("/");
    toast.success("Produto enviado para aprovação");
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
              <Select value={field.value} onValueChange={field.onChange}>
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
        <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Toque para usar a câmera (opcional)
        </div>
        <Button type="submit" size="lg" className="mt-1">
          Enviar para aprovação · +5 pontos
        </Button>
      </form>
    </div>
  );
}
