"use client";

import {
  ArrowRight,
  Check,
  FileText,
  GitBranch,
  Loader2,
  Move,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import * as Y from "yjs";

import {
  DocumentBranch,
  DocumentRecord,
  DocumentSnapshot,
  getDocumentBranch,
  getDocumentSnapshot,
} from "../../lib/api";

import {
  compareDocuments,
  DiffParagraph,
  DocumentDiff,
} from "../../lib/documentDiff";

interface DocumentComparePanelProps {
  accessToken: string;
  document: DocumentRecord;
  snapshots: DocumentSnapshot[];
  branches: DocumentBranch[];
  onClose: () => void;
}

type CompareTargetType =
  | "document"
  | "snapshot"
  | "branch";

interface CompareTarget {
  key: string;
  type: CompareTargetType;
  id: string | null;
  label: string;
}

interface LoadedTarget {
  key: string;
  label: string;
  content: string;
}

function readYjsNode(
  node:
    | Y.AbstractType<unknown>
    | unknown,
): string {
  if (
    node instanceof
    Y.XmlText
  ) {
    return node.toString();
  }

  if (
    node instanceof
      Y.XmlElement ||
    node instanceof
      Y.XmlFragment
  ) {
    return node
      .toArray()
      .map(
        (child) =>
          readYjsNode(
            child,
          ),
      )
      .join("");
  }

  return "";
}

function extractTextFromYjsState(
  yjsState:
    | number[]
    | null
    | undefined,
  fallbackContent: string,
): string {
  if (
    !yjsState ||
    yjsState.length ===
      0
  ) {
    return fallbackContent;
  }

  const ydoc =
    new Y.Doc();

  try {
    Y.applyUpdate(
      ydoc,
      new Uint8Array(
        yjsState,
      ),
    );

    const fragment =
      ydoc.getXmlFragment(
        "prosemirror",
      );

    const blocks =
      fragment.toArray();

    const text =
      blocks
        .map(
          (block) =>
            readYjsNode(
              block,
            ).trim(),
        )
        .filter(Boolean)
        .join("\n\n");

    return (
      text ||
      fallbackContent
    );
  } finally {
    ydoc.destroy();
  }
}

function buildTargets(
  snapshots: DocumentSnapshot[],
  branches: DocumentBranch[],
): CompareTarget[] {
  return [
    {
      key: "document",
      type: "document",
      id: null,
      label: "Main document",
    },

    ...branches.map(
      (branch) => ({
        key: `branch:${branch.id}`,
        type: "branch" as const,
        id: branch.id,
        label: branch.name,
      }),
    ),

    ...snapshots.map(
      (snapshot) => ({
        key: `snapshot:${snapshot.id}`,
        type: "snapshot" as const,
        id: snapshot.id,
        label: snapshot.name,
      }),
    ),
  ];
}

function getChangeLabel(
  kind: DiffParagraph["kind"],
) {
  switch (kind) {
    case "added":
      return "Added";

    case "removed":
      return "Removed";

    case "modified":
      return "Modified";

    case "moved":
      return "Moved";

    default:
      return "Unchanged";
  }
}

function getChangeIcon(
  kind: DiffParagraph["kind"],
) {
  switch (kind) {
    case "added":
      return (
        <Plus
          size={14}
          strokeWidth={1.8}
        />
      );

    case "removed":
      return (
        <Trash2
          size={14}
          strokeWidth={1.8}
        />
      );

    case "modified":
      return (
        <RefreshCw
          size={14}
          strokeWidth={1.8}
        />
      );

    case "moved":
      return (
        <Move
          size={14}
          strokeWidth={1.8}
        />
      );

    default:
      return (
        <Check
          size={14}
          strokeWidth={1.8}
        />
      );
  }
}

export function DocumentComparePanel({
  accessToken,
  document,
  snapshots,
  branches,
  onClose,
}: DocumentComparePanelProps) {
  const targets =
    useMemo(
      () =>
        buildTargets(
          snapshots,
          branches,
        ),
      [
        snapshots,
        branches,
      ],
    );

  const defaultSecondTarget =
    branches[0]
      ? `branch:${branches[0].id}`
      : snapshots[0]
        ? `snapshot:${snapshots[0].id}`
        : "document";

  const [
    beforeKey,
    setBeforeKey,
  ] =
    useState(
      "document",
    );

  const [
    afterKey,
    setAfterKey,
  ] =
    useState(
      defaultSecondTarget,
    );

  const [
    result,
    setResult,
  ] =
    useState<DocumentDiff | null>(
      null,
    );

  const [
    beforeLabel,
    setBeforeLabel,
  ] =
    useState("");

  const [
    afterLabel,
    setAfterLabel,
  ] =
    useState("");

  const [
    isComparing,
    setIsComparing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const selectClass = `
    h-9
    min-w-0
    rounded-[8px]
    border
    border-[var(--border-default)]
    bg-[var(--surface)]
    px-3
    text-[12px]
    font-medium
    text-[var(--text-primary)]
    outline-none
    transition-colors

    hover:border-[var(--border-strong)]

    focus:border-[var(--border-focus)]

    disabled:cursor-not-allowed
    disabled:opacity-50
  `;

  async function loadTarget(
    key: string,
  ): Promise<LoadedTarget> {
    const target =
      targets.find(
        (item) =>
          item.key ===
          key,
      );

    if (!target) {
      throw new Error(
        "Comparison target was not found",
      );
    }

    if (
      target.type ===
      "document"
    ) {
      return {
        key:
          target.key,

        label:
          target.label,

        content:
          extractTextFromYjsState(
            document.yjsState,
            document.content ??
              "",
          ),
      };
    }

    if (
      target.type ===
      "branch" &&
      target.id
    ) {
      const branch =
        await getDocumentBranch(
          accessToken,
          document.id,
          target.id,
        );

      return {
        key:
          target.key,

        label:
          target.label,

        content:
          extractTextFromYjsState(
            branch.yjsState,
            branch.content ??
              "",
          ),
      };
    }

    if (
      target.type ===
      "snapshot" &&
      target.id
    ) {
      const snapshot =
        await getDocumentSnapshot(
          accessToken,
          document.id,
          target.id,
        );

      return {
        key:
          target.key,

        label:
          target.label,

        content:
          extractTextFromYjsState(
            snapshot.yjsState,
            snapshot.content ??
              "",
          ),
      };
    }

    throw new Error(
      "Unable to load comparison target",
    );
  }

  async function runComparison() {
    if (
      beforeKey ===
      afterKey
    ) {
      setError(
        "Choose two different versions to compare",
      );

      setResult(
        null,
      );

      return;
    }

    setIsComparing(
      true,
    );

    setError("");

    try {
      const [
        before,
        after,
      ] =
        await Promise.all([
          loadTarget(
            beforeKey,
          ),

          loadTarget(
            afterKey,
          ),
        ]);

      const comparison =
        compareDocuments(
          before.content,
          after.content,
        );

      setBeforeLabel(
        before.label,
      );

      setAfterLabel(
        after.label,
      );

      setResult(
        comparison,
      );
    } catch (comparisonError) {
      setError(
        comparisonError instanceof Error
          ? comparisonError.message
          : "Unable to compare documents",
      );

      setResult(
        null,
      );
    } finally {
      setIsComparing(
        false,
      );
    }
  }

  useEffect(() => {
    if (
      beforeKey !==
      afterKey
    ) {
      void runComparison();
    }
    // Run once when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleChanges =
    result?.paragraphs.filter(
      (paragraph) =>
        paragraph.kind !==
        "unchanged",
    ) ?? [];

  return (
    <div
      className="
        border-t
        border-[var(--border-subtle)]
        bg-[var(--surface)]
      "
    >
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Search
              size={16}
              strokeWidth={1.8}
              className="text-[var(--accent)]"
            />

            <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
              Compare changes
            </h3>
          </div>

          <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
            Compare the main document, saved versions, or branches.
          </p>
        </div>

        <button
          type="button"
          title="Close compare"
          aria-label="Close compare"
          onClick={
            onClose
          }
          className="
            flex h-8 w-8
            items-center
            justify-center
            rounded-[7px]
            text-[var(--text-tertiary)]
            transition-colors

            hover:bg-[var(--surface-muted)]
            hover:text-[var(--text-primary)]
          "
        >
          <X
            size={16}
            strokeWidth={1.8}
          />
        </button>
      </div>

      <div className="border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
          <label className="min-w-0">
            <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Before
            </span>

            <select
              value={
                beforeKey
              }
              disabled={
                isComparing
              }
              onChange={(event) =>
                setBeforeKey(
                  event.target.value,
                )
              }
              className={`${selectClass} w-full`}
            >
              <optgroup label="Document">
                <option value="document">
                  Main document
                </option>
              </optgroup>

              {branches.length >
                0 && (
                <optgroup label="Branches">
                  {branches.map(
                    (branch) => (
                      <option
                        key={
                          branch.id
                        }
                        value={`branch:${branch.id}`}
                      >
                        {branch.name}
                      </option>
                    ),
                  )}
                </optgroup>
              )}

              {snapshots.length >
                0 && (
                <optgroup label="Saved versions">
                  {snapshots.map(
                    (snapshot) => (
                      <option
                        key={
                          snapshot.id
                        }
                        value={`snapshot:${snapshot.id}`}
                      >
                        {snapshot.name}
                      </option>
                    ),
                  )}
                </optgroup>
              )}
            </select>
          </label>

          <div className="hidden h-9 items-center justify-center text-[var(--text-tertiary)] md:flex">
            <ArrowRight
              size={16}
              strokeWidth={1.7}
            />
          </div>

          <label className="min-w-0">
            <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              After
            </span>

            <select
              value={
                afterKey
              }
              disabled={
                isComparing
              }
              onChange={(event) =>
                setAfterKey(
                  event.target.value,
                )
              }
              className={`${selectClass} w-full`}
            >
              <optgroup label="Document">
                <option value="document">
                  Main document
                </option>
              </optgroup>

              {branches.length >
                0 && (
                <optgroup label="Branches">
                  {branches.map(
                    (branch) => (
                      <option
                        key={
                          branch.id
                        }
                        value={`branch:${branch.id}`}
                      >
                        {branch.name}
                      </option>
                    ),
                  )}
                </optgroup>
              )}

              {snapshots.length >
                0 && (
                <optgroup label="Saved versions">
                  {snapshots.map(
                    (snapshot) => (
                      <option
                        key={
                          snapshot.id
                        }
                        value={`snapshot:${snapshot.id}`}
                      >
                        {snapshot.name}
                      </option>
                    ),
                  )}
                </optgroup>
              )}
            </select>
          </label>

          <button
            type="button"
            disabled={
              isComparing ||
              beforeKey ===
                afterKey
            }
            onClick={() => {
              void runComparison();
            }}
            className="
              inline-flex h-9
              items-center
              justify-center
              gap-2
              rounded-[8px]
              bg-[var(--accent)]
              px-4
              text-[11px]
              font-semibold
              text-[var(--accent-foreground)]
              transition-all

              hover:bg-[var(--accent-hover)]

              active:scale-[0.98]

              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {isComparing ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Search
                size={14}
                strokeWidth={1.8}
              />
            )}

            {isComparing
              ? "Comparing..."
              : "Compare"}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-[10px] text-[var(--danger)]">
            {error}
          </p>
        )}
      </div>

      {result && (
        <>
          <div className="border-b border-[var(--border-subtle)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                <FileText
                  size={12}
                  strokeWidth={1.8}
                />

                {beforeLabel}
              </span>

              <ArrowRight
                size={13}
                strokeWidth={1.7}
                className="text-[var(--text-tertiary)]"
              />

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                <GitBranch
                  size={12}
                  strokeWidth={1.8}
                />

                {afterLabel}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-[8px] border border-[var(--border-subtle)] px-2.5 py-1.5">
                <span className="text-[9px] text-[var(--text-tertiary)]">
                  Modified
                </span>

                <p className="mt-0.5 text-[12px] font-semibold text-[var(--text-primary)]">
                  {
                    result
                      .summary
                      .modified
                  }
                </p>
              </div>

              <div className="rounded-[8px] border border-[var(--border-subtle)] px-2.5 py-1.5">
                <span className="text-[9px] text-[var(--text-tertiary)]">
                  Moved
                </span>

                <p className="mt-0.5 text-[12px] font-semibold text-[var(--text-primary)]">
                  {
                    result
                      .summary
                      .moved
                  }
                </p>
              </div>

              <div className="rounded-[8px] border border-[var(--border-subtle)] px-2.5 py-1.5">
                <span className="text-[9px] text-[var(--text-tertiary)]">
                  Added
                </span>

                <p className="mt-0.5 text-[12px] font-semibold text-[var(--text-primary)]">
                  {
                    result
                      .summary
                      .added
                  }
                </p>
              </div>

              <div className="rounded-[8px] border border-[var(--border-subtle)] px-2.5 py-1.5">
                <span className="text-[9px] text-[var(--text-tertiary)]">
                  Removed
                </span>

                <p className="mt-0.5 text-[12px] font-semibold text-[var(--text-primary)]">
                  {
                    result
                      .summary
                      .removed
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[430px] overflow-y-auto px-4 py-3">
            {visibleChanges.length ===
            0 ? (
              <div className="flex min-h-[120px] flex-col items-center justify-center text-center">
                <Check
                  size={22}
                  strokeWidth={1.6}
                  className="text-[var(--text-tertiary)]"
                />

                <p className="mt-2 text-[12px] font-medium text-[var(--text-primary)]">
                  No meaningful changes
                </p>

                <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                  These two versions contain the same paragraphs.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleChanges.map(
                  (
                    paragraph,
                    index,
                  ) => (
                    <article
                      key={`${paragraph.id}-${index}`}
                      className="
                        rounded-[10px]
                        border
                        border-[var(--border-subtle)]
                        bg-[var(--surface-subtle)]
                        p-3
                      "
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="
                              flex h-7 w-7
                              items-center
                              justify-center
                              rounded-[7px]
                              bg-[var(--surface-muted)]
                              text-[var(--text-secondary)]
                            "
                          >
                            {getChangeIcon(
                              paragraph.kind,
                            )}
                          </span>

                          <div>
                            <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                              {getChangeLabel(
                                paragraph.kind,
                              )}
                            </p>

                            {paragraph.kind ===
                              "moved" && (
                              <p className="mt-0.5 text-[9px] text-[var(--text-tertiary)]">
                                Paragraph{" "}
                                {(paragraph.beforeIndex ??
                                  0) +
                                  1}{" "}
                                →{" "}
                                {(paragraph.afterIndex ??
                                  0) +
                                  1}
                              </p>
                            )}
                          </div>
                        </div>

                        {paragraph.kind ===
                          "modified" && (
                          <span className="text-[9px] text-[var(--text-tertiary)]">
                            {Math.round(
                              paragraph.similarity *
                                100,
                            )}
                            % similar
                          </span>
                        )}
                      </div>

                      {paragraph.before && (
                        <div className="mt-3">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--text-tertiary)]">
                            Before
                          </span>

                          <p className="mt-1 rounded-[7px] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-[11px] leading-5 text-[var(--text-secondary)]">
                            {
                              paragraph.before
                            }
                          </p>
                        </div>
                      )}

                      {paragraph.after && (
                        <div className="mt-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[var(--text-tertiary)]">
                            After
                          </span>

                          <p className="mt-1 rounded-[7px] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-[11px] leading-5 text-[var(--text-primary)]">
                            {
                              paragraph.after
                            }
                          </p>
                        </div>
                      )}
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}