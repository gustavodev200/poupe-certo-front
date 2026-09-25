import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo size="md" />
      <p className="max-w-md text-muted-foreground">
        Compare preços de mercado com quem compra perto de você.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/signup">Criar conta</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    </main>
  );
}
