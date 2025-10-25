import { create } from "zustand";

type Theme = "light" | "dark";

const readStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("fc_theme");
  return stored === "dark" ? "dark" : "light";
};

const applyTheme = (theme: Theme) => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem("fc_theme", theme);
  }
};

type ThemeState = { theme: Theme; toggle: () => void; setTheme: (theme: Theme) => void };

export const useTheme = create<ThemeState>((set, get) => ({
  theme: readStoredTheme(),
  toggle() {
    const next = get().theme === "light" ? "dark" : "light";
    applyTheme(next);
    set({ theme: next });
  },
  setTheme(theme) {
    applyTheme(theme);
    set({ theme });
  }
}));

applyTheme(readStoredTheme());
