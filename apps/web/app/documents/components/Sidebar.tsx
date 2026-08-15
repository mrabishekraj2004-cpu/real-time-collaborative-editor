"use client";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
  } | null;

  onGoToDocuments: () => void;
  onLogout: () => void;
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
        d="M7.5 3.75h6.6L18.5 8.1v12.15H7.5V3.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 3.9V8h4.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SharedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[17px] w-[17px]"
    >
      <path
        d="M9.1 11.1a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M4.25 18.75c.45-3.1 2.1-4.65 4.85-4.65s4.4 1.55 4.85 4.65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M15.6 7.2a2.6 2.6 0 0 1 0 5.05"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M16.1 14.4c2 .3 3.2 1.65 3.65 4.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[17px] w-[17px]"
    >
      <path
        d="m12 4.1 2.25 4.55 5.02.73-3.63 3.54.86 5-4.5-2.36-4.5 2.36.86-5-3.63-3.54 5.02-.73L12 4.1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[17px] w-[17px]"
    >
      <path
        d="M7.3 8.25h9.4l-.55 11H7.85l-.55-11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M5.5 6.25h13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M9.5 6.25V4.5h5v1.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="12" cy="12" r="1.25" />
      <circle cx="19" cy="12" r="1.25" />
    </svg>
  );
}

function getInitials(name?: string) {
  if (!name) {
    return "U";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

export function Sidebar({
  user,
  onGoToDocuments,
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className="
        hidden min-h-screen
        border-r border-[var(--border-subtle)]
        bg-[var(--surface-subtle)]
        lg:flex lg:flex-col
      "
    >
      <div className="flex h-16 items-center px-[18px]">
        <button
          type="button"
          onClick={onGoToDocuments}
          className="group flex items-center gap-[10px] text-left"
        >
          <span
            className="
              relative flex h-[27px] w-[27px]
              items-center justify-center
              overflow-hidden rounded-[7px]
              border border-[var(--border-default)]
              bg-[var(--text-primary)]
              text-[11px] font-semibold
              tracking-[-0.04em]
              text-[var(--surface)]
              shadow-[var(--shadow-xs)]
              transition-transform duration-150
              group-hover:scale-[1.03]
            "
          >
            C
          </span>

          <span
            className="
              text-[14px] font-[560]
              tracking-[-0.018em]
              text-[var(--text-primary)]
            "
          >
            Collab
          </span>
        </button>
      </div>

      <div className="px-[10px]">
        <p
          className="
            mb-[7px] px-[10px]
            text-[10px] font-medium
            uppercase tracking-[0.11em]
            text-[var(--text-tertiary)]
          "
        >
          Workspace
        </p>

        <nav className="space-y-[2px]">
          <button
            type="button"
            onClick={onGoToDocuments}
            className="
              group relative flex h-[34px] w-full
              items-center gap-[10px]
              px-[10px]
              text-left text-[13px]
              font-medium
              text-[var(--text-primary)]
            "
          >
            <span
              className="
                absolute inset-y-[3px] left-0
                w-[2px] rounded-full
                bg-[var(--accent)]
              "
            />

            <span className="text-[var(--text-secondary)]">
              <DocumentIcon />
            </span>

            <span>Documents</span>
          </button>

          <button
            type="button"
            className="
              flex h-[34px] w-full
              items-center gap-[10px]
              px-[10px]
              text-left text-[13px]
              text-[var(--text-secondary)]
              transition-colors duration-150
              hover:text-[var(--text-primary)]
            "
          >
            <span className="text-[var(--text-tertiary)]">
              <SharedIcon />
            </span>

            <span>Shared</span>
          </button>

          <button
            type="button"
            className="
              flex h-[34px] w-full
              items-center gap-[10px]
              px-[10px]
              text-left text-[13px]
              text-[var(--text-secondary)]
              transition-colors duration-150
              hover:text-[var(--text-primary)]
            "
          >
            <span className="text-[var(--text-tertiary)]">
              <StarIcon />
            </span>

            <span>Favorites</span>
          </button>

          <button
            type="button"
            className="
              flex h-[34px] w-full
              items-center gap-[10px]
              px-[10px]
              text-left text-[13px]
              text-[var(--text-secondary)]
              transition-colors duration-150
              hover:text-[var(--text-primary)]
            "
          >
            <span className="text-[var(--text-tertiary)]">
              <TrashIcon />
            </span>

            <span>Trash</span>
          </button>
        </nav>
      </div>

      <div className="mt-auto px-[10px] pb-[10px]">
        <div className="border-t border-[var(--border-subtle)] pt-[10px]">
          <div className="group flex items-center gap-[10px] px-[8px] py-[8px]">
            <div
              className="
                flex h-[28px] w-[28px]
                shrink-0 items-center justify-center
                rounded-full
                border border-[var(--border-default)]
                bg-[var(--surface-muted)]
                text-[10px] font-semibold
                text-[var(--text-primary)]
              "
            >
              {getInitials(user?.name)}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="
                  truncate text-[12px]
                  font-medium
                  text-[var(--text-primary)]
                "
              >
                {user?.name ?? "Account"}
              </p>

              <p
                className="
                  mt-[1px] truncate
                  text-[10px]
                  text-[var(--text-tertiary)]
                "
              >
                {user?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="
                flex h-7 w-7 items-center
                justify-center
                text-[var(--text-tertiary)]
                opacity-0
                transition-all duration-150
                hover:text-[var(--text-primary)]
                group-hover:opacity-100
                focus-visible:opacity-100
              "
            >
              <MoreIcon />
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="
              mt-[2px] w-full px-[8px]
              py-[6px] text-left
              text-[11px]
              text-[var(--text-tertiary)]
              transition-colors duration-150
              hover:text-[var(--text-primary)]
            "
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}