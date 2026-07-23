"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Read the theme from <html data-theme>, set by the no-FOUC inline script. */
function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** <html data-theme> is the source of truth; re-render whenever it changes. */
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, () => "dark" as const);

  const apply = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* private mode — ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    apply(readTheme() === "light" ? "dark" : "light");
  }, [apply]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  // Safe fallback if a component renders outside the provider.
  if (!ctx) return { theme: "dark", toggleTheme: () => {}, setTheme: () => {} };
  return ctx;
}
