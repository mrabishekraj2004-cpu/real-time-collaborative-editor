"use client";

import {
  Check,
  GitBranch,
  Loader2,
  Merge,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import * as Y from "yjs";

import {
  yDocToProsemirrorJSON,
} from "y-prosemirror";

import {
  createDocumentSnapshot,
  DocumentBranch,
  DocumentBranchDetails,
  getDocumentBranch,
} from "../../lib/api";

export interface BranchMergePayload {
  branch:
    DocumentBranchDetails;

  content:
    Record<string, unknown>;
}

interface DocumentMergePanelProps {
  accessToken: string;
  documentId: string;
  branches: DocumentBranch[];
  activeBranchId?: string | null;

  canMerge?: boolean;

  onMerge?: (
    payload:
      BranchMergePayload,
  ) =>
    void | Promise<void>;

  onClose: () => void;
}

function convertBranchToProseMirror(
  branch:
    DocumentBranchDetails,
): Record<string, unknown> {
  if (
    !branch.yjsState ||
    branch.yjsState.length ===
      0
  ) {
    return {
      type: "doc",

      content:
        branch.content
          ? [
              {
                type:
                  "paragraph",

                content: [
                  {
                    type:
                      "text",

                    text:
                      branch.content,
                  },
                ],
              },
            ]
          : [
              {
                type:
                  "paragraph",
              },
            ],
    };
  }

  const branchDocument =
    new Y.Doc();

  try {
    Y.applyUpdate(
      branchDocument,
      new Uint8Array(
        branch.yjsState,
      ),
    );

    return (
      yDocToProsemirrorJSON(
        branchDocument,
      ) as Record<
        string,
        unknown
      >
    );
  } finally {
    branchDocument.destroy();
  }
}

export function DocumentMergePanel({
  accessToken,
  documentId,
  branches,
  activeBranchId = null,
  canMerge = false,
  onMerge,
  onClose,
}: DocumentMergePanelProps) {
  const availableBranches =
    useMemo(
      () =>
        branches.filter(
          (branch) =>
            branch.id !==
            activeBranchId,
        ),
      [
        branches,
        activeBranchId,
      ],
    );

  const [
    selectedBranchId,
    setSelectedBranchId,
  ] =
    useState(
      availableBranches[0]
        ?.id ?? "",
    );

  const [
    isMerging,
    setIsMerging,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const selectedBranch =
    availableBranches.find(
      (branch) =>
        branch.id ===
        selectedBranchId,
    ) ?? null;

  const isMainDocument =
    !activeBranchId;

  const mergeAvailable =
    Boolean(
      onMerge,
    ) &&
    canMerge &&
    isMainDocument &&
    Boolean(
      selectedBranchId,
    );

  async function mergeBranch() {
    if (
      !isMainDocument
    ) {
      setError(
        "Open the Main document before merging a branch.",
      );

      return;
    }

    if (
      !canMerge
    ) {
      setError(
        "You do not have permission to merge into this document.",
      );

      return;
    }

    if (
      !selectedBranchId ||
      !selectedBranch
    ) {
      setError(
        "Choose a branch to merge.",
      );

      return;
    }

    if (
      !onMerge
    ) {
      setError(
        "Merge is not connected.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Merge "${selectedBranch.name}" into the Main document?\n\nA safety version will be saved before the merge.`,
      );

    if (!confirmed) {
      return;
    }

    setIsMerging(
      true,
    );

    setError("");
    setSuccessMessage("");

    try {
      await createDocumentSnapshot(
        accessToken,
        documentId,
        `Before merge: ${selectedBranch.name}`,
      );

      const branch =
        await getDocumentBranch(
          accessToken,
          documentId,
          selectedBranchId,
        );

      const content =
        convertBranchToProseMirror(
          branch,
        );

      await onMerge({
        branch,
        content,
      });

      setSuccessMessage(
        `${branch.name} merged into Main document`,
      );
    } catch (mergeError) {
      setError(
        mergeError instanceof Error
          ? mergeError.message
          : "Unable to merge branch",
      );
    } finally {
      setIsMerging(
        false,
      );
    }
  }

  const selectClass = `
    h-9
    w-full
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
            <Merge
              size={16}
              strokeWidth={1.8}
              className="text-[var(--accent)]"
            />

            <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
              Merge branch
            </h3>
          </div>

          <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
            Replace the Main document content with the selected branch state.
          </p>
        </div>

        <button
          type="button"
          title="Close merge"
          aria-label="Close merge"
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

      {!isMainDocument && (
        <div
          className="
            border-b
            border-[var(--border-subtle)]
            px-4 py-3
          "
        >
          <div
            className="
              flex items-start gap-2.5
              rounded-[9px]
              border
              border-[var(--border-default)]
              bg-[var(--surface-subtle)]
              p-3
            "
          >
            <GitBranch
              size={16}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-[var(--text-tertiary)]"
            />

            <div>
              <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                Main document required
              </p>

              <p className="mt-1 text-[10px] leading-5 text-[var(--text-tertiary)]">
                Switch to the Main document before performing a merge.
                This prevents accidentally merging one branch into another.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="min-w-0">
            <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Source branch
            </span>

            <select
              value={
                selectedBranchId
              }
              disabled={
                isMerging ||
                !isMainDocument
              }
              onChange={(event) => {
                setSelectedBranchId(
                  event.target.value,
                );

                setError("");
                setSuccessMessage("");
              }}
              className={
                selectClass
              }
            >
              {availableBranches.length ===
              0 ? (
                <option value="">
                  No branches available
                </option>
              ) : (
                availableBranches.map(
                  (branch) => (
                    <option
                      key={
                        branch.id
                      }
                      value={
                        branch.id
                      }
                    >
                      {branch.name}
                    </option>
                  ),
                )
              )}
            </select>
          </label>

          <button
            type="button"
            disabled={
              isMerging ||
              !mergeAvailable
            }
            onClick={() => {
              void mergeBranch();
            }}
            className="
              mt-auto
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
            {isMerging ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Merge
                size={14}
                strokeWidth={1.8}
              />
            )}

            {isMerging
              ? "Merging..."
              : "Merge into Main"}
          </button>
        </div>

        <div
          className="
            mt-4
            flex items-start gap-2.5
            rounded-[9px]
            border
            border-[var(--border-subtle)]
            bg-[var(--surface-subtle)]
            p-3
          "
        >
          <ShieldCheck
            size={16}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0 text-[var(--text-tertiary)]"
          />

          <div>
            <p className="text-[11px] font-medium text-[var(--text-primary)]">
              Safe merge
            </p>

            <p className="mt-1 text-[10px] leading-5 text-[var(--text-tertiary)]">
              A saved version of the Main document is created automatically
              before branch content replaces the current Main document content.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-[10px] text-[var(--danger)]">
            {error}
          </p>
        )}

        {successMessage && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--success)]">
            <Check
              size={14}
              strokeWidth={1.9}
            />

            {
              successMessage
            }
          </div>
        )}
      </div>
    </div>
  );
}