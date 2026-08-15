"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../src/hooks/useAuth";
import {
  createDocument,
  DocumentRecord,
  getDocuments,
} from "../../src/lib/api";

import { CreateDocumentComposer } from "./components/CreateDocumentComposer";
import { DocumentSection } from "./components/DocumentSection";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { WorkspaceIntro } from "./components/WorkspaceIntro";

export default function DocumentsPage() {
  const router = useRouter();

  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading: isAuthLoading,
    logout,
  } = useAuth();

  const [documents, setDocuments] =
    useState<DocumentRecord[]>([]);

  const [title, setTitle] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [pageError, setPageError] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isCreating, setIsCreating] =
    useState(false);

  const [
    isComposerOpen,
    setIsComposerOpen,
  ] = useState(false);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (
      !isAuthenticated ||
      !accessToken
    ) {
      router.replace("/");
      return;
    }

    const authenticatedAccessToken =
      accessToken;

    async function loadDocuments() {
      try {
        setPageError("");

        const result =
          await getDocuments(
            authenticatedAccessToken,
          );

        setDocuments(result);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to load documents",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDocuments();
  }, [
    accessToken,
    isAuthenticated,
    isAuthLoading,
    router,
  ]);

  const filteredDocuments =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return documents;
      }

      return documents.filter(
        (document) =>
          document.title
            .toLowerCase()
            .includes(query),
      );
    }, [documents, search]);

  const ownedDocuments =
    useMemo(
      () =>
        filteredDocuments.filter(
          (document) =>
            document.role ===
              "OWNER" ||
            document.ownerId ===
              user?.id,
        ),
      [
        filteredDocuments,
        user?.id,
      ],
    );

  const sharedDocuments =
    useMemo(
      () =>
        filteredDocuments.filter(
          (document) =>
            document.role ===
              "EDITOR" ||
            document.role ===
              "VIEWER",
        ),
      [filteredDocuments],
    );

  async function handleCreateDocument(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    const authenticatedAccessToken =
      accessToken;

    const trimmedTitle =
      title.trim();

    if (!trimmedTitle) {
      setPageError(
        "Give the document a title first.",
      );
      return;
    }

    setPageError("");
    setIsCreating(true);

    try {
      const document =
        await createDocument(
          authenticatedAccessToken,
          trimmedTitle,
        );

      router.push(
        `/documents/${document.id}`,
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to create document",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  function handleCancelCreate() {
    setIsComposerOpen(false);
    setTitle("");
    setPageError("");
  }

  if (
    isAuthLoading ||
    isLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-sm text-[var(--text-secondary)]">
          Loading workspace…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="grid min-h-screen lg:grid-cols-[220px_1fr]">
        <Sidebar
          user={user}
          onGoToDocuments={() =>
            router.push(
              "/documents",
            )
          }
          onLogout={handleLogout}
        />

        <section className="min-w-0">
          <Topbar
            search={search}
            onSearchChange={setSearch}
            onCreateDocument={() =>
              setIsComposerOpen(true)
            }
          />

          <div className="mx-auto max-w-[1180px] px-5 pb-16 pt-8 md:px-8 md:pt-10">
            <WorkspaceIntro />

            {pageError && (
              <div className="mt-6 max-w-2xl rounded-[10px] border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {pageError}
              </div>
            )}

            <CreateDocumentComposer
              isOpen={
                isComposerOpen
              }
              title={title}
              isCreating={
                isCreating
              }
              onTitleChange={
                setTitle
              }
              onSubmit={
                handleCreateDocument
              }
              onCancel={
                handleCancelCreate
              }
            />

            <DocumentSection
              title="Your documents"
              subtitle="Created and owned by you."
              documents={
                ownedDocuments
              }
              onOpen={(id) =>
                router.push(
                  `/documents/${id}`,
                )
              }
              emptyText="No documents yet."
            />

            <DocumentSection
              title="Shared with you"
              subtitle="Documents where someone has given you access."
              documents={
                sharedDocuments
              }
              onOpen={(id) =>
                router.push(
                  `/documents/${id}`,
                )
              }
              emptyText="Nothing has been shared with you yet."
              divider
            />
          </div>
        </section>
      </div>
    </main>
  );
}