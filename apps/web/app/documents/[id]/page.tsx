"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { RichTextEditor } from "../../../src/components/editor/RichTextEditor";
import { ShareDialog } from "../../../src/components/share/ShareDialog";
import { ThemeToggle } from "../../../src/components/ui/ThemeToggle";
import { useAuth } from "../../../src/hooks/useAuth";

import {
  DocumentBranch,
  DocumentRecord,
  getDocument,
  getDocumentBranches,
} from "../../../src/lib/api";

import {
  useCollaboration,
} from "../../../src/lib/collaboration/useCollaboration";

import {
  getYDoc,
} from "../../../src/lib/collaboration/yjs";

interface OnlineUser {
  socketId: string;
  id: string;
  name: string;
  color: string;
}

function generateUserColor(
  userId: string,
): string {
  const colors = [
    "#7C75FF",
    "#45A995",
    "#DC646A",
    "#A06BD5",
    "#D9824E",
    "#5B9DD9",
    "#82A95C",
    "#B1785A",
  ];

  let hash = 0;

  for (
    let index = 0;
    index < userId.length;
    index += 1
  ) {
    hash =
      userId.charCodeAt(
        index,
      ) +
      ((hash << 5) -
        hash);
  }

  return colors[
    Math.abs(hash) %
      colors.length
  ];
}

function getRoleLabel(
  role:
    DocumentRecord["role"],
): string {
  if (
    role ===
    "OWNER"
  ) {
    return "Owner";
  }

  if (
    role ===
    "EDITOR"
  ) {
    return "Can edit";
  }

  if (
    role ===
    "VIEWER"
  ) {
    return "View only";
  }

  return "Unknown access";
}

function getInitials(
  name: string,
): string {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length ===
    0
  ) {
    return "U";
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[16px] w-[16px]"
    >
      <path
        d="m14.5 6-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[14px] w-[14px]"
    >
      <circle
        cx="18"
        cy="5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <circle
        cx="6"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <circle
        cx="18"
        cy="19"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <path
        d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[13px] w-[13px]"
    >
      <path
        d="M7.4 18.1h9.2a4.15 4.15 0 0 0 .4-8.28A5.4 5.4 0 0 0 6.7 8.35a4.9 4.9 0 0 0 .7 9.75Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="m9.6 13.3 1.6 1.6 3.3-3.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[13px] w-[13px]"
    >
      <circle
        cx="6"
        cy="5"
        r="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <circle
        cx="18"
        cy="7"
        r="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <circle
        cx="6"
        cy="19"
        r="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <path
        d="M6 7v10M8 10h4a6 6 0 0 0 6-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DocumentEditorPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading:
      isAuthLoading,
  } = useAuth();

  const [
    document,
    setDocument,
  ] =
    useState<
      DocumentRecord | null
    >(null);

  const [
    pageError,
    setPageError,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  useEffect(() => {
    if (
      isAuthLoading
    ) {
      return;
    }

    if (
      !isAuthenticated ||
      !accessToken
    ) {
      router.replace(
        "/",
      );

      return;
    }

    const authenticatedAccessToken =
      accessToken;

    async function loadDocument() {
      try {
        setPageError(
          "",
        );

        const result =
          await getDocument(
            authenticatedAccessToken,
            params.id,
          );

        setDocument(
          result,
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to load document",
        );
      } finally {
        setIsLoading(
          false,
        );
      }
    }

    void loadDocument();
  }, [
    accessToken,
    isAuthenticated,
    isAuthLoading,
    params.id,
    router,
  ]);

  if (
    isAuthLoading ||
    isLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex items-center gap-3 text-[13px] text-[var(--text-secondary)]">
          <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[var(--accent)]" />

          Loading document
        </div>
      </main>
    );
  }

  if (
    pageError ||
    !document ||
    !user ||
    !accessToken
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
        <div className="w-full max-w-[420px] text-center">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Collab
          </p>

          <h1 className="mt-4 text-[24px] font-[590] tracking-[-0.03em] text-[var(--text-primary)]">
            Unable to open document
          </h1>

          <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">
            {pageError ||
              "Document not found"}
          </p>

          <Link
            href="/documents"
            className="
              mt-7 inline-flex
              h-[34px]
              items-center gap-2
              rounded-[7px]
              border
              border-[var(--border-default)]
              bg-[var(--surface)]
              px-3
              text-[12px]
              font-medium
              text-[var(--text-primary)]
              shadow-[var(--shadow-xs)]
              transition-all
              duration-150

              hover:border-[var(--border-strong)]
              hover:bg-[var(--surface-muted)]

              active:translate-y-px
            "
          >
            <BackIcon />

            Back to documents
          </Link>
        </div>
      </main>
    );
  }

  return (
    <CollaborativeDocumentEditor
      document={
        document
      }
      user={
        user
      }
      accessToken={
        accessToken
      }
    />
  );
}

interface CollaborativeDocumentEditorProps {
  document:
    DocumentRecord;

  accessToken:
    string;

  user: {
    id: string;
    name: string;
    email: string;
  };
}

function CollaborativeDocumentEditor({
  document,
  user,
  accessToken,
}: CollaborativeDocumentEditorProps) {
  const [
    branches,
    setBranches,
  ] =
    useState<
      DocumentBranch[]
    >([]);

  const [
    activeBranchId,
    setActiveBranchId,
  ] =
    useState("");

  const [
    isLoadingBranches,
    setIsLoadingBranches,
  ] =
    useState(true);

  const [
    branchError,
    setBranchError,
  ] =
    useState("");

  const [
    onlineUsers,
    setOnlineUsers,
  ] =
    useState<
      OnlineUser[]
    >([]);

  const [
    isShareDialogOpen,
    setIsShareDialogOpen,
  ] =
    useState(false);

  const activeBranch =
    useMemo(
      () =>
        branches.find(
          (branch) =>
            branch.id ===
            activeBranchId,
        ) ?? null,
      [
        branches,
        activeBranchId,
      ],
    );

  const branchId =
    activeBranchId ||
    null;

  const ydoc =
    useMemo(
      () =>
        getYDoc(
          document.id,
          branchId,
        ),
      [
        document.id,
        branchId,
      ],
    );

  const canEdit =
    document.role ===
      "OWNER" ||
    document.role ===
      "EDITOR";

  const canManageSharing =
    document.role ===
    "OWNER";

  const collaborationUser =
    useMemo(
      () => ({
        id:
          user.id,

        name:
          user.name,

        color:
          generateUserColor(
            user.id,
          ),
      }),
      [
        user.id,
        user.name,
      ],
    );

  const handleOnlineUsersChange =
    useCallback(
      (
        users:
          OnlineUser[],
      ) => {
        setOnlineUsers(
          users,
        );
      },
      [],
    );

  const loadBranches =
    useCallback(
      async () => {
        setIsLoadingBranches(
          true,
        );

        setBranchError(
          "",
        );

        try {
          const result =
            await getDocumentBranches(
              accessToken,
              document.id,
            );

          setBranches(
            result,
          );

          return result;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load branches";

          setBranchError(
            message,
          );

          throw error;
        } finally {
          setIsLoadingBranches(
            false,
          );
        }
      },
      [
        accessToken,
        document.id,
      ],
    );

  useEffect(() => {
    void loadBranches();
  }, [
    loadBranches,
  ]);

  useEffect(() => {
    setOnlineUsers(
      [],
    );
  }, [
    branchId,
  ]);

  const openBranch =
    useCallback(
      async (
        selectedBranchId:
          string,
      ) => {
        let currentBranches =
          branches;

        const alreadyLoaded =
          currentBranches.some(
            (branch) =>
              branch.id ===
              selectedBranchId,
          );

        if (
          !alreadyLoaded
        ) {
          currentBranches =
            await loadBranches();
        }

        const branchExists =
          currentBranches.some(
            (branch) =>
              branch.id ===
              selectedBranchId,
          );

        if (
          !branchExists
        ) {
          throw new Error(
            "Branch was not found",
          );
        }

        setActiveBranchId(
          selectedBranchId,
        );
      },
      [
        branches,
        loadBranches,
      ],
    );

  const openMainDocument =
    useCallback(
      () => {
        setActiveBranchId(
          "",
        );
      },
      [],
    );

  const {
    awareness,
  } = useCollaboration({
    documentId:
      document.id,

    branchId,

    ydoc,

    user:
      collaborationUser,

    onOnlineUsersChange:
      handleOnlineUsersChange,
  });

  const displayTitle =
    activeBranch
      ? `${document.title} · ${activeBranch.name}`
      : document.title;

  const updatedAt =
    activeBranch
      ? activeBranch.updatedAt
      : document.updatedAt;

  const editorKey =
    branchId
      ? `branch-${branchId}`
      : `document-${document.id}`;

  return (
    <>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
        <header
          className="
            sticky top-0 z-30
            flex h-[56px]
            items-center
            border-b
            border-[var(--border-subtle)]
            bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]
            px-3
            backdrop-blur-xl
            md:px-4
          "
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              href="/documents"
              title="Back to documents"
              className="
                flex h-[32px]
                w-[32px]
                shrink-0
                items-center
                justify-center
                rounded-[7px]
                text-[var(--text-tertiary)]
                transition-colors

                hover:bg-[var(--surface-muted)]
                hover:text-[var(--text-primary)]
              "
            >
              <BackIcon />
            </Link>

            <div className="h-[18px] w-px bg-[var(--border-subtle)]" />

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h1
                  className="
                    max-w-[240px]
                    truncate
                    text-[13px]
                    font-[560]
                    tracking-[-0.015em]
                    text-[var(--text-primary)]
                    sm:max-w-[420px]
                  "
                >
                  {displayTitle}
                </h1>

                <span
                  className="
                    hidden
                    text-[10px]
                    text-[var(--text-tertiary)]
                    sm:inline
                  "
                >
                  {getRoleLabel(
                    document.role,
                  )}
                </span>
              </div>

              <div className="mt-[2px] flex items-center gap-[5px] text-[10px] text-[var(--text-tertiary)]">
                {activeBranch ? (
                  <BranchIcon />
                ) : (
                  <CloudIcon />
                )}

                <span>
                  {activeBranch
                    ? `Branch · ${activeBranch.name} · Live sync`
                    : "Main document · Live sync"}
                </span>
              </div>
            </div>

            <div className="ml-2 hidden h-[22px] w-px bg-[var(--border-subtle)] sm:block" />

            <div className="hidden items-center gap-2 sm:flex">
              <select
                aria-label="Document branch"
                value={
                  activeBranchId
                }
                disabled={
                  isLoadingBranches
                }
                onChange={(event) => {
                  const value =
                    event.target
                      .value;

                  if (!value) {
                    openMainDocument();
                    return;
                  }

                  void openBranch(
                    value,
                  );
                }}
                className="
                  h-[30px]
                  max-w-[190px]
                  rounded-[7px]
                  border
                  border-[var(--border-default)]
                  bg-[var(--surface)]
                  px-2
                  text-[11px]
                  font-medium
                  text-[var(--text-primary)]
                  outline-none

                  hover:border-[var(--border-strong)]

                  focus:border-[var(--border-focus)]

                  disabled:opacity-50
                "
              >
                <option value="">
                  Main document
                </option>

                {branches.map(
                  (branch) => (
                    <option
                      key={
                        branch.id
                      }
                      value={
                        branch.id
                      }
                    >
                      {
                        branch.name
                      }
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                title="Refresh branches"
                onClick={() => {
                  void loadBranches();
                }}
                className="
                  h-[30px]
                  rounded-[7px]
                  px-2
                  text-[10px]
                  font-medium
                  text-[var(--text-tertiary)]
                  transition-colors

                  hover:bg-[var(--surface-muted)]
                  hover:text-[var(--text-primary)]
                "
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-[10px]">
            <ThemeToggle />

            <div className="hidden items-center sm:flex">
              {onlineUsers
                .slice(
                  0,
                  4,
                )
                .map(
                  (
                    onlineUser,
                    index,
                  ) => (
                    <div
                      key={
                        onlineUser.socketId
                      }
                      title={
                        onlineUser.name
                      }
                      className="
                        relative
                        flex h-[28px]
                        w-[28px]
                        items-center
                        justify-center
                        rounded-full
                        border-2
                        border-[var(--surface)]
                        text-[9px]
                        font-semibold
                        text-white
                      "
                      style={{
                        backgroundColor:
                          onlineUser.color,

                        marginLeft:
                          index === 0
                            ? 0
                            : -7,

                        zIndex:
                          onlineUsers.length -
                          index,
                      }}
                    >
                      {getInitials(
                        onlineUser.name,
                      )}
                    </div>
                  ),
                )}

              {onlineUsers.length >
                4 && (
                <div
                  className="
                    relative
                    -ml-[7px]
                    flex h-[28px]
                    w-[28px]
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    border-[var(--surface)]
                    bg-[var(--surface-muted)]
                    text-[9px]
                    font-medium
                    text-[var(--text-secondary)]
                  "
                >
                  +
                  {onlineUsers.length -
                    4}
                </div>
              )}
            </div>

            <span
              className="
                hidden
                text-[10px]
                text-[var(--text-tertiary)]
                md:block
              "
            >
              {onlineUsers.length} online
            </span>

            {canManageSharing && (
              <button
                type="button"
                onClick={() =>
                  setIsShareDialogOpen(
                    true,
                  )
                }
                className="
                  inline-flex
                  h-[32px]
                  items-center
                  gap-[6px]
                  rounded-[7px]
                  border
                  border-[var(--border-default)]
                  bg-[var(--surface)]
                  px-[11px]
                  text-[12px]
                  font-medium
                  text-[var(--text-primary)]
                  shadow-[var(--shadow-xs)]
                  transition-all
                  duration-150

                  hover:border-[var(--border-strong)]
                  hover:bg-[var(--surface-muted)]

                  active:translate-y-px
                "
              >
                <ShareIcon />

                Share
              </button>
            )}

            <div
              title={
                user.name
              }
              className="
                flex h-[29px]
                w-[29px]
                items-center
                justify-center
                rounded-full
                border
                border-[var(--border-default)]
                bg-[var(--surface-muted)]
                text-[9px]
                font-semibold
                text-[var(--text-primary)]
              "
            >
              {getInitials(
                user.name,
              )}
            </div>
          </div>
        </header>

        {branchError && (
          <div
            className="
              border-b
              border-[var(--danger)]/20
              bg-[var(--danger-soft)]
            "
          >
            <div className="mx-auto max-w-[900px] px-5 py-[8px] text-[11px] text-[var(--danger)]">
              {branchError}
            </div>
          </div>
        )}

        {!canEdit && (
          <div
            className="
              border-b
              border-[var(--warning)]/20
              bg-[var(--warning-soft)]
            "
          >
            <div
              className="
                mx-auto
                max-w-[900px]
                px-5 py-[8px]
                text-[11px]
                text-[var(--warning)]
              "
            >
              You have view-only access to this{" "}
              {activeBranch
                ? "branch"
                : "document"}
              .
            </div>
          </div>
        )}

        <div
          className="
            min-h-[calc(100vh-56px)]
            overflow-x-hidden
            bg-[var(--surface-subtle)]
            px-3
            pb-24 pt-7
            sm:px-6
            md:pt-10
          "
        >
          <div className="mx-auto w-full max-w-[816px]">
            <div className="mb-5 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className="
                    text-[13px]
                    font-[540]
                    tracking-[-0.01em]
                    text-[var(--text-secondary)]
                  "
                >
                  {
                    document.title
                  }
                </h2>

                {activeBranch && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-full
                      border
                      border-[var(--border-default)]
                      bg-[var(--surface)]
                      px-2
                      py-[2px]
                      text-[9px]
                      font-medium
                      text-[var(--accent)]
                    "
                  >
                    <BranchIcon />

                    {
                      activeBranch.name
                    }
                  </span>
                )}
              </div>

              <div
                className="
                  mt-[4px]
                  flex flex-wrap
                  items-center
                  gap-[6px]
                  text-[10px]
                  text-[var(--text-tertiary)]
                "
              >
                <span>
                  {getRoleLabel(
                    document.role,
                  )}
                </span>

                <span>
                  ·
                </span>

                <span>
                  {activeBranch
                    ? "Branch"
                    : "Main document"}
                </span>

                <span>
                  ·
                </span>

                <span>
                  Updated{" "}
                  {new Date(
                    updatedAt,
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div
              className="
                min-h-[1056px]
                w-full
                overflow-hidden
                rounded-[3px]
                border
                border-[var(--border-default)]
                bg-[var(--surface)]
                shadow-[var(--shadow-md)]
              "
            >
              <RichTextEditor
                key={
                  editorKey
                }
                document={
                  document
                }
                ydoc={
                  ydoc
                }
                awareness={
                  awareness
                }
                canEdit={
                  canEdit
                }
                activeBranchId={
                  activeBranchId ||
                  null
                }
                onOpenBranch={
                  openBranch
                }
                onOpenMainDocument={
                  openMainDocument
                }
              />
            </div>

            <div
              className="
                mt-4 flex
                items-center
                justify-between
                px-1
                text-[10px]
                text-[var(--text-tertiary)]
              "
            >
              <span>
                {canEdit
                  ? activeBranch
                    ? `Changes sync automatically to ${activeBranch.name}`
                    : "Changes sync automatically"
                  : activeBranch
                    ? "Read-only branch"
                    : "Read-only document"}
              </span>

              <span>
                {activeBranch
                  ? "Branch · Rich text"
                  : "Rich text"}
              </span>
            </div>
          </div>
        </div>
      </main>

      {canManageSharing && (
        <ShareDialog
          documentId={
            document.id
          }
          isOpen={
            isShareDialogOpen
          }
          onClose={() =>
            setIsShareDialogOpen(
              false,
            )
          }
        />
      )}
    </>
  );
}