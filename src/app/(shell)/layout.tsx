"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileActionBar } from "@/components/mobile-action-bar";
import { useLocationHydrated, useLocationStore } from "@/stores/location-store";

export default function ShellLayout({ children }: LayoutProps<"/">) {
  const router = useRouter();
  const city = useLocationStore((s) => s.city);
  const hasHydrated = useLocationHydrated();

  useEffect(() => {
    if (hasHydrated && !city) {
      router.replace("/onboarding");
    }
  }, [hasHydrated, city, router]);

  if (!hasHydrated || !city) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <SiteHeader />
      <main className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <div className="min-w-0">{children}</div>
      </main>
      <SiteFooter />
      <MobileActionBar />
    </div>
  );
}
