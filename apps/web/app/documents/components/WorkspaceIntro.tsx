"use client";

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[14px] w-[14px]"
    >
      <path
        d="M12 3.75c.55 4.65 3.1 7.2 7.75 7.75-4.65.55-7.2 3.1-7.75 7.75-.55-4.65-3.1-7.2-7.75-7.75C8.9 10.95 11.45 8.4 12 3.75Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WorkspaceIntro() {
  return (
    <section className="pb-1">
      <div className="flex items-center gap-[7px] text-[var(--text-tertiary)]">
        <SparkIcon />

        <span className="text-[11px] font-medium uppercase tracking-[0.09em]">
          Workspace
        </span>
      </div>

      <div className="mt-[14px]">
        <h1
          className="
            max-w-2xl
            text-[25px] font-[590]
            leading-[1.2]
            tracking-[-0.035em]
            text-[var(--text-primary)]
            md:text-[28px]
          "
        >
          Your documents
        </h1>

        <p
          className="
            mt-[7px] max-w-[520px]
            text-[13px] leading-[1.65]
            tracking-[-0.005em]
            text-[var(--text-secondary)]
          "
        >
          Continue working on a document or start something new.
        </p>
      </div>
    </section>
  );
}