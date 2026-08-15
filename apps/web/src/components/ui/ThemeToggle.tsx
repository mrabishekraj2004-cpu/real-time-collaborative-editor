"use client";

import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const {
    theme,
    setTheme,
  } = useTheme();

  return (
    <div className="inline-flex items-center rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
      <button
        type="button"
        onClick={() =>
          setTheme("light")
        }
        title="Light theme"
        aria-label="Use light theme"
        className={[
          "flex h-7 w-7 items-center justify-center rounded-[6px] text-[13px] transition-all",
          theme === "light"
            ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
        ].join(" ")}
      >
        ☀
      </button>

      <button
        type="button"
        onClick={() =>
          setTheme("system")
        }
        title="System theme"
        aria-label="Use system theme"
        className={[
          "flex h-7 w-7 items-center justify-center rounded-[6px] text-[12px] transition-all",
          theme === "system"
            ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
        ].join(" ")}
      >
        ◐
      </button>

      <button
        type="button"
        onClick={() =>
          setTheme("dark")
        }
        title="Dark theme"
        aria-label="Use dark theme"
        className={[
          "flex h-7 w-7 items-center justify-center rounded-[6px] text-[13px] transition-all",
          theme === "dark"
            ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
        ].join(" ")}
      >
        ☾
      </button>
    </div>
  );
}