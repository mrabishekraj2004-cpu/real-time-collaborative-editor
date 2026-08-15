"use client";

import { FormEvent } from "react";

interface CreateDocumentComposerProps {
  isOpen: boolean;
  title: string;
  isCreating: boolean;
  onTitleChange: (value: string) => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onCancel: () => void;
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[16px] w-[16px]"
    >
      <path
        d="M7.25 3.75h6.85l3.9 3.9v12.6H7.25V3.75Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      <path
        d="M14 3.95V8h4.05"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CreateDocumentComposer({
  isOpen,
  title,
  isCreating,
  onTitleChange,
  onSubmit,
  onCancel,
}: CreateDocumentComposerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <section className="mt-7 max-w-[640px]">
      <form
        onSubmit={onSubmit}
        className="
          border-y border-[var(--border-subtle)]
          bg-[var(--surface-subtle)]
          px-1 py-4
        "
      >
        <div className="flex items-start gap-3">
          <div
            className="
              mt-[2px]
              flex h-[30px] w-[30px]
              shrink-0 items-center
              justify-center
              rounded-[7px]
              border border-[var(--border-subtle)]
              bg-[var(--surface-muted)]
              text-[var(--text-tertiary)]
            "
          >
            <DocumentIcon />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="
                text-[11px] font-medium
                uppercase tracking-[0.08em]
                text-[var(--text-tertiary)]
              "
            >
              New document
            </p>

            <input
              autoFocus
              value={title}
              onChange={(event) =>
                onTitleChange(
                  event.target.value,
                )
              }
              placeholder="Untitled document"
              className="
                mt-[6px] h-8 w-full
                border-0 bg-transparent
                p-0
                text-[15px] font-[520]
                tracking-[-0.015em]
                text-[var(--text-primary)]
                outline-none
                placeholder:text-[var(--text-disabled)]
              "
            />

            <p
              className="
                mt-[2px]
                text-[11px]
                leading-5
                text-[var(--text-tertiary)]
              "
            >
              You can rename it later.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="
              h-[32px] px-3
              text-[12px] font-medium
              text-[var(--text-secondary)]
              transition-colors duration-150
              hover:text-[var(--text-primary)]
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isCreating}
            className="
              h-[32px]
              rounded-[7px]
              border border-[var(--border-default)]
              bg-[var(--surface)]
              px-[12px]
              text-[12px] font-medium
              text-[var(--text-primary)]
              shadow-[var(--shadow-xs)]
              transition-all duration-150

              hover:border-[var(--border-strong)]
              hover:bg-[var(--surface-muted)]

              active:translate-y-px

              disabled:cursor-not-allowed
              disabled:opacity-45
            "
          >
            {isCreating
              ? "Creating…"
              : "Create"}
          </button>
        </div>
      </form>
    </section>
  );
}