"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useAuth } from "../../hooks/useAuth";
import {
  getSharedUsers,
  removeSharedUser,
  shareDocument,
  SharedUsersResponse,
} from "../../lib/api";

interface ShareDialogProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

type ShareRole =
  | "EDITOR"
  | "VIEWER";

function getInitials(
  name: string,
) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ShareDialog({
  documentId,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const { accessToken } =
    useAuth();

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<ShareRole>(
      "EDITOR",
    );

  const [
    sharedUsersData,
    setSharedUsersData,
  ] =
    useState<SharedUsersResponse | null>(
      null,
    );

  const [
    isLoadingUsers,
    setIsLoadingUsers,
  ] = useState(false);

  const [
    isSharing,
    setIsSharing,
  ] = useState(false);

  const [
    removingUserId,
    setRemovingUserId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    if (
      !isOpen ||
      !accessToken
    ) {
      return;
    }

    /*
      TypeScript fix:
      after checking that accessToken is not null,
      copy it into a local constant.

      This guarantees that the value used by the
      nested async function is a string.
    */
    const authenticatedAccessToken =
      accessToken;

    async function loadSharedUsers() {
      setIsLoadingUsers(true);
      setErrorMessage("");

      try {
        const result =
          await getSharedUsers(
            authenticatedAccessToken,
            documentId,
          );

        setSharedUsersData(
          result,
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load shared users",
        );
      } finally {
        setIsLoadingUsers(
          false,
        );
      }
    }

    loadSharedUsers();
  }, [
    accessToken,
    documentId,
    isOpen,
  ]);

  async function refreshSharedUsers() {
    if (!accessToken) {
      return;
    }

    const result =
      await getSharedUsers(
        accessToken,
        documentId,
      );

    setSharedUsersData(
      result,
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!accessToken) {
      setErrorMessage(
        "You must be signed in to share this document",
      );
      return;
    }

    const trimmedEmail =
      email.trim();

    if (!trimmedEmail) {
      setErrorMessage(
        "Email address is required",
      );
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSharing(true);

    try {
      await shareDocument(
        accessToken,
        documentId,
        trimmedEmail,
        role,
      );

      await refreshSharedUsers();

      setEmail("");
      setRole("EDITOR");

      setSuccessMessage(
        "Document shared successfully",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to share document",
      );
    } finally {
      setIsSharing(false);
    }
  }

  async function handleRoleChange(
    userEmail: string,
    newRole:
      | "EDITOR"
      | "VIEWER",
  ) {
    if (!accessToken) {
      setErrorMessage(
        "You must be signed in to change access",
      );
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await shareDocument(
        accessToken,
        documentId,
        userEmail,
        newRole,
      );

      await refreshSharedUsers();

      setSuccessMessage(
        newRole === "EDITOR"
          ? "User can now edit this document"
          : "User now has view-only access",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to change user access",
      );
    }
  }

  async function handleRemoveAccess(
    userId: string,
    userName: string,
  ) {
    if (!accessToken) {
      setErrorMessage(
        "You must be signed in to remove access",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Remove access for ${userName}?`,
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setRemovingUserId(
      userId,
    );

    try {
      await removeSharedUser(
        accessToken,
        documentId,
        userId,
      );

      await refreshSharedUsers();

      setSuccessMessage(
        "Document access removed successfully",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to remove user access",
      );
    } finally {
      setRemovingUserId(null);
    }
  }

  function handleClose() {
    setErrorMessage("");
    setSuccessMessage("");
    setEmail("");
    setRole("EDITOR");

    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-[var(--surface-overlay)]
        p-4
        backdrop-blur-[3px]
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="
          max-h-[88vh]
          w-full max-w-[560px]
          overflow-y-auto
          rounded-[14px]
          border border-[var(--border-default)]
          bg-[var(--surface)]
          shadow-[var(--shadow-dialog)]
        "
      >
        {/* Header */}
        <div
          className="
            flex items-start
            justify-between
            border-b
            border-[var(--border-subtle)]
            px-6 py-5
          "
        >
          <div>
            <h2
              className="
                text-[18px]
                font-semibold
                tracking-[-0.02em]
                text-[var(--text-primary)]
              "
            >
              Share document
            </h2>

            <p
              className="
                mt-1
                text-[13px]
                text-[var(--text-tertiary)]
              "
            >
              Manage who can access
              this document.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close share dialog"
            className="
              flex h-8 w-8
              items-center
              justify-center
              rounded-[7px]
              text-lg
              text-[var(--text-tertiary)]
              transition-colors
              hover:bg-[var(--surface-muted)]
              hover:text-[var(--text-primary)]
            "
          >
            ×
          </button>
        </div>

        {/* Invite */}
        <div className="px-6 py-5">
          <form
            onSubmit={
              handleSubmit
            }
          >
            <label
              htmlFor="share-email"
              className="
                text-[12px]
                font-medium
                text-[var(--text-secondary)]
              "
            >
              Invite someone
            </label>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="share-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="Email address"
                required
                autoComplete="email"
                className="
                  h-10 min-w-0
                  flex-1
                  rounded-[8px]
                  border border-[var(--border-default)]
                  bg-[var(--surface-subtle)]
                  px-3
                  text-[13px]
                  text-[var(--text-primary)]
                  outline-none
                  transition-all duration-150

                  placeholder:text-[var(--text-disabled)]

                  hover:border-[var(--border-strong)]

                  focus:border-[var(--border-focus)]
                  focus:bg-[var(--surface)]
                  focus:shadow-[0_0_0_3px_var(--focus-ring)]
                "
              />

              <select
                id="share-role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target
                      .value as ShareRole,
                  )
                }
                aria-label="Permission"
                className="
                  h-10
                  rounded-[8px]
                  border border-[var(--border-default)]
                  bg-[var(--surface-subtle)]
                  px-3
                  text-[13px]
                  text-[var(--text-primary)]
                  outline-none
                  transition-all duration-150

                  hover:border-[var(--border-strong)]

                  focus:border-[var(--border-focus)]
                  focus:bg-[var(--surface)]
                "
              >
                <option value="EDITOR">
                  Can edit
                </option>

                <option value="VIEWER">
                  Can view
                </option>
              </select>

              <button
                type="submit"
                disabled={isSharing}
                className="
                  h-10
                  rounded-[8px]
                  border border-[var(--border-default)]
                  bg-[var(--text-primary)]
                  px-4
                  text-[13px]
                  font-medium
                  text-[var(--surface)]
                  shadow-[var(--shadow-xs)]
                  transition-all duration-150

                  hover:opacity-90

                  active:translate-y-px

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isSharing
                  ? "Sharing..."
                  : "Invite"}
              </button>
            </div>

            <p
              className="
                mt-2
                text-[11px]
                text-[var(--text-tertiary)]
              "
            >
              {role === "EDITOR"
                ? "Can edit the document and collaborate in real time."
                : "Can open and read the document, but cannot make changes."}
            </p>

            {errorMessage && (
              <div
                className="
                  mt-4
                  rounded-[8px]
                  border
                  border-[var(--danger)]/20
                  bg-[var(--danger-soft)]
                  px-3 py-2.5
                  text-[12px]
                  text-[var(--danger)]
                "
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                className="
                  mt-4
                  rounded-[8px]
                  border
                  border-[var(--success)]/20
                  bg-[var(--success-soft)]
                  px-3 py-2.5
                  text-[12px]
                  text-[var(--success)]
                "
              >
                {successMessage}
              </div>
            )}
          </form>
        </div>

        {/* People */}
        <div
          className="
            border-t
            border-[var(--border-subtle)]
            px-6 pb-6 pt-5
          "
        >
          <div className="flex items-center justify-between">
            <h3
              className="
                text-[13px]
                font-medium
                text-[var(--text-primary)]
              "
            >
              People with access
            </h3>

            {sharedUsersData && (
              <span
                className="
                  text-[11px]
                  tabular-nums
                  text-[var(--text-tertiary)]
                "
              >
                {sharedUsersData
                  .sharedUsers
                  .length + 1}
              </span>
            )}
          </div>

          {isLoadingUsers ? (
            <div
              className="
                py-8 text-center
                text-[13px]
                text-[var(--text-tertiary)]
              "
            >
              Loading access…
            </div>
          ) : sharedUsersData ? (
            <div className="mt-3">
              {/* Owner */}
              <div
                className="
                  flex items-center
                  gap-3
                  border-b
                  border-[var(--border-subtle)]
                  py-3
                "
              >
                <div
                  className="
                    flex h-8 w-8
                    shrink-0 items-center
                    justify-center
                    rounded-full
                    border
                    border-[var(--border-default)]
                    bg-[var(--surface-muted)]
                    text-[10px]
                    font-semibold
                    text-[var(--text-primary)]
                  "
                >
                  {getInitials(
                    sharedUsersData
                      .owner.name,
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      truncate
                      text-[13px]
                      font-medium
                      text-[var(--text-primary)]
                    "
                  >
                    {
                      sharedUsersData
                        .owner.name
                    }
                  </p>

                  <p
                    className="
                      mt-0.5
                      truncate
                      text-[11px]
                      text-[var(--text-tertiary)]
                    "
                  >
                    {
                      sharedUsersData
                        .owner.email
                    }
                  </p>
                </div>

                <span
                  className="
                    text-[12px]
                    text-[var(--text-tertiary)]
                  "
                >
                  Owner
                </span>
              </div>

              {sharedUsersData
                .sharedUsers
                .length === 0 ? (
                <div className="py-7">
                  <p
                    className="
                      text-center
                      text-[12px]
                      text-[var(--text-tertiary)]
                    "
                  >
                    No one else has
                    access yet.
                  </p>
                </div>
              ) : (
                sharedUsersData.sharedUsers.map(
                  (
                    sharedUser,
                  ) => {
                    const isRemoving =
                      removingUserId ===
                      sharedUser.user
                        .id;

                    return (
                      <div
                        key={
                          sharedUser.permissionId
                        }
                        className="
                          group flex
                          items-center
                          gap-3
                          border-b
                          border-[var(--border-subtle)]
                          py-3
                          last:border-b-0
                        "
                      >
                        <div
                          className="
                            flex h-8 w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-[var(--border-default)]
                            bg-[var(--surface-muted)]
                            text-[10px]
                            font-semibold
                            text-[var(--text-primary)]
                          "
                        >
                          {getInitials(
                            sharedUser
                              .user.name,
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className="
                              truncate
                              text-[13px]
                              font-medium
                              text-[var(--text-primary)]
                            "
                          >
                            {
                              sharedUser
                                .user.name
                            }
                          </p>

                          <p
                            className="
                              mt-0.5
                              truncate
                              text-[11px]
                              text-[var(--text-tertiary)]
                            "
                          >
                            {
                              sharedUser
                                .user.email
                            }
                          </p>
                        </div>

                        <select
                          value={
                            sharedUser.role
                          }
                          onChange={(event) =>
                            void handleRoleChange(
                              sharedUser
                                .user.email,
                              event.target
                                .value as
                                | "EDITOR"
                                | "VIEWER",
                            )
                          }
                          className="
                            h-8
                            rounded-[6px]
                            border
                            border-[var(--border-default)]
                            bg-[var(--surface-subtle)]
                            px-2
                            text-[11px]
                            font-medium
                            text-[var(--text-secondary)]
                            outline-none
                            transition-colors
                            duration-150

                            hover:border-[var(--border-strong)]

                            focus:border-[var(--accent)]
                          "
                        >
                          <option value="EDITOR">
                            Can edit
                          </option>

                          <option value="VIEWER">
                            Can view
                          </option>
                        </select>

                        <button
                          type="button"
                          disabled={
                            isRemoving
                          }
                          onClick={() =>
                            handleRemoveAccess(
                              sharedUser
                                .user.id,
                              sharedUser
                                .user.name,
                            )
                          }
                          className="
                            ml-1
                            rounded-[6px]
                            px-2 py-1.5
                            text-[11px]
                            font-medium
                            text-[var(--text-tertiary)]
                            opacity-100
                            transition-colors
                            duration-150

                            hover:bg-[var(--danger-soft)]
                            hover:text-[var(--danger)]

                            disabled:cursor-not-allowed
                            disabled:opacity-40

                            sm:opacity-0
                            sm:group-hover:opacity-100
                          "
                        >
                          {isRemoving
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    );
                  },
                )
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          className="
            flex items-center
            justify-end
            border-t
            border-[var(--border-subtle)]
            px-6 py-4
          "
        >
          <button
            type="button"
            onClick={handleClose}
            className="
              h-8
              rounded-[7px]
              border
              border-[var(--border-default)]
              bg-[var(--surface-subtle)]
              px-3
              text-[12px]
              font-medium
              text-[var(--text-secondary)]
              transition-all duration-150

              hover:border-[var(--border-strong)]
              hover:bg-[var(--surface-muted)]
              hover:text-[var(--text-primary)]

              active:translate-y-px
            "
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}