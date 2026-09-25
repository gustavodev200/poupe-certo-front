"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/perfil";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setIsSubmitting(true);
    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message ?? "Não foi possível entrar.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 p-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Logo />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta do Poupe Certo.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link
                href={`/signup?next=${encodeURIComponent(next)}`}
                className="text-foreground underline"
              >
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
