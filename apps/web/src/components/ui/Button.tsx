"use client";

import {
  ButtonHTMLAttributes,
  forwardRef,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

type ButtonSize =
  | "sm"
  | "md"
  | "lg";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary:
    "border border-transparent bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow-sm)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]",

  secondary:
    "border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]",

  ghost:
    "border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",

  danger:
    "border border-transparent bg-[var(--danger)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--danger-hover)]",
};

const sizeClasses: Record<
  ButtonSize,
  string
> = {
  sm: "h-8 px-3 text-sm rounded-[var(--radius-sm)]",
  md: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
  lg: "h-11 px-5 text-sm rounded-[var(--radius-md)]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    isLoading = false,
    disabled,
    className = "",
    children,
    ...props
  },
  ref,
) {
  const isDisabled =
    disabled || isLoading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        "transition-premium inline-flex items-center justify-center gap-2 font-medium",
        "focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:translate-y-px",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}

      <span>
        {isLoading
          ? "Please wait"
          : children}
      </span>
    </button>
  );
});