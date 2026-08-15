"use client";

import {
  EditorContent,
  useEditor,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import UnderlineExtension from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import LinkExtension from "@tiptap/extension-link";

import {
  FontFamily,
  FontSize,
  TextStyle,
} from "@tiptap/extension-text-style";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  BookOpen,
  Check,
  CircleCheck,
  Clock3,
  Copy,
  Eye,
  FileText,
  GitBranch,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Network,
  Plus,
  Redo2,
  Search,
  Strikethrough,
  Trash2,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import {
  ComponentType,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import * as Y from "yjs";

import type {
  Awareness,
} from "y-protocols/awareness";

import {
  createDocumentBranch,
  createDocumentSnapshot,
  deleteDocumentBranch,
  deleteDocumentSnapshot,
  DocumentBranch,
  DocumentRecord,
  DocumentSnapshot,
  getDocumentBranches,
  getDocumentSnapshots,
} from "../../lib/api";

import {
  useAuth,
} from "../../hooks/useAuth";

import {
  DocumentComparePanel,
} from "./DocumentComparePanel";

import {
  type BranchMergePayload,
  DocumentMergePanel,
} from "./DocumentMergePanel";

import {
  SnapshotPreviewPanel,
  type SnapshotRestorePayload,
} from "./SnapshotPreviewPanel";

interface RichTextEditorProps {
  document: DocumentRecord;
  ydoc: Y.Doc;
  awareness: Awareness;
  canEdit: boolean;

  activeBranchId?: string | null;

  onOpenBranch?: (
    branchId: string,
  ) => void | Promise<void>;

  onOpenMainDocument?: () =>
    void | Promise<void>;
}

type ToolbarMode =
  | "home"
  | "structure"
  | "review"
  | "sources"
  | "versions";

interface ToolbarButtonProps {
  title: string;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface PlannedActionProps {
  label: string;
  description: string;

  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
}

const toolbarModes: Array<{
  id: ToolbarMode;
  label: string;
}> = [
  {
    id: "home",
    label: "Home",
  },
  {
    id: "structure",
    label: "Structure",
  },
  {
    id: "review",
    label: "Review",
  },
  {
    id: "sources",
    label: "Sources",
  },
  {
    id: "versions",
    label: "Versions",
  },
];

function ToolbarButton({
  title,
  children,
  active = false,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px]",
        "transition-all duration-150",

        active
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",

        disabled
          ? "cursor-not-allowed opacity-30"
          : "active:scale-[0.96]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function RibbonDivider() {
  return (
    <div className="mx-2 h-10 w-px shrink-0 bg-[var(--border-subtle)]" />
  );
}

function GroupLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
      {children}
    </span>
  );
}

function PlannedAction({
  label,
  description,
  icon: ActionIcon,
}: PlannedActionProps) {
  return (
    <div
      title={`${label} — ${description}`}
      className="
        group flex h-[48px]
        min-w-[142px]
        shrink-0 items-center
        gap-2.5
        rounded-[9px]
        border border-transparent
        px-2.5
        transition-colors
        duration-150

        hover:border-[var(--border-subtle)]
        hover:bg-[var(--surface-muted)]
      "
    >
      <div
        className="
          flex h-8 w-8
          shrink-0 items-center
          justify-center
          rounded-[8px]
          bg-[var(--surface-muted)]
          text-[var(--text-secondary)]
          transition-colors
          duration-150

          group-hover:text-[var(--text-primary)]
        "
      >
        <ActionIcon
          size={16}
          strokeWidth={1.7}
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
          {label}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-[var(--text-tertiary)]">
          Planned
        </p>
      </div>
    </div>
  );
}

function formatDate(
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
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

export function RichTextEditor({
  document,
  ydoc,
  awareness,
  canEdit,
  activeBranchId = null,
  onOpenBranch,
  onOpenMainDocument,
}: RichTextEditorProps) {
  const params =
    useParams<{
      id: string;
    }>();

  const {
    accessToken,
  } = useAuth();

  const documentId =
    typeof params.id === "string"
      ? params.id
      : "";

  const migrated =
    useRef(false);

  const [
    activeMode,
    setActiveMode,
  ] =
    useState<ToolbarMode>(
      "home",
    );

  const [
    snapshots,
    setSnapshots,
  ] =
    useState<
      DocumentSnapshot[]
    >([]);

  const [
    branches,
    setBranches,
  ] =
    useState<
      DocumentBranch[]
    >([]);

  const [
    branchSourceSnapshotId,
    setBranchSourceSnapshotId,
  ] =
    useState("");

  const [
    isLoadingSnapshots,
    setIsLoadingSnapshots,
  ] =
    useState(false);

  const [
    isLoadingBranches,
    setIsLoadingBranches,
  ] =
    useState(false);

  const [
    isCreatingSnapshot,
    setIsCreatingSnapshot,
  ] =
    useState(false);

  const [
    isCreatingBranch,
    setIsCreatingBranch,
  ] =
    useState(false);

  const [
    openingBranchId,
    setOpeningBranchId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isOpeningMainDocument,
    setIsOpeningMainDocument,
  ] =
    useState(false);

  const [
    deletingSnapshotId,
    setDeletingSnapshotId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    deletingBranchId,
    setDeletingBranchId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    versionError,
    setVersionError,
  ] =
    useState("");

  const [
    versionMessage,
    setVersionMessage,
  ] =
    useState("");

  const [
    isCompareOpen,
    setIsCompareOpen,
  ] =
    useState(false);

  const [
    isMergeOpen,
    setIsMergeOpen,
  ] =
    useState(false);

  const [
    selectedSnapshotId,
    setSelectedSnapshotId,
  ] =
    useState<string | null>(
      null,
    );

  const editor = useEditor({
    immediatelyRender: false,
    editable: canEdit,

    extensions: [
      StarterKit.configure({
        undoRedo: false,
        underline: false,
        link: false,
      }),

      UnderlineExtension,

      TextStyle,

      FontFamily.configure({
        types: ["textStyle"],
      }),

      FontSize.configure({
        types: ["textStyle"],
      }),

      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
      }),

      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",

        HTMLAttributes: {
          rel:
            "noopener noreferrer",

          target:
            "_blank",
        },
      }),

      Collaboration.configure({
        document: ydoc,
        field: "prosemirror",
      }),

      CollaborationCaret.configure({
        provider: {
          awareness,
        },
      }),
    ],

    editorProps: {
      attributes: {
        class:
          "min-h-[900px] w-full px-[clamp(32px,8vw,92px)] pb-[72px] pt-[36px] text-[16px] leading-[1.75] text-[var(--text-primary)] outline-none",
      },
    },
  });

  useEffect(() => {
    migrated.current =
      false;
  }, [
    ydoc,
  ]);

  useEffect(() => {
    if (
      !editor ||
      migrated.current
    ) {
      return;
    }

    migrated.current =
      true;

    const oldText =
      ydoc
        .getText("content")
        .toString();

    const richDocument =
      ydoc.getXmlFragment(
        "prosemirror",
      );

    const hasRichContent =
      richDocument.length > 0 ||
      editor
        .getText()
        .trim()
        .length > 0;

    if (
      hasRichContent ||
      !oldText.trim()
    ) {
      return;
    }

    editor.commands.setContent(
      {
        type: "doc",

        content: [
          {
            type:
              "paragraph",

            content: [
              {
                type:
                  "text",

                text:
                  oldText,
              },
            ],
          },
        ],
      },
      {
        emitUpdate:
          true,
      },
    );
  }, [
    editor,
    ydoc,
  ]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(
      canEdit,
    );
  }, [
    editor,
    canEdit,
  ]);

  const loadSnapshots =
    useCallback(
      async () => {
        if (
          !accessToken ||
          !documentId
        ) {
          return;
        }

        setIsLoadingSnapshots(
          true,
        );

        try {
          const result =
            await getDocumentSnapshots(
              accessToken,
              documentId,
            );

          setSnapshots(
            result,
          );
        } catch (error) {
          setVersionError(
            error instanceof Error
              ? error.message
              : "Unable to load version history",
          );
        } finally {
          setIsLoadingSnapshots(
            false,
          );
        }
      },
      [
        accessToken,
        documentId,
      ],
    );

  const loadBranches =
    useCallback(
      async () => {
        if (
          !accessToken ||
          !documentId
        ) {
          return;
        }

        setIsLoadingBranches(
          true,
        );

        try {
          const result =
            await getDocumentBranches(
              accessToken,
              documentId,
            );

          setBranches(
            result,
          );
        } catch (error) {
          setVersionError(
            error instanceof Error
              ? error.message
              : "Unable to load document branches",
          );
        } finally {
          setIsLoadingBranches(
            false,
          );
        }
      },
      [
        accessToken,
        documentId,
      ],
    );

  useEffect(() => {
    if (
      activeMode !==
      "versions"
    ) {
      return;
    }

    setVersionError("");
    setVersionMessage("");

    void Promise.all([
      loadSnapshots(),
      loadBranches(),
    ]);
  }, [
    activeMode,
    loadSnapshots,
    loadBranches,
  ]);

  if (!editor) {
    return (
      <div className="px-10 py-16 text-sm text-[var(--text-tertiary)]">
        Loading editor…
      </div>
    );
  }

  const activeEditor =
    editor;

  const textStyle =
    activeEditor.getAttributes(
      "textStyle",
    );

  const fontFamily =
    textStyle.fontFamily ??
    "";

  const fontSize =
    textStyle.fontSize ??
    "";

  const selectClass = `
    h-8
    rounded-[7px]
    border border-[var(--border-default)]
    bg-[var(--surface-subtle)]
    px-2.5
    text-[12px]
    font-medium
    text-[var(--text-primary)]
    outline-none
    transition-all
    duration-150

    hover:border-[var(--border-strong)]
    hover:bg-[var(--surface-muted)]

    focus:border-[var(--border-focus)]

    disabled:cursor-not-allowed
    disabled:opacity-40
  `;

  function changeFont(
    value: string,
  ) {
    if (!canEdit) {
      return;
    }

    if (!value) {
      activeEditor
        .chain()
        .focus()
        .unsetFontFamily()
        .run();

      return;
    }

    activeEditor
      .chain()
      .focus()
      .setFontFamily(
        value,
      )
      .run();
  }

  function changeSize(
    value: string,
  ) {
    if (!canEdit) {
      return;
    }

    if (!value) {
      activeEditor
        .chain()
        .focus()
        .unsetFontSize()
        .run();

      return;
    }

    activeEditor
      .chain()
      .focus()
      .setFontSize(
        value,
      )
      .run();
  }

  function changeTextStyle(
    value: string,
  ) {
    if (!canEdit) {
      return;
    }

    if (
      value ===
      "paragraph"
    ) {
      activeEditor
        .chain()
        .focus()
        .setParagraph()
        .run();

      return;
    }

    const level =
      value === "h1"
        ? 1
        : value === "h2"
          ? 2
          : 3;

    activeEditor
      .chain()
      .focus()
      .setHeading({
        level,
      })
      .run();
  }

  function editLink() {
    if (!canEdit) {
      return;
    }

    const currentUrl =
      activeEditor.getAttributes(
        "link",
      ).href as
        | string
        | undefined;

    const result =
      window.prompt(
        "Enter link",
        currentUrl ??
          "",
      );

    if (
      result ===
      null
    ) {
      return;
    }

    const value =
      result.trim();

    if (!value) {
      activeEditor
        .chain()
        .focus()
        .extendMarkRange(
          "link",
        )
        .unsetLink()
        .run();

      return;
    }

    const hasProtocol =
      /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(
        value,
      );

    const url =
      hasProtocol
        ? value
        : `https://${value}`;

    activeEditor
      .chain()
      .focus()
      .extendMarkRange(
        "link",
      )
      .setLink({
        href: url,
      })
      .run();
  }

  async function saveVersion() {
    if (
      !accessToken ||
      !documentId ||
      !canEdit
    ) {
      return;
    }

    const enteredName =
      window.prompt(
        "Name this version",
        "",
      );

    if (
      enteredName ===
      null
    ) {
      return;
    }

    const name =
      enteredName.trim();

    setIsCreatingSnapshot(
      true,
    );

    setVersionError("");
    setVersionMessage("");

    try {
      const snapshot =
        await createDocumentSnapshot(
          accessToken,
          documentId,
          name ||
            undefined,
        );

      setSnapshots(
        (
          currentSnapshots,
        ) => [
          snapshot,
          ...currentSnapshots,
        ],
      );

      setVersionMessage(
        `${snapshot.name} saved`,
      );
    } catch (error) {
      setVersionError(
        error instanceof Error
          ? error.message
          : "Unable to save document version",
      );
    } finally {
      setIsCreatingSnapshot(
        false,
      );
    }
  }

  async function removeVersion(
    snapshotId: string,
  ) {
    if (
      !accessToken ||
      !documentId
    ) {
      return;
    }

    const shouldDelete =
      window.confirm(
        "Delete this saved version?",
      );

    if (!shouldDelete) {
      return;
    }

    setDeletingSnapshotId(
      snapshotId,
    );

    setVersionError("");
    setVersionMessage("");

    try {
      await deleteDocumentSnapshot(
        accessToken,
        documentId,
        snapshotId,
      );

      setSnapshots(
        (
          currentSnapshots,
        ) =>
          currentSnapshots.filter(
            (snapshot) =>
              snapshot.id !==
              snapshotId,
          ),
      );

      if (
        branchSourceSnapshotId ===
        snapshotId
      ) {
        setBranchSourceSnapshotId(
          "",
        );
      }

      setVersionMessage(
        "Version deleted",
      );
    } catch (error) {
      setVersionError(
        error instanceof Error
          ? error.message
          : "Unable to delete document version",
      );
    } finally {
      setDeletingSnapshotId(
        null,
      );
    }
  }

  async function createBranch() {
    if (
      !accessToken ||
      !documentId ||
      !canEdit
    ) {
      return;
    }

    const enteredName =
      window.prompt(
        "Branch name",
        "",
      );

    if (
      enteredName ===
      null
    ) {
      return;
    }

    const name =
      enteredName.trim();

    if (!name) {
      setVersionError(
        "Branch name is required",
      );

      return;
    }

    setIsCreatingBranch(
      true,
    );

    setVersionError("");
    setVersionMessage("");

    try {
      const branch =
        await createDocumentBranch(
          accessToken,
          documentId,
          name,
          branchSourceSnapshotId ||
            undefined,
        );

      setBranches(
        (
          currentBranches,
        ) => [
          branch,
          ...currentBranches,
        ],
      );

      setVersionMessage(
        `${branch.name} branch created`,
      );
    } catch (error) {
      setVersionError(
        error instanceof Error
          ? error.message
          : "Unable to create document branch",
      );
    } finally {
      setIsCreatingBranch(
        false,
      );
    }
  }

  async function openBranch(
    branchId: string,
  ) {
    if (
      !onOpenBranch
    ) {
      return;
    }

    if (
      branchId ===
      activeBranchId
    ) {
      return;
    }

    setOpeningBranchId(
      branchId,
    );

    setVersionError("");
    setVersionMessage("");

    try {
      await onOpenBranch(
        branchId,
      );
    } catch (error) {
      setVersionError(
        error instanceof Error
          ? error.message
          : "Unable to open branch",
      );
    } finally {
      setOpeningBranchId(
        null,
      );
    }
  }

  async function openMainDocument() {
    if (
      !onOpenMainDocument
    ) {
      return;
    }

    if (!activeBranchId) {
      return;
    }

    setIsOpeningMainDocument(
      true,
    );

    setVersionError("");
    setVersionMessage("");

    try {
      await onOpenMainDocument();
    } catch (error) {
      setVersionError(
        error instanceof Error
          ? error.message
          : "Unable to open main document",
      );
    } finally {
      setIsOpeningMainDocument(
        false,
      );
    }
  }

  async function switchDocumentTarget(
    value: string,
  ) {
    if (!value) {
      await openMainDocument();
      return;
    }

    await openBranch(
      value,
    );
  }

  async function removeBranch(
    branchId: string,
  ) {
    if (
      !accessToken ||
      !documentId
    ) {
      return;
    }

    if (
      activeBranchId ===
      branchId
    ) {
      setVersionError(
        "Switch away from this branch before deleting it",
      );

      return;
    }

    const shouldDelete =
      window.confirm(
        "Delete this branch?",
      );

    if (!shouldDelete) {
      return;
    }

    setDeletingBranchId(
      branchId,
    );

    setVersionError("");
    setVersionMessage("");

    try {
      await deleteDocumentBranch(
        accessToken,
        documentId,
        branchId,
      );

      setBranches(
        (
          currentBranches,
        ) =>
          currentBranches.filter(
            (branch) =>
              branch.id !==
              branchId,
          ),
      );

      setVersionMessage(
        "Branch deleted",
      );
    } catch (error) {
      setVersionError(
        error instanceof Error
          ? error.message
          : "Unable to delete document branch",
      );
    } finally {
      setDeletingBranchId(
        null,
      );
    }
  }

  async function restoreSavedVersion(
    payload: SnapshotRestorePayload,
  ) {
    if (
      !canEdit
    ) {
      throw new Error(
        "You do not have permission to restore this document",
      );
    }

    if (
      activeBranchId
    ) {
      throw new Error(
        "Open the Main document before restoring a saved version",
      );
    }

    const restoredContent =
      payload.content as Parameters<
        typeof activeEditor.commands.setContent
      >[0];

    activeEditor.commands.setContent(
      restoredContent,
      {
        emitUpdate: true,
      },
    );

    await loadSnapshots();

    setVersionError("");

    setVersionMessage(
      `${payload.snapshot.name} restored`,
    );
  }

  async function mergeBranchIntoMain(
    payload: BranchMergePayload,
  ) {
    if (!canEdit) {
      throw new Error(
        "You do not have permission to merge into this document",
      );
    }

    if (activeBranchId) {
      throw new Error(
        "Open the Main document before merging a branch",
      );
    }

    const mergedContent =
      payload.content as Parameters<
        typeof activeEditor.commands.setContent
      >[0];

    activeEditor.commands.setContent(
      mergedContent,
      {
        emitUpdate: true,
      },
    );

    await Promise.all([
      loadSnapshots(),
      loadBranches(),
    ]);

    setVersionError("");

    setVersionMessage(
      `${payload.branch.name} merged into Main document`,
    );

    setSelectedSnapshotId(
      null,
    );
  }

  function renderHomeToolbar() {
    return (
      <>
        <div className="flex shrink-0 flex-col items-center">
          <div className="flex h-8 items-center gap-1 text-[var(--text-tertiary)]">
            <Type
              size={15}
              strokeWidth={1.7}
            />

            <select
              aria-label="Text style"
              disabled={
                !canEdit
              }
              value={
                activeEditor.isActive(
                  "heading",
                  {
                    level: 1,
                  },
                )
                  ? "h1"
                  : activeEditor.isActive(
                        "heading",
                        {
                          level: 2,
                        },
                      )
                    ? "h2"
                    : activeEditor.isActive(
                          "heading",
                          {
                            level: 3,
                          },
                        )
                      ? "h3"
                      : "paragraph"
              }
              onChange={(event) =>
                changeTextStyle(
                  event.target.value,
                )
              }
              className={`${selectClass} w-[106px]`}
            >
              <option value="paragraph">
                Normal
              </option>

              <option value="h1">
                Heading 1
              </option>

              <option value="h2">
                Heading 2
              </option>

              <option value="h3">
                Heading 3
              </option>
            </select>
          </div>

          <GroupLabel>
            Style
          </GroupLabel>
        </div>

        <RibbonDivider />

        <div className="flex shrink-0 flex-col items-center">
          <div className="flex items-center gap-1">
            <select
              aria-label="Font family"
              value={
                fontFamily
              }
              disabled={
                !canEdit
              }
              onChange={(event) =>
                changeFont(
                  event.target.value,
                )
              }
              className={`${selectClass} w-[122px]`}
            >
              <option value="">
                Default
              </option>

              <option value="Inter">
                Inter
              </option>

              <option value="Arial">
                Arial
              </option>

              <option value="Georgia">
                Georgia
              </option>

              <option value="Times New Roman">
                Times New Roman
              </option>

              <option value="Courier New">
                Courier
              </option>
            </select>

            <select
              aria-label="Font size"
              value={
                fontSize
              }
              disabled={
                !canEdit
              }
              onChange={(event) =>
                changeSize(
                  event.target.value,
                )
              }
              className={`${selectClass} w-[58px]`}
            >
              <option value="">
                16
              </option>

              <option value="10px">
                10
              </option>

              <option value="12px">
                12
              </option>

              <option value="14px">
                14
              </option>

              <option value="16px">
                16
              </option>

              <option value="18px">
                18
              </option>

              <option value="20px">
                20
              </option>

              <option value="24px">
                24
              </option>

              <option value="28px">
                28
              </option>

              <option value="32px">
                32
              </option>

              <option value="40px">
                40
              </option>

              <option value="48px">
                48
              </option>
            </select>
          </div>

          <div className="mt-1 flex items-center gap-[2px]">
            <ToolbarButton
              title="Bold"
              active={
                activeEditor.isActive(
                  "bold",
                )
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .toggleBold()
                  .run()
              }
            >
              <Bold
                size={16}
                strokeWidth={2}
              />
            </ToolbarButton>

            <ToolbarButton
              title="Italic"
              active={
                activeEditor.isActive(
                  "italic",
                )
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .toggleItalic()
                  .run()
              }
            >
              <Italic
                size={16}
                strokeWidth={1.9}
              />
            </ToolbarButton>

            <ToolbarButton
              title="Underline"
              active={
                activeEditor.isActive(
                  "underline",
                )
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .toggleUnderline()
                  .run()
              }
            >
              <UnderlineIcon
                size={16}
                strokeWidth={1.9}
              />
            </ToolbarButton>

            <ToolbarButton
              title="Strikethrough"
              active={
                activeEditor.isActive(
                  "strike",
                )
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .toggleStrike()
                  .run()
              }
            >
              <Strikethrough
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>
          </div>

          <GroupLabel>
            Font
          </GroupLabel>
        </div>

        <RibbonDivider />

        <div className="flex shrink-0 flex-col items-center">
          <div className="flex items-center gap-[2px]">
            <ToolbarButton
              title="Bullet list"
              active={
                activeEditor.isActive(
                  "bulletList",
                )
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .toggleBulletList()
                  .run()
              }
            >
              <List
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>

            <ToolbarButton
              title="Numbered list"
              active={
                activeEditor.isActive(
                  "orderedList",
                )
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .toggleOrderedList()
                  .run()
              }
            >
              <ListOrdered
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>

            <ToolbarButton
              title="Add or edit link"
              active={
                activeEditor.isActive(
                  "link",
                )
              }
              disabled={
                !canEdit
              }
              onClick={
                editLink
              }
            >
              <Link2
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>
          </div>

          <div className="mt-1 flex items-center gap-[2px]">
            <ToolbarButton
              title="Align left"
              active={
                activeEditor.isActive({
                  textAlign:
                    "left",
                })
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .setTextAlign(
                    "left",
                  )
                  .run()
              }
            >
              <AlignLeft
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>

            <ToolbarButton
              title="Align center"
              active={
                activeEditor.isActive({
                  textAlign:
                    "center",
                })
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .setTextAlign(
                    "center",
                  )
                  .run()
              }
            >
              <AlignCenter
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>

            <ToolbarButton
              title="Align right"
              active={
                activeEditor.isActive({
                  textAlign:
                    "right",
                })
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .setTextAlign(
                    "right",
                  )
                  .run()
              }
            >
              <AlignRight
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>

            <ToolbarButton
              title="Justify"
              active={
                activeEditor.isActive({
                  textAlign:
                    "justify",
                })
              }
              disabled={
                !canEdit
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .setTextAlign(
                    "justify",
                  )
                  .run()
              }
            >
              <AlignJustify
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>
          </div>

          <GroupLabel>
            Paragraph
          </GroupLabel>
        </div>

        <RibbonDivider />

        <div className="flex shrink-0 flex-col items-center">
          <div className="flex items-center gap-1">
            <ToolbarButton
              title="Undo"
              disabled={
                !canEdit ||
                !activeEditor
                  .can()
                  .undo()
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .undo()
                  .run()
              }
            >
              <Undo2
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>

            <ToolbarButton
              title="Redo"
              disabled={
                !canEdit ||
                !activeEditor
                  .can()
                  .redo()
              }
              onClick={() =>
                activeEditor
                  .chain()
                  .focus()
                  .redo()
                  .run()
              }
            >
              <Redo2
                size={16}
                strokeWidth={1.8}
              />
            </ToolbarButton>
          </div>

          <GroupLabel>
            History
          </GroupLabel>
        </div>
      </>
    );
  }

  function renderStructureToolbar() {
    return (
      <>
        <PlannedAction
          label="Outline"
          description="Linked document structure"
          icon={List}
        />

        <RibbonDivider />

        <PlannedAction
          label="Argument map"
          description="Claims and evidence"
          icon={Network}
        />

        <PlannedAction
          label="Content blocks"
          description="Reusable live sections"
          icon={Copy}
        />

        <PlannedAction
          label="Cross-references"
          description="Linked figures and sections"
          icon={Link2}
        />
      </>
    );
  }

  function renderReviewToolbar() {
    return (
      <>
        <PlannedAction
          label="Consistency"
          description="Terms, dates and numbers"
          icon={CircleCheck}
        />

        <PlannedAction
          label="Readability"
          description="Audience-based difficulty"
          icon={Eye}
        />

        <PlannedAction
          label="Semantic diff"
          description="Meaningful document changes"
          icon={Search}
        />

        <PlannedAction
          label="Validation"
          description="Document-wide checks"
          icon={CircleCheck}
        />
      </>
    );
  }

  function renderSourcesToolbar() {
    return (
      <>
        <PlannedAction
          label="Citations"
          description="Document sources"
          icon={BookOpen}
        />

        <RibbonDivider />

        <PlannedAction
          label="Source graph"
          description="Source relationships"
          icon={Network}
        />

        <PlannedAction
          label="Evidence links"
          description="Connect claims and sources"
          icon={Link2}
        />
      </>
    );
  }

  function renderSnapshotCards() {
    if (
      isLoadingSnapshots
    ) {
      return (
        <div className="flex h-[48px] min-w-[150px] items-center gap-2 px-3 text-[11px] text-[var(--text-tertiary)]">
          <Loader2
            size={15}
            className="animate-spin"
          />

          Loading history…
        </div>
      );
    }

    if (
      snapshots.length ===
      0
    ) {
      return (
        <div
          className="
            flex h-[48px]
            min-w-[170px]
            items-center gap-2.5
            rounded-[9px]
            border border-dashed
            border-[var(--border-default)]
            px-3
          "
        >
          <Clock3
            size={16}
            strokeWidth={1.7}
            className="text-[var(--text-tertiary)]"
          />

          <div>
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">
              No saved versions
            </p>

            <p className="mt-0.5 text-[9px] text-[var(--text-tertiary)]">
              Save your first checkpoint
            </p>
          </div>
        </div>
      );
    }

    return snapshots
      .slice(
        0,
        3,
      )
      .map(
        (
          snapshot,
          index,
        ) => (
          <div
            key={
              snapshot.id
            }
            role="button"
            tabIndex={0}
            onClick={() => {
              setSelectedSnapshotId(
                snapshot.id,
              );

              setIsCompareOpen(
                false,
              );

              setIsMergeOpen(
                false,
              );
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();

                setSelectedSnapshotId(
                  snapshot.id,
                );

                setIsCompareOpen(
                  false,
                );

                setIsMergeOpen(
                  false,
                );
              }
            }}
            className="
              group relative
              flex h-[50px]
              min-w-[168px]
              max-w-[190px]
              cursor-pointer
              items-center gap-2.5
              rounded-[9px]
              border
              border-[var(--border-subtle)]
              bg-[var(--surface-subtle)]
              px-2.5
              text-left
              transition-colors

              hover:border-[var(--border-strong)]
              hover:bg-[var(--surface-muted)]
            "
          >
            <div
              className="
                flex h-7 w-7
                shrink-0 items-center
                justify-center
                rounded-full
                bg-[var(--surface-muted)]
                text-[var(--text-secondary)]
              "
            >
              {index ===
              0 ? (
                <Check
                  size={14}
                  strokeWidth={1.9}
                />
              ) : (
                <Clock3
                  size={14}
                  strokeWidth={1.7}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 pr-5">
              <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                {
                  snapshot.name
                }
              </p>

              <p className="mt-0.5 truncate text-[9px] text-[var(--text-tertiary)]">
                {formatDate(
                  snapshot.createdAt,
                )}
                {" · "}
                {
                  snapshot
                    .createdBy
                    .name
                }
              </p>
            </div>

            <button
              type="button"
              title="Delete version"
              aria-label={`Delete ${snapshot.name}`}
              disabled={
                deletingSnapshotId ===
                snapshot.id
              }
              onClick={(event) => {
                event.stopPropagation();

                void removeVersion(
                  snapshot.id,
                );
              }}
              className="
                absolute
                right-1.5
                top-1/2
                flex h-6 w-6
                -translate-y-1/2
                items-center justify-center
                rounded-[6px]
                text-[var(--text-tertiary)]
                opacity-0
                transition-all

                hover:bg-[var(--danger-soft)]
                hover:text-[var(--danger)]

                group-hover:opacity-100

                disabled:opacity-40
              "
            >
              {deletingSnapshotId ===
              snapshot.id ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              ) : (
                <Trash2
                  size={13}
                  strokeWidth={1.7}
                />
              )}
            </button>
          </div>
        ),
      );
  }

  function renderBranchCards() {
    if (
      isLoadingBranches
    ) {
      return (
        <div className="flex h-[48px] min-w-[150px] items-center gap-2 px-3 text-[11px] text-[var(--text-tertiary)]">
          <Loader2
            size={15}
            className="animate-spin"
          />

          Loading branches…
        </div>
      );
    }

    if (
      branches.length ===
      0
    ) {
      return (
        <div
          className="
            flex h-[48px]
            min-w-[180px]
            items-center gap-2.5
            rounded-[9px]
            border border-dashed
            border-[var(--border-default)]
            px-3
          "
        >
          <GitBranch
            size={16}
            strokeWidth={1.7}
            className="text-[var(--text-tertiary)]"
          />

          <div>
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">
              No branches yet
            </p>

            <p className="mt-0.5 text-[9px] text-[var(--text-tertiary)]">
              Create an alternate draft
            </p>
          </div>
        </div>
      );
    }

    return branches
      .slice(
        0,
        4,
      )
      .map(
        (branch) => {
          const isActive =
            activeBranchId ===
            branch.id;

          const isOpening =
            openingBranchId ===
            branch.id;

          return (
            <div
              key={
                branch.id
              }
              className={[
                "group relative flex h-[50px] min-w-[174px] max-w-[210px] items-center",
                "rounded-[9px] border transition-all duration-150",

                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]",
              ].join(" ")}
            >
              <button
                type="button"
                disabled={
                  isOpening
                }
                onClick={() => {
                  void openBranch(
                    branch.id,
                  );
                }}
                className="
                  flex h-full
                  min-w-0 flex-1
                  items-center gap-2.5
                  rounded-[9px]
                  px-2.5 pr-8
                  text-left

                  disabled:cursor-wait
                "
              >
                <div
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",

                    isActive
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "bg-[var(--accent-soft)] text-[var(--accent)]",
                  ].join(" ")}
                >
                  {isOpening ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <GitBranch
                      size={14}
                      strokeWidth={1.8}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={[
                      "truncate text-[11px] font-medium",

                      isActive
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    {
                      branch.name
                    }
                  </p>

                  <p className="mt-0.5 truncate text-[9px] text-[var(--text-tertiary)]">
                    {isActive
                      ? "Open now"
                      : formatDate(
                          branch.updatedAt,
                        )}

                    {!isActive &&
                    branch.createdBy
                      ?.name
                      ? ` · ${branch.createdBy.name}`
                      : ""}
                  </p>
                </div>
              </button>

              <button
                type="button"
                title={
                  isActive
                    ? "Switch away before deleting"
                    : "Delete branch"
                }
                aria-label={`Delete ${branch.name}`}
                disabled={
                  deletingBranchId ===
                    branch.id ||
                  isActive
                }
                onClick={() => {
                  void removeBranch(
                    branch.id,
                  );
                }}
                className="
                  absolute
                  right-1.5
                  top-1/2
                  flex h-6 w-6
                  -translate-y-1/2
                  items-center justify-center
                  rounded-[6px]
                  text-[var(--text-tertiary)]
                  opacity-0
                  transition-all

                  hover:bg-[var(--danger-soft)]
                  hover:text-[var(--danger)]

                  group-hover:opacity-100

                  disabled:cursor-not-allowed
                  disabled:opacity-30
                "
              >
                {deletingBranchId ===
                branch.id ? (
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={13}
                    strokeWidth={1.7}
                  />
                )}
              </button>
            </div>
          );
        },
      );
  }

  function renderVersionsToolbar() {
    const isSwitching =
      isOpeningMainDocument ||
      openingBranchId !== null;

    return (
      <div className="w-full min-w-0">
        <div
          className="
            flex min-w-0
            items-center gap-2
            overflow-x-auto
            border-b
            border-[var(--border-subtle)]
            px-1 pb-2
          "
        >
          <div className="flex shrink-0 flex-col items-start justify-center pr-1">
            <button
              type="button"
              disabled={
                !canEdit ||
                !accessToken ||
                !documentId ||
                isCreatingSnapshot
              }
              onClick={() => {
                void saveVersion();
              }}
              className="
                inline-flex h-8
                items-center gap-1.5
                rounded-[7px]
                bg-[var(--accent)]
                px-2.5
                text-[11px]
                font-semibold
                text-[var(--accent-foreground)]
                transition-all duration-150

                hover:bg-[var(--accent-hover)]

                active:scale-[0.98]

                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              {isCreatingSnapshot ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Plus
                  size={14}
                  strokeWidth={1.9}
                />
              )}

              {isCreatingSnapshot
                ? "Saving..."
                : "Save version"}
            </button>

            <span className="mt-1 text-[9px] text-[var(--text-tertiary)]">
              Checkpoint
            </span>
          </div>

          <RibbonDivider />

          <div className="flex shrink-0 flex-col items-start justify-center">
            <div className="flex items-center gap-1.5">
              <div
                className="
                  flex h-8 w-8
                  shrink-0 items-center
                  justify-center
                  rounded-[7px]
                  bg-[var(--surface-muted)]
                  text-[var(--text-secondary)]
                "
              >
                {activeBranchId ? (
                  <GitBranch
                    size={15}
                    strokeWidth={1.8}
                  />
                ) : (
                  <FileText
                    size={15}
                    strokeWidth={1.8}
                  />
                )}
              </div>

              <select
                aria-label="Open document or branch"
                value={activeBranchId ?? ""}
                disabled={
                  isLoadingBranches ||
                  isSwitching
                }
                onChange={(event) => {
                  void switchDocumentTarget(
                    event.target.value,
                  );
                }}
                className={`${selectClass} w-[150px]`}
              >
                <option value="">
                  Main document
                </option>

                {branches.map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                    </option>
                  ),
                )}
              </select>

              {isSwitching && (
                <Loader2
                  size={14}
                  className="animate-spin text-[var(--text-tertiary)]"
                />
              )}
            </div>

            <span className="mt-1 text-[9px] text-[var(--text-tertiary)]">
              Open
            </span>
          </div>

          <RibbonDivider />

          <div className="flex shrink-0 flex-col items-start justify-center">
            <div className="flex items-center gap-1.5">
              <select
                aria-label="Create branch from"
                value={branchSourceSnapshotId}
                disabled={
                  !canEdit ||
                  isCreatingBranch
                }
                onChange={(event) =>
                  setBranchSourceSnapshotId(
                    event.target.value,
                  )
                }
                className={`${selectClass} w-[140px]`}
              >
                <option value="">
                  Current state
                </option>

                {snapshots.map(
                  (snapshot) => (
                    <option
                      key={snapshot.id}
                      value={snapshot.id}
                    >
                      {snapshot.name}
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                disabled={
                  !canEdit ||
                  !accessToken ||
                  !documentId ||
                  isCreatingBranch
                }
                onClick={() => {
                  void createBranch();
                }}
                className="
                  inline-flex h-8
                  items-center gap-1.5
                  rounded-[7px]
                  border
                  border-[var(--border-default)]
                  bg-[var(--surface-subtle)]
                  px-2.5
                  text-[11px]
                  font-semibold
                  text-[var(--text-primary)]
                  transition-all

                  hover:border-[var(--border-strong)]
                  hover:bg-[var(--surface-muted)]

                  active:scale-[0.98]

                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {isCreatingBranch ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <GitBranch
                    size={14}
                    strokeWidth={1.8}
                  />
                )}

                {isCreatingBranch
                  ? "Creating..."
                  : "New branch"}
              </button>
            </div>

            <span className="mt-1 text-[9px] text-[var(--text-tertiary)]">
              Create from
            </span>
          </div>

          <RibbonDivider />

          <button
            type="button"
            onClick={() => {
              setIsCompareOpen(
                (current) =>
                  !current,
              );

              setIsMergeOpen(
                false,
              );
            }}
            className={[
              "group flex h-[48px] min-w-[142px]",
              "shrink-0 items-center gap-2.5",
              "rounded-[9px] border px-2.5",
              "transition-all duration-150",

              isCompareOpen
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--surface-muted)]",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-8 w-8 shrink-0",
                "items-center justify-center",
                "rounded-[8px]",
                "transition-colors duration-150",

                isCompareOpen
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              <Search
                size={16}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0 text-left">
              <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                Compare
              </p>

              <p className="mt-0.5 truncate text-[9px] text-[var(--text-tertiary)]">
                {isCompareOpen
                  ? "Panel open"
                  : "Versions & branches"}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMergeOpen(
                (current) =>
                  !current,
              );

              setIsCompareOpen(
                false,
              );
            }}
            className={[
              "group flex h-[48px] min-w-[142px]",
              "shrink-0 items-center gap-2.5",
              "rounded-[9px] border px-2.5",
              "transition-all duration-150",

              isMergeOpen
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--surface-muted)]",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-8 w-8 shrink-0",
                "items-center justify-center",
                "rounded-[8px]",
                "transition-colors duration-150",

                isMergeOpen
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--surface-muted)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              <Network
                size={16}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0 text-left">
              <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                Merge
              </p>

              <p className="mt-0.5 truncate text-[9px] text-[var(--text-tertiary)]">
                {isMergeOpen
                  ? "Panel open"
                  : "Branch into Main"}
              </p>
            </div>
          </button>
        </div>

        <div className="mt-2 grid min-w-0 gap-2 lg:grid-cols-2">
          <section
            className="
              min-w-0
              rounded-[9px]
              border
              border-[var(--border-subtle)]
              bg-[var(--surface-subtle)]
              px-2.5 py-2
            "
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                Saved versions
              </span>

              {snapshots.length > 0 && (
                <span className="text-[9px] text-[var(--text-tertiary)]">
                  {snapshots.length}
                </span>
              )}
            </div>

            <div
              className="
                editor-toolbar-scroll
                flex min-w-0 gap-2
                overflow-x-auto
                pb-1
              "
            >
              {renderSnapshotCards()}

              {snapshots.length > 3 && (
                <div className="flex shrink-0 items-center px-2 text-[10px] font-medium text-[var(--text-tertiary)]">
                  +{snapshots.length - 3} more
                </div>
              )}
            </div>
          </section>

          <section
            className="
              min-w-0
              rounded-[9px]
              border
              border-[var(--border-subtle)]
              bg-[var(--surface-subtle)]
              px-2.5 py-2
            "
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                Branches
              </span>

              {branches.length > 0 && (
                <span className="text-[9px] text-[var(--text-tertiary)]">
                  {branches.length}
                </span>
              )}
            </div>

            <div
              className="
                editor-toolbar-scroll
                flex min-w-0 gap-2
                overflow-x-auto
                pb-1
              "
            >
              {renderBranchCards()}

              {branches.length > 4 && (
                <div className="flex shrink-0 items-center px-2 text-[10px] font-medium text-[var(--text-tertiary)]">
                  +{branches.length - 4} more
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderToolbarContent() {
    switch (
      activeMode
    ) {
      case "structure":
        return renderStructureToolbar();

      case "review":
        return renderReviewToolbar();

      case "sources":
        return renderSourcesToolbar();

      case "versions":
        return renderVersionsToolbar();

      default:
        return renderHomeToolbar();
    }
  }

  return (
    <div className="min-h-[900px]">
      <div
        className="
          sticky top-[56px]
          z-30
          border-b
          border-[var(--border-subtle)]
          bg-[color-mix(in_srgb,var(--surface)_96%,transparent)]
          px-3 py-3
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            overflow-hidden
            rounded-[13px]
            border
            border-[var(--border-default)]
            bg-[color-mix(in_srgb,var(--surface)_97%,transparent)]
            shadow-[0_6px_20px_rgba(0,0,0,0.06)]
          "
        >
          <div
            className="
              editor-toolbar-scroll
              flex h-[37px]
              items-end
              overflow-x-auto
              overflow-y-hidden
              border-b
              border-[var(--border-subtle)]
              px-3
            "
          >
            {toolbarModes.map(
              (mode) => {
                const isActive =
                  activeMode ===
                  mode.id;

                return (
                  <button
                    key={
                      mode.id
                    }
                    type="button"
                    onClick={() => {
                      setActiveMode(
                        mode.id,
                      );

                      setVersionError(
                        "",
                      );

                      setVersionMessage(
                        "",
                      );
                    }}
                    className={[
                      "relative h-full shrink-0 px-3",
                      "text-[11px] transition-colors duration-150",

                      isActive
                        ? "font-semibold text-[var(--text-primary)]"
                        : "font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    {
                      mode.label
                    }

                    {isActive && (
                      <span
                        className="
                          absolute
                          bottom-[-1px]
                          left-3 right-3
                          h-[2px]
                          rounded-full
                          bg-[var(--accent)]
                        "
                      />
                    )}
                  </button>
                );
              },
            )}
          </div>

          <div
            className="
              editor-toolbar-scroll
              flex min-h-[76px]
              items-center
              overflow-x-auto
              overflow-y-hidden
              px-3 py-2
            "
          >
            {renderToolbarContent()}
          </div>

          {activeMode ===
            "versions" &&
            (versionError ||
              versionMessage) && (
              <div
                className="
                  flex min-h-8
                  items-center
                  border-t
                  border-[var(--border-subtle)]
                  px-4
                  text-[10px]
                "
              >
                {versionError ? (
                  <span className="text-[var(--danger)]">
                    {
                      versionError
                    }
                  </span>
                ) : (
                  <span className="text-[var(--success)]">
                    {
                      versionMessage
                    }
                  </span>
                )}
              </div>
            )}
        </div>
      </div>

      {activeMode === "versions" &&
        isCompareOpen &&
        accessToken && (
          <div className="mx-auto w-full max-w-[1100px] px-3 pt-3">
            <div
              className="
                overflow-hidden
                rounded-[13px]
                border
                border-[var(--border-default)]
                bg-[var(--surface)]
                shadow-[0_10px_30px_rgba(0,0,0,0.07)]
              "
            >
              <DocumentComparePanel
                accessToken={
                  accessToken
                }
                document={
                  document
                }
                snapshots={
                  snapshots
                }
                branches={
                  branches
                }
                onClose={() =>
                  setIsCompareOpen(
                    false,
                  )
                }
              />
            </div>
          </div>
        )}

      {activeMode === "versions" &&
        isMergeOpen &&
        accessToken && (
          <div className="mx-auto w-full max-w-[1100px] px-3 pt-3">
            <div
              className="
                overflow-hidden
                rounded-[13px]
                border
                border-[var(--border-default)]
                bg-[var(--surface)]
                shadow-[0_10px_30px_rgba(0,0,0,0.07)]
              "
            >
              <DocumentMergePanel
                accessToken={
                  accessToken
                }
                documentId={
                  document.id
                }
                branches={
                  branches
                }
                activeBranchId={
                  activeBranchId
                }
                canMerge={
                  canEdit
                }
                onMerge={
                  mergeBranchIntoMain
                }
                onClose={() =>
                  setIsMergeOpen(
                    false,
                  )
                }
              />
            </div>
          </div>
        )}

      {activeMode === "versions" &&
        selectedSnapshotId &&
        accessToken && (
          <div className="mx-auto w-full max-w-[1100px] px-3 pt-3">
            <div
              className="
                overflow-hidden
                rounded-[13px]
                border
                border-[var(--border-default)]
                bg-[var(--surface)]
                shadow-[0_10px_30px_rgba(0,0,0,0.07)]
              "
            >
              <SnapshotPreviewPanel
                accessToken={
                  accessToken
                }
                documentId={
                  document.id
                }
                snapshotId={
                  selectedSnapshotId
                }
                canRestore={
                  canEdit
                }
                isMainDocument={
                  !activeBranchId
                }
                onRestore={
                  restoreSavedVersion
                }
                onClose={() =>
                  setSelectedSnapshotId(
                    null,
                  )
                }
              />
            </div>
          </div>
        )}

      <div className="pt-8">
        <EditorContent
          editor={
            activeEditor
          }
        />
      </div>
    </div>
  );
}