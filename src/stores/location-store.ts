import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT_CITIES = 5;

export type RecentCity = { uf: string; city: string };

type LocationState = {
  uf: string | null;
  city: string | null;
  recentCities: RecentCity[];
  setLocation: (uf: string, city: string) => void;
  clear: () => void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      uf: null,
      city: null,
      recentCities: [],
      setLocation: (uf, city) =>
        set((state) => ({
          uf,
          city,
          recentCities: [
            { uf, city },
            ...state.recentCities.filter(
              (r) => !(r.uf === uf && r.city === city)
            ),
          ].slice(0, MAX_RECENT_CITIES),
        })),
      clear: () => set({ uf: null, city: null }),
    }),
    { name: "poupe-certo:location" }
  )
);

export function useLocationHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useLocationStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    const id = setTimeout(() => {
      if (useLocationStore.persist.hasHydrated()) setHydrated(true);
    }, 0);
    return () => {
      unsubscribe();
      clearTimeout(id);
    };
  }, []);

  return hydrated;
}
