"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemePreference =
  | "system"
  | "light"
  | "dark";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (
    theme: ThemePreference,
  ) => void;
}

const ThemeContext =
  createContext<
    ThemeContextValue | undefined
  >(undefined);

const THEME_STORAGE_KEY =
  "collab-docs-theme";

interface ThemeProviderProps {
  children: ReactNode;
}

function getSystemTheme():
  | "light"
  | "dark" {
  if (
    typeof window === "undefined"
  ) {
    return "dark";
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches
    ? "dark"
    : "light";
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] =
    useState<ThemePreference>(
      "system",
    );

  const [
    resolvedTheme,
    setResolvedTheme,
  ] = useState<
    "light" | "dark"
  >("dark");

  const applyTheme =
    useCallback(
      (
        preference:
          ThemePreference,
      ) => {
        const nextTheme =
          preference === "system"
            ? getSystemTheme()
            : preference;

        document.documentElement.setAttribute(
          "data-theme",
          nextTheme,
        );

        setResolvedTheme(
          nextTheme,
        );
      },
      [],
    );

  useEffect(() => {
    const savedTheme =
      window.localStorage.getItem(
        THEME_STORAGE_KEY,
      ) as ThemePreference | null;

    const initialTheme =
      savedTheme &&
      [
        "system",
        "light",
        "dark",
      ].includes(savedTheme)
        ? savedTheme
        : "system";

    setThemeState(
      initialTheme,
    );

    applyTheme(
      initialTheme,
    );
  }, [applyTheme]);

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)",
      );

    function handleChange() {
      if (
        theme === "system"
      ) {
        applyTheme(
          "system",
        );
      }
    }

    mediaQuery.addEventListener(
      "change",
      handleChange,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleChange,
      );
    };
  }, [theme, applyTheme]);

  const setTheme =
    useCallback(
      (
        nextTheme:
          ThemePreference,
      ) => {
        setThemeState(
          nextTheme,
        );

        window.localStorage.setItem(
          THEME_STORAGE_KEY,
          nextTheme,
        );

        applyTheme(
          nextTheme,
        );
      },
      [applyTheme],
    );

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [
      theme,
      resolvedTheme,
      setTheme,
    ],
  );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(
      ThemeContext,
    );

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider",
    );
  }

  return context;
}