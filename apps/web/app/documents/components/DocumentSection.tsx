"use client";

import { DocumentRecord } from "../../../src/lib/api";

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / 60000,
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !==
        now.getFullYear()
          ? "numeric"
          : undefined,
    },
  );
}

function roleLabel(
  role: DocumentRecord["role"],
) {
  if (role === "EDITOR") {
    return "Can edit";
  }

  if (role === "VIEWER") {
    return "View only";
  }

  return "Owner";
}

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[17px] w-[17px]"
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

      <path
        d="M9.6 11.4h5.25M9.6 14.4h5.25"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[15px] w-[15px]"
    >
      <path
        d="M8.5 5.5 15 12l-6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface DocumentSectionProps {
  title: string;
  subtitle: string;
  documents: DocumentRecord[];
  emptyText: string;
  divider?: boolean;
  onOpen: (
    documentId: string,
  ) => void;
}

export function DocumentSection({
  title,
  subtitle,
  documents,
  emptyText,
  divider = false,
  onOpen,
}: DocumentSectionProps) {
  return (
    <section
      className={[
        "mt-10",
        divider
          ? "border-t border-[var(--border-subtle)] pt-9"
          : "",
      ].join(" ")}
    >
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-[15px] font-[590] tracking-[-0.018em] text-[var(--text-primary)]">
            {title}
          </h2>

          <p className="mt-[4px] text-[12px] text-[var(--text-tertiary)]">
            {subtitle}
          </p>
        </div>

        <span className="text-[11px] tabular-nums text-[var(--text-tertiary)]">
          {documents.length}
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="mt-4 border-t border-[var(--border-subtle)] py-8">
          <p className="text-[13px] text-[var(--text-tertiary)]">
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="mt-4 border-y border-[var(--border-subtle)]">
          {documents.map(
            (document, index) => (
              <button
                key={document.id}
                type="button"
                onClick={() =>
                  onOpen(document.id)
                }
                className={[
                  "group flex w-full items-center gap-3 px-2 py-[13px] text-left",
                  "transition-colors duration-150",
                  "hover:bg-[var(--surface-subtle)]",
                  index !==
                  documents.length - 1
                    ? "border-b border-[var(--border-subtle)]"
                    : "",
                ].join(" ")}
              >
                <div
                  className="
                    flex h-[30px] w-[30px]
                    shrink-0 items-center
                    justify-center
                    rounded-[7px]
                    border border-[var(--border-subtle)]
                    bg-[var(--surface-subtle)]
                    text-[var(--text-tertiary)]
                    transition-all duration-150
                    group-hover:border-[var(--border-default)]
                    group-hover:bg-[var(--surface-muted)]
                    group-hover:text-[var(--text-secondary)]
                  "
                >
                  <DocumentIcon />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      truncate text-[13px]
                      font-[520]
                      tracking-[-0.012em]
                      text-[var(--text-primary)]
                    "
                  >
                    {document.title}
                  </p>

                  <p
                    className="
                      mt-[3px]
                      truncate text-[11px]
                      text-[var(--text-tertiary)]
                    "
                  >
                    {roleLabel(
                      document.role,
                    )}

                    <span className="px-[5px]">
                      ·
                    </span>

                    Updated{" "}
                    {formatUpdatedAt(
                      document.updatedAt,
                    )}
                  </p>
                </div>

                <span
                  className="
                    mr-[3px]
                    flex h-7 w-7
                    shrink-0 items-center
                    justify-center
                    text-[var(--text-tertiary)]
                    opacity-0
                    transition-all duration-150
                    group-hover:translate-x-[2px]
                    group-hover:text-[var(--text-secondary)]
                    group-hover:opacity-100
                  "
                >
                  <ArrowIcon />
                </span>
              </button>
            ),
          )}
        </div>
      )}
    </section>
  );
}