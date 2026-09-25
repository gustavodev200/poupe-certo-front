import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type LocationState = {
  uf: string | null;
  city: string | null;
  setLocation: (uf: string, city: string) => void;
  clear: () => void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      uf: null,
      city: null,
      setLocation: (uf, city) => set({ uf, city }),
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
