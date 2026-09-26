"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileActionBar } from "@/components/mobile-action-bar";
import { useLocationHydrated, useLocationStore } from "@/stores/location-store";
import { useMyProfile } from "@/hooks/use-profile-location";
import { useSession } from "@/hooks/use-session";

export default function ShellLayout({ children }: LayoutProps<"/">) {
  const router = useRouter();
  const city = useLocationStore((s) => s.city);
  const hasHydrated = useLocationHydrated();
  const { session, isPending: sessionPending } = useSession();
  const profile = useMyProfile();

  // Anônimo nunca chama /users/me (ver useMyProfile) — a query fica
  // desabilitada e nunca resolve isSuccess/isError, então só espera a
  // sessão carregar. Logado: espera o perfil (fonte de verdade pra `city`,
  // pode corrigir um valor antigo salvo só no localStorage).
  const profileSettled = profile.isSuccess || profile.isError;
  const ready = hasHydrated && !sessionPending && (!session || profileSettled);
  const hasCity = session && profile.isSuccess ? !!profile.data.city : !!city;

  useEffect(() => {
    if (ready && !hasCity) {
      router.replace("/onboarding");
    }
  }, [ready, hasCity, router]);

  if (!ready || !hasCity) {
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
