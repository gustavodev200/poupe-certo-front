import Link from "next/link";
import { House, ListChecks, ScanBarcode, User } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-background p-3 md:hidden">
      <Button asChild variant="outline" size="icon-lg">
        <Link href="/">
          <House className="size-4.5 opacity-65" />
        </Link>
      </Button>
      <Button asChild variant="outline" size="icon-lg">
        <Link href="/list">
          <ListChecks className="size-4.5 opacity-65" />
        </Link>
      </Button>
      <Button asChild className="flex-1 gap-2">
        <Link href="/scan">
          <ScanBarcode className="size-4.5" />
          Escanear preço
        </Link>
      </Button>
      <Button asChild variant="outline" size="icon-lg">
        <Link href="/profile">
          <User className="size-4.5 opacity-65" />
        </Link>
      </Button>
    </div>
  );
}
