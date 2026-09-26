import { create } from "zustand";

type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  toggle: () => void;
};

const STORAGE_KEY = "theme";

const getInitialTheme = (): Theme => {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage unavailable: theme still applies for this session
  }
};

const initTheme = () => {
  let stored: Theme | null = null;

  try {
    stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  } catch {
    stored = null;
  }

  const prefersDark =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-color-scheme: dark)").matches;

  applyTheme(
    stored === "light" || stored === "dark"
      ? stored
      : prefersDark
        ? "dark"
        : "light",
  );
};

initTheme();

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  toggle: () => {
    const next = useThemeStore.getState().theme === "dark" ? "light" : "dark";

    applyTheme(next);
    set({ theme: next });
  },
}));
