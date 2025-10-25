import { create } from "zustand";
import { fetchApi } from "../lib_fetch";

export type User = { id: string; email: string; fullName?: string; familyId?: string | null };
type AuthState = {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token?: string) => void;
  hydrate: () => Promise<void>;
};

const useAuth = create<AuthState>((set, get) => ({
  currentUser: null,
  loading: false,
  async login(email, password) {
    set({ loading: true });
    const data = await fetchApi<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    get().setUser(data.user, data.token);
    set({ loading: false });
  },
  async register(email, password, fullName) {
    set({ loading: true });
    const data = await fetchApi<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, fullName }),
    });
    get().setUser(data.user, data.token);
    set({ loading: false });
  },
  logout() {
    localStorage.removeItem("fc_jwt");
    set({ currentUser: null, loading: false });
  },
  setUser(user, token) {
    if (token) localStorage.setItem("fc_jwt", token);
    set({ currentUser: user });
  },
  async hydrate() {
    const token = localStorage.getItem("fc_jwt");
    if (!token) {
      set({ currentUser: null });
      return;
    }
    set({ loading: true });
    try {
      const data = await fetchApi<{ user: User }>("/api/auth/me");
      set({ currentUser: data.user, loading: false });
    } catch (error) {
      console.error("hydrate error", error);
      localStorage.removeItem("fc_jwt");
      set({ currentUser: null, loading: false });
    }
  },
}));

export default useAuth;
