import { create } from "zustand";
import { fetchApi } from "../lib_fetch";
import useAuth from "./auth";
import useFamily from "./family";
import type { User } from "./auth";
import type { Family } from "./family";

export type Invite = { token: string; expiresAt: string; email?: string };
type GeneratedInvite = { invite: Invite; link: string };
type State = {
  myInvites: Invite[];
  sentInvites: Invite[];
  generate: (email?: string) => Promise<GeneratedInvite>;
  accept: (token: string) => Promise<void>;
  fetchMyInvites: () => Promise<void>;
  fetchSentInvites: () => Promise<void>;
  dismiss: (token: string) => void;
  clearDismissed: () => void;
};

const DISMISSED_KEY = "fc_dismissed_invites";
const readDismissed = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveDismissed = (tokens: string[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(tokens));
};

const filterDismissed = (invites: Invite[]): Invite[] => {
  const dismissed = new Set(readDismissed());
  return invites.filter((inv) => !dismissed.has(inv.token));
};

const useInvites = create<State>((set, get) => ({
  myInvites: [],
  sentInvites: [],
  async generate(email) {
    const data = await fetchApi<{ invite: Invite; link: string }>("/api/invites", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    await get().fetchSentInvites();
    return data;
  },
  async accept(token) {
    const data = await fetchApi<{ token: string; family: Family; members: any[]; user: User }>(
      "/api/invites/accept",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    );
    useAuth.getState().setUser(data.user, data.token);
    useFamily.setState({ family: data.family, members: data.members });
    // Remove token from dismissed cache if it was there
    const dismissed = readDismissed().filter((t) => t !== token);
    saveDismissed(dismissed);
    await get().fetchMyInvites();
    await get().fetchSentInvites();
  },
  async fetchMyInvites() {
    const data = await fetchApi<{ invites: Invite[] }>("/api/invites/my");
    set({ myInvites: filterDismissed(data.invites || []) });
  },
  async fetchSentInvites() {
    const data = await fetchApi<{ invites: Invite[] }>("/api/invites/sent");
    set({ sentInvites: data.invites || [] });
  },
  dismiss(token) {
    const dismissed = new Set(readDismissed());
    dismissed.add(token);
    saveDismissed(Array.from(dismissed));
    set((state) => ({ myInvites: state.myInvites.filter((inv) => inv.token !== token) }));
  },
  clearDismissed() {
    saveDismissed([]);
  },
}));

export default useInvites;
