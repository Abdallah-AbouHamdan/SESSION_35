import { create } from "zustand";
import { fetchApi } from "../lib_fetch";
import useAuth from "./auth";
import type { User } from "./auth";

export type Family = { id: string; name: string };

type State = {
  family: Family | null;
  members: Array<{ id: string; email: string; full_name?: string; role?: string }>;
  getMine: () => Promise<void>;
  createFamily: (name: string) => Promise<void>;
  leave: () => Promise<void>;
};

const useFamily = create<State>((set) => ({
  family: null,
  members: [],
  async getMine() {
    const data = await fetchApi<{ family: Family; members: any[] }>("/api/families/me");
    set({ family: data.family, members: data.members });
  },
  async createFamily(name) {
    const data = await fetchApi<{ family: Family; members: any[]; token: string; user: User }>("/api/families", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    useAuth.getState().setUser(data.user, data.token);
    set({ family: data.family, members: data.members });
  },
  async leave() {
    await fetchApi("/api/families/leave", { method: "POST" });
    set({ family: null, members: [] });
  },
}));

export default useFamily;
