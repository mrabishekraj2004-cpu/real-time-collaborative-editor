"use client";

import {
  Check,
  Clock3,
  FileText,
  History,
  Loader2,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import * as Y from "yjs";

import {
  yDocToProsemirrorJSON,
} from "y-prosemirror";

import {
  createDocumentSnapshot,
  DocumentSnapshotDetails,
  getDocumentSnapshot,
} from "../../lib/api";

export interface SnapshotRestorePayload {
  snapshot:
    DocumentSnapshotDetails;

  content:
    Record<string, unknown>;
}

interface SnapshotPreviewPanelProps {
  accessToken: string;
  documentId: string;
  snapshotId: string;

  canRestore?: boolean;
  isMainDocument?: boolean;

  onRestore?: (
    payload:
      SnapshotRestorePayload,
  ) =>
    void | Promise<void>;

  onClose: () => void;
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

function extractSnapshotText(
  snapshot:
    DocumentSnapshotDetails,
): string {
  if (
    !snapshot.yjsState ||
    snapshot.yjsState.length ===
      0
  ) {
    return (
      snapshot.content ||
      ""
    );
  }

  const ydoc =
    new Y.Doc();

  try {
    Y.applyUpdate(
      ydoc,
      new Uint8Array(
        snapshot.yjsState,
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
      snapshot.content ||
      ""
    );
  } finally {
    ydoc.destroy();
  }
}

function convertSnapshotToProseMirror(
  snapshot:
    DocumentSnapshotDetails,
): Record<string, unknown> {
  if (
    !snapshot.yjsState ||
    snapshot.yjsState.length ===
      0
  ) {
    return {
      type: "doc",

      content:
        snapshot.content
          ? [
              {
                type:
                  "paragraph",

                content: [
                  {
                    type:
                      "text",

                    text:
                      snapshot.content,
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

  const snapshotDocument =
    new Y.Doc();

  try {
    Y.applyUpdate(
      snapshotDocument,
      new Uint8Array(
        snapshot.yjsState,
      ),
    );

    return (
      yDocToProsemirrorJSON(
        snapshotDocument,
      ) as Record<
        string,
        unknown
      >
    );
  } finally {
    snapshotDocument.destroy();
  }
}

function formatSnapshotDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(date);
}

export function SnapshotPreviewPanel({
  accessToken,
  documentId,
  snapshotId,
  canRestore = false,
  isMainDocument = true,
  onRestore,
  onClose,
}: SnapshotPreviewPanelProps) {
  const [
    snapshot,
    setSnapshot,
  ] =
    useState<
      DocumentSnapshotDetails | null
    >(null);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isRestoring,
    setIsRestoring,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    restoreMessage,
    setRestoreMessage,
  ] =
    useState("");

  useEffect(() => {
    let cancelled =
      false;

    async function loadSnapshot() {
      setIsLoading(
        true,
      );

      setError("");
      setRestoreMessage(
        "",
      );

      try {
        const result =
          await getDocumentSnapshot(
            accessToken,
            documentId,
            snapshotId,
          );

        if (
          cancelled
        ) {
          return;
        }

        setSnapshot(
          result,
        );
      } catch (
        loadError
      ) {
        if (
          cancelled
        ) {
          return;
        }

        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "Unable to load saved version",
        );
      } finally {
        if (
          !cancelled
        ) {
          setIsLoading(
            false,
          );
        }
      }
    }

    void loadSnapshot();

    return () => {
      cancelled =
        true;
    };
  }, [
    accessToken,
    documentId,
    snapshotId,
  ]);

  async function restoreSnapshot() {
    if (
      !snapshot ||
      !onRestore
    ) {
      return;
    }

    if (
      !canRestore
    ) {
      setError(
        "You do not have permission to restore this version.",
      );

      return;
    }

    if (
      !isMainDocument
    ) {
      setError(
        "Open the Main document before restoring a saved version.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Restore "${snapshot.name}"?\n\nYour current Main document will be saved as a safety version before the restore.`,
      );

    if (
      !confirmed
    ) {
      return;
    }

    setIsRestoring(
      true,
    );

    setError("");
    setRestoreMessage(
      "",
    );

    try {
      await createDocumentSnapshot(
        accessToken,
        documentId,
        `Before restore: ${snapshot.name}`,
      );

      const content =
        convertSnapshotToProseMirror(
          snapshot,
        );

      await onRestore({
        snapshot,
        content,
      });

      setRestoreMessage(
        `${snapshot.name} restored successfully`,
      );
    } catch (
      restoreError
    ) {
      setError(
        restoreError instanceof
          Error
          ? restoreError.message
          : "Unable to restore saved version",
      );
    } finally {
      setIsRestoring(
        false,
      );
    }
  }

  const snapshotText =
    snapshot
      ? extractSnapshotText(
          snapshot,
        )
      : "";

  const restoreAvailable =
    Boolean(
      onRestore,
    ) &&
    canRestore &&
    isMainDocument;

  return (
    <div
      className="
        border-t
        border-[var(--border-subtle)]
        bg-[var(--surface)]
      "
    >
      <div
        className="
          flex items-start
          justify-between gap-4
          border-b
          border-[var(--border-subtle)]
          px-4 py-3
        "
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText
              size={16}
              strokeWidth={1.8}
              className="shrink-0 text-[var(--accent)]"
            />

            <h3 className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
              Saved version preview
            </h3>
          </div>

          <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
            Preview historical content before restoring it.
          </p>
        </div>

        <button
          type="button"
          title="Close preview"
          aria-label="Close preview"
          onClick={
            onClose
          }
          className="
            flex h-8 w-8
            shrink-0 items-center
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

      {isLoading && (
        <div className="flex min-h-[180px] items-center justify-center gap-2 text-[11px] text-[var(--text-tertiary)]">
          <Loader2
            size={15}
            className="animate-spin"
          />

          Loading saved version…
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="px-4 pt-4">
            <div
              className="
                rounded-[9px]
                border
                border-[var(--danger)]/25
                bg-[var(--danger-soft)]
                px-3 py-2.5
                text-[10px]
                text-[var(--danger)]
              "
            >
              {error}
            </div>
          </div>
        )}

      {!isLoading &&
        restoreMessage && (
          <div className="px-4 pt-4">
            <div
              className="
                flex items-center
                gap-2
                rounded-[9px]
                border
                border-[var(--border-subtle)]
                bg-[var(--surface-subtle)]
                px-3 py-2.5
                text-[10px]
                text-[var(--success)]
              "
            >
              <Check
                size={14}
                strokeWidth={1.9}
              />

              {
                restoreMessage
              }
            </div>
          </div>
        )}

      {!isLoading &&
        snapshot && (
          <>
            <div
              className="
                flex flex-wrap
                items-center
                justify-between
                gap-3
                border-b
                border-[var(--border-subtle)]
                px-4 py-3
              "
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
                  {
                    snapshot.name
                  }
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] text-[var(--text-tertiary)]">
                  <Clock3
                    size={11}
                    strokeWidth={1.7}
                  />

                  <span>
                    {formatSnapshotDate(
                      snapshot.createdAt,
                    )}
                  </span>

                  <span>
                    ·
                  </span>

                  <span>
                    {
                      snapshot
                        .createdBy
                        .name
                    }
                  </span>
                </div>
              </div>

              <span
                className="
                  rounded-full
                  border
                  border-[var(--border-default)]
                  bg-[var(--surface-subtle)]
                  px-2 py-1
                  text-[9px]
                  font-medium
                  text-[var(--text-tertiary)]
                "
              >
                Read only
              </span>
            </div>

            <div className="max-h-[500px] overflow-y-auto px-4 py-4">
              <div
                className="
                  min-h-[220px]
                  rounded-[10px]
                  border
                  border-[var(--border-subtle)]
                  bg-[var(--surface-subtle)]
                  px-6 py-5
                "
              >
                {snapshotText ? (
                  <div
                    className="
                      whitespace-pre-wrap
                      text-[14px]
                      leading-7
                      text-[var(--text-primary)]
                    "
                  >
                    {
                      snapshotText
                    }
                  </div>
                ) : (
                  <div className="flex min-h-[180px] items-center justify-center text-[11px] text-[var(--text-tertiary)]">
                    This saved version is empty.
                  </div>
                )}
              </div>
            </div>

            <div
              className="
                flex flex-wrap
                items-center
                justify-between
                gap-3
                border-t
                border-[var(--border-subtle)]
                px-4 py-3
              "
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <ShieldCheck
                  size={15}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-[var(--text-tertiary)]"
                />

                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-[var(--text-primary)]">
                    Safe restore
                  </p>

                  <p className="mt-0.5 text-[9px] leading-4 text-[var(--text-tertiary)]">
                    Your current Main document is saved before restoration.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  !restoreAvailable ||
                  isRestoring
                }
                title={
                  !isMainDocument
                    ? "Open the Main document before restoring"
                    : !canRestore
                      ? "You do not have permission to restore"
                      : !onRestore
                        ? "Restore is not connected yet"
                        : "Restore this saved version"
                }
                onClick={() => {
                  void restoreSnapshot();
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
                {isRestoring ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <RotateCcw
                    size={14}
                    strokeWidth={1.8}
                  />
                )}

                {isRestoring
                  ? "Restoring..."
                  : "Restore this version"}
              </button>
            </div>

            {!isMainDocument && (
              <div
                className="
                  flex items-start
                  gap-2.5
                  border-t
                  border-[var(--border-subtle)]
                  bg-[var(--surface-subtle)]
                  px-4 py-3
                "
              >
                <History
                  size={14}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-[var(--text-tertiary)]"
                />

                <p className="text-[10px] leading-5 text-[var(--text-tertiary)]">
                  Switch to the Main document before restoring a saved version.
                </p>
              </div>
            )}
          </>
        )}
    </div>
  );
}