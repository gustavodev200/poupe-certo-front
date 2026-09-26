import { create } from "zustand";
import { persist } from "zustand/middleware";

type AdminSidebarState = {
  collapsed: boolean;
  toggle: () => void;
};

export const useAdminSidebarStore = create<AdminSidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    { name: "poupe-certo:admin-sidebar" },
  ),
);
