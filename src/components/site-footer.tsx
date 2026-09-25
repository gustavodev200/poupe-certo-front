"use client";

import Link from "next/link";
import { ScanBarcode } from "lucide-react";

import { FOOTER_COLUMNS } from "@/lib/mock/community";
import { useLocationStore } from "@/stores/location-store";

export function SiteFooter() {
  const { uf, city } = useLocationStore();
  const cityLabel = city ? `${city}, ${uf}` : "Poupe Certo";

  return (
    <footer className="mt-auto bg-primary pt-9 pb-6 text-primary-foreground/65">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-7 px-6 sm:grid-cols-3 md:grid-cols-4">
        <div className="col-span-2 sm:col-span-3 md:col-span-1">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-background/10">
              <ScanBarcode className="size-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-primary-foreground">
              Poupe Certo
            </span>
          </div>
          <p className="max-w-64 text-sm leading-relaxed">
            Quem compra junto, poupa junto. Preços de mercado conferidos pela
            comunidade.
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="mb-2.5 text-xs font-semibold text-primary-foreground">
              {col.title}
            </div>
            <div className="flex flex-col gap-2">
              {col.links.map((link) => (
                <Link key={link} href="#" className="text-sm no-underline">
                  {link}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-between gap-4 border-t border-primary-foreground/10 px-6 pt-4.5 text-xs">
        <div>© 2026 Poupe Certo · {cityLabel}</div>
        <div className="flex gap-4">
          <Link href="/login" className="no-underline">
            Entrar
          </Link>
          <Link href="/signup" className="no-underline">
            Criar conta
          </Link>
        </div>
      </div>
    </footer>
  );
}
