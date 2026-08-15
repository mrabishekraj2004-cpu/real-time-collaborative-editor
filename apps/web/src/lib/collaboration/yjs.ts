import * as Y from "yjs";

const documentStore =
  new Map<string, Y.Doc>();

const DEFAULT_DOCUMENT_ID =
  "default-document";

function getDocumentKey(
  documentId: string,
  branchId?: string | null,
): string {
  if (branchId) {
    return `branch:${documentId}:${branchId}`;
  }

  return `document:${documentId}`;
}

export function getYDoc(
  documentId: string =
    DEFAULT_DOCUMENT_ID,
  branchId?: string | null,
): Y.Doc {
  const key =
    getDocumentKey(
      documentId,
      branchId,
    );

  const existingDocument =
    documentStore.get(key);

  if (existingDocument) {
    return existingDocument;
  }

  const newDocument =
    new Y.Doc();

  documentStore.set(
    key,
    newDocument,
  );

  return newDocument;
}

export function getSharedText(
  documentId: string =
    DEFAULT_DOCUMENT_ID,
  branchId?: string | null,
): Y.Text {
  return getYDoc(
    documentId,
    branchId,
  ).getText("content");
}

export function getSharedFragment(
  documentId: string =
    DEFAULT_DOCUMENT_ID,
  branchId?: string | null,
): Y.XmlFragment {
  return getYDoc(
    documentId,
    branchId,
  ).getXmlFragment(
    "prosemirror",
  );
}

export function destroyYDoc(
  documentId: string,
  branchId?: string | null,
): void {
  const key =
    getDocumentKey(
      documentId,
      branchId,
    );

  const document =
    documentStore.get(key);

  if (!document) {
    return;
  }

  document.destroy();

  documentStore.delete(key);
}