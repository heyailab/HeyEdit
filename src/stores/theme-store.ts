import { useEffect } from "react";
import { useConfigStore } from "./config-store";

type ThemeMode = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === "system" ? getSystemTheme() : mode;
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

/** Hook to sync theme with DOM. Call once at app root. */
export function useThemeSync() {
  const theme = useConfigStore((s) => s.config.theme);

  useEffect(() => {
    applyTheme(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);
}

export function useResolvedTheme(): "light" | "dark" {
  const theme = useConfigStore((s) => s.config.theme);
  return theme === "system" ? getSystemTheme() : theme;
}
