import { create } from "zustand";
import { fetchApi } from "../lib_fetch";

export type Item = {
  id: string;
  title: string;
  quantity?: string;
  category?: string;
  notes?: string;
  status: "pending" | "done";
  createdAt?: string;
};

export type ArchivedList = {
  id: string;
  title: string;
  weekStart: string;
  archivedAt: string | null;
  items: Item[];
};

type State = {
  items: Item[];
  completed: Item[];
  archives: ArchivedList[];
  fetchActive: () => Promise<void>;
  fetchArchives: () => Promise<void>;
  addItem: (i: Partial<Item>) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  resetWeek: () => Promise<void>;
};

const useList = create<State>((set, get) => ({
  items: [],
  completed: [],
  archives: [],
  async fetchActive() {
    try {
      const data = await fetchApi<{ listId: string; items: Item[] }>("/api/lists/active");
      set({
        items: data.items.filter((i) => i.status !== "done"),
        completed: data.items.filter((i) => i.status === "done"),
      });
    } catch (error: any) {
      if (error?.message?.includes("No family")) {
        set({ items: [], completed: [] });
        return;
      }
      throw error;
    }
  },
  async addItem(i) {
    await fetchApi("/api/items", { method: "POST", body: JSON.stringify(i) });
    await get().fetchActive();
    await get().fetchArchives();
  },
  async toggle(id) {
    await fetchApi(`/api/items/${id}/toggle`, { method: "PATCH" });
    await get().fetchActive();
  },
  async fetchArchives() {
    try {
      const data = await fetchApi<{ archives: ArchivedList[] }>("/api/lists/archives");
      set({ archives: data.archives || [] });
    } catch (error: any) {
      if (error?.message?.includes("No family")) {
        set({ archives: [] });
        return;
      }
      throw error;
    }
  },
  async resetWeek() {
    await fetchApi("/api/lists/weekly-reset", { method: "POST" });
    await Promise.all([get().fetchActive(), get().fetchArchives()]);
  },
}));

export default useList;
