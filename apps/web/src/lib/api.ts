const API_URL = "http://localhost:4000";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type DocumentRole =
  | "OWNER"
  | "EDITOR"
  | "VIEWER";

export interface DocumentRecord {
  id: string;
  title: string;
  content: string;
  yjsState: number[] | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  role?: DocumentRole;
}

export interface SharedUser {
  permissionId: string;
  role: "EDITOR" | "VIEWER";

  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SharedUsersResponse {
  owner: {
    id: string;
    name: string;
    email: string;
    role: "OWNER";
  };

  sharedUsers: SharedUser[];
}

export interface SnapshotAuthor {
  id: string;
  name: string;
  email: string;
}

export interface DocumentSnapshot {
  id: string;
  name: string;
  title: string;
  createdAt: string;
  createdBy: SnapshotAuthor;
}

export interface DocumentSnapshotDetails
  extends DocumentSnapshot {
  documentId: string;
  content: string;
  yjsState: number[] | null;
}

export interface BranchAuthor {
  id: string;
  name: string;
  email: string;
}

export interface DocumentBranch {
  id: string;
  documentId: string;
  sourceSnapshotId: string | null;
  name: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  createdBy: BranchAuthor | null;
}

export interface DocumentBranchDetails
  extends DocumentBranch {
  content: string;
  yjsState: number[] | null;
}

interface LoginResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
}

interface RegisterResponse {
  message: string;
  user: AuthUser;
}

interface ShareDocumentResponse {
  message: string;

  permission: {
    id: string;
    role: "EDITOR" | "VIEWER";

    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface MessageResponse {
  message: string;
}

interface CreateSnapshotResponse {
  id: string;
  name: string;
  title: string;
  createdAt: string;
  createdBy: SnapshotAuthor;
}

interface CreateBranchResponse {
  id: string;
  documentId: string;
  sourceSnapshotId: string | null;
  name: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  createdBy: BranchAuthor;
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const error =
    await response
      .json()
      .catch(() => null);

  if (
    Array.isArray(
      error?.message,
    )
  ) {
    return error.message.join(
      ", ",
    );
  }

  return (
    error?.message ??
    fallbackMessage
  );
}

function authHeaders(
  accessToken: string,
) {
  return {
    Authorization:
      `Bearer ${accessToken}`,
  };
}

function jsonAuthHeaders(
  accessToken: string,
) {
  return {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${accessToken}`,
  };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const response =
    await fetch(
      `${API_URL}/auth/register`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            name,
            email,
            password,
          }),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Registration failed",
      ),
    );
  }

  return response.json();
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response =
    await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            email,
            password,
          }),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Login failed",
      ),
    );
  }

  return response.json();
}

export async function getProfile(
  accessToken: string,
): Promise<AuthUser> {
  const response =
    await fetch(
      `${API_URL}/auth/profile`,
      {
        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to load authenticated user profile",
      ),
    );
  }

  return response.json();
}

export async function createDocument(
  accessToken: string,
  title: string,
): Promise<DocumentRecord> {
  const response =
    await fetch(
      `${API_URL}/documents`,
      {
        method: "POST",

        headers:
          jsonAuthHeaders(
            accessToken,
          ),

        body:
          JSON.stringify({
            title,
          }),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to create document",
      ),
    );
  }

  return response.json();
}

export async function getDocuments(
  accessToken: string,
): Promise<DocumentRecord[]> {
  const response =
    await fetch(
      `${API_URL}/documents`,
      {
        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to load documents",
      ),
    );
  }

  return response.json();
}

export async function getDocument(
  accessToken: string,
  documentId: string,
): Promise<DocumentRecord> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}`,
      {
        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to load document",
      ),
    );
  }

  return response.json();
}

export async function shareDocument(
  accessToken: string,
  documentId: string,
  email: string,
  role:
    | "EDITOR"
    | "VIEWER",
): Promise<ShareDocumentResponse> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/share`,
      {
        method: "POST",

        headers:
          jsonAuthHeaders(
            accessToken,
          ),

        body:
          JSON.stringify({
            email,
            role,
          }),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to share document",
      ),
    );
  }

  return response.json();
}

export async function getSharedUsers(
  accessToken: string,
  documentId: string,
): Promise<SharedUsersResponse> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/share`,
      {
        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to load shared users",
      ),
    );
  }

  return response.json();
}

export async function removeSharedUser(
  accessToken: string,
  documentId: string,
  userId: string,
): Promise<MessageResponse> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/share/${userId}`,
      {
        method: "DELETE",

        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to remove user",
      ),
    );
  }

  return response.json();
}

export async function createDocumentSnapshot(
  accessToken: string,
  documentId: string,
  name?: string,
): Promise<CreateSnapshotResponse> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/snapshots`,
      {
        method: "POST",

        headers:
          jsonAuthHeaders(
            accessToken,
          ),

        body:
          JSON.stringify({
            name:
              name?.trim() ||
              undefined,
          }),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to save document version",
      ),
    );
  }

  return response.json();
}

export async function getDocumentSnapshots(
  accessToken: string,
  documentId: string,
): Promise<DocumentSnapshot[]> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/snapshots`,
      {
        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to load version history",
      ),
    );
  }

  return response.json();
}

export async function getDocumentSnapshot(
  accessToken: string,
  documentId: string,
  snapshotId: string,
): Promise<DocumentSnapshotDetails> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/snapshots/${snapshotId}`,
      {
        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to load document version",
      ),
    );
  }

  return response.json();
}

export async function deleteDocumentSnapshot(
  accessToken: string,
  documentId: string,
  snapshotId: string,
): Promise<MessageResponse> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/snapshots/${snapshotId}`,
      {
        method: "DELETE",

        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to delete document version",
      ),
    );
  }

  return response.json();
}

export async function createDocumentBranch(
  accessToken: string,
  documentId: string,
  name: string,
  sourceSnapshotId?: string,
): Promise<CreateBranchResponse> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/branches`,
      {
        method: "POST",

        headers:
          jsonAuthHeaders(
            accessToken,
          ),

        body:
          JSON.stringify({
            name:
              name.trim(),

            sourceSnapshotId:
              sourceSnapshotId ||
              undefined,
          }),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to create document branch",
      ),
    );
  }

  return response.json();
}

export async function getDocumentBranches(
  accessToken: string,
  documentId: string,
): Promise<DocumentBranch[]> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/branches`,
      {
        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to load document branches",
      ),
    );
  }

  return response.json();
}

export async function getDocumentBranch(
  accessToken: string,
  documentId: string,
  branchId: string,
): Promise<DocumentBranchDetails> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/branches/${branchId}`,
      {
        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to load document branch",
      ),
    );
  }

  return response.json();
}

export async function deleteDocumentBranch(
  accessToken: string,
  documentId: string,
  branchId: string,
): Promise<MessageResponse> {
  const response =
    await fetch(
      `${API_URL}/documents/${documentId}/branches/${branchId}`,
      {
        method: "DELETE",

        headers:
          authHeaders(
            accessToken,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        "Unable to delete document branch",
      ),
    );
  }

  return response.json();
}