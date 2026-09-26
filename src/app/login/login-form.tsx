"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { useSession } from "@/hooks/use-session";
import { safeNextPath, signInWithGoogle } from "@/lib/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const hasError = searchParams.has("error");
  const { session, isPending } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (hasError) {
      toast.error("Não foi possível entrar com o Google. Tente de novo.");
    }
  }, [hasError]);

  useEffect(() => {
    if (!isPending && session) {
      router.replace(next);
    }
  }, [isPending, session, next, router]);

  async function handleGoogle() {
    setIsRedirecting(true);
    const { error } = await signInWithGoogle(next);
    if (error) {
      setIsRedirecting(false);
      toast.error("Não foi possível iniciar o login com o Google.");
    }
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
          <CardDescription>
            Use sua conta Google para acessar o Poupe Certo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogle}
            disabled={isRedirecting || isPending}
          >
            <GoogleIcon />
            {isRedirecting ? "Redirecionando..." : "Continuar com Google"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
