"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Read the theme the no-FOUC script already applied to <html>. */
function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Sync React state with whatever the inline script set, after mount.
  useEffect(() => {
    setThemeState(readInitialTheme());
  }, []);

  const apply = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* private mode — ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    apply(readInitialTheme() === "light" ? "dark" : "light");
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
