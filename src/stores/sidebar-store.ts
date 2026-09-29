import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarState = {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

// Uma store por área (app e admin): cada uma lembra se o trilho está
// recolhido. `mobileOpen` é efêmero — gaveta nunca reabre sozinha no reload.
function createSidebarStore(name: string) {
  return create<SidebarState>()(
    persist(
      (set) => ({
        collapsed: false,
        toggle: () => set((s) => ({ collapsed: !s.collapsed })),
        mobileOpen: false,
        setMobileOpen: (mobileOpen) => set({ mobileOpen }),
      }),
      { name, partialize: (s) => ({ collapsed: s.collapsed }) }
    )
  );
}

export const useAppSidebarStore = createSidebarStore("poupe-certo:app-sidebar");
export const useAdminSidebarStore = createSidebarStore("poupe-certo:admin-sidebar");
