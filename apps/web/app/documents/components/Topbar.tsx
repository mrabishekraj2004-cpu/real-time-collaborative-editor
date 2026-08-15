"use client";

import { ThemeToggle } from "../../../src/components/ui/ThemeToggle";

interface TopbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateDocument: () => void;
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[15px] w-[15px]"
    >
      <circle
        cx="11"
        cy="11"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[15px] w-[15px]"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommandIcon() {
  return (
    <span
      aria-hidden="true"
      className="
        hidden h-[21px] min-w-[28px]
        items-center justify-center
        rounded-[5px]
        border border-[var(--border-subtle)]
        bg-[var(--surface-subtle)]
        px-[5px]
        text-[10px] font-medium
        text-[var(--text-tertiary)]
        sm:flex
      "
    >
      ⌘K
    </span>
  );
}

export function Topbar({
  search,
  onSearchChange,
  onCreateDocument,
}: TopbarProps) {
  return (
    <header
      className="
        sticky top-0 z-20
        h-16
        border-b border-[var(--border-subtle)]
        bg-[color-mix(in_srgb,var(--background)_90%,transparent)]
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto flex h-full
          w-full max-w-[1180px]
          items-center justify-between
          gap-5 px-5 md:px-8
        "
      >
        <div className="min-w-0 flex-1">
          <div className="group relative max-w-[360px]">
            <span
              className="
                pointer-events-none
                absolute left-[11px] top-1/2
                -translate-y-1/2
                text-[var(--text-tertiary)]
                transition-colors duration-150
                group-focus-within:text-[var(--text-secondary)]
              "
            >
              <SearchIcon />
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                onSearchChange(
                  event.target.value,
                )
              }
              placeholder="Search"
              className="
                h-[34px] w-full
                rounded-[8px]
                border border-[var(--border-subtle)]
                bg-[var(--surface-subtle)]
                pl-[34px] pr-[52px]
                text-[13px]
                tracking-[-0.01em]
                text-[var(--text-primary)]
                outline-none
                transition-all duration-150

                placeholder:text-[var(--text-tertiary)]

                hover:border-[var(--border-default)]
                hover:bg-[var(--surface-muted)]

                focus:border-[var(--border-focus)]
                focus:bg-[var(--surface)]
                focus:shadow-[0_0_0_3px_var(--focus-ring)]
              "
            />

            <div
              className="
                pointer-events-none
                absolute right-[7px] top-1/2
                -translate-y-1/2
              "
            >
              <CommandIcon />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />

          <div className="mx-1 hidden h-[20px] w-px bg-[var(--border-subtle)] sm:block" />

          <button
            type="button"
            onClick={onCreateDocument}
            className="
              group inline-flex h-[34px]
              items-center gap-[7px]
              rounded-[8px]
              border border-[var(--border-default)]
              bg-[var(--surface)]
              px-[11px]
              text-[12px] font-medium
              tracking-[-0.01em]
              text-[var(--text-primary)]
              shadow-[var(--shadow-xs)]
              transition-all duration-150

              hover:border-[var(--border-strong)]
              hover:bg-[var(--surface-muted)]

              active:translate-y-px
            "
          >
            <span
              className="
                text-[var(--text-tertiary)]
                transition-colors duration-150
                group-hover:text-[var(--text-primary)]
              "
            >
              <PlusIcon />
            </span>

            <span>New</span>
          </button>
        </div>
      </div>
    </header>
  );
}