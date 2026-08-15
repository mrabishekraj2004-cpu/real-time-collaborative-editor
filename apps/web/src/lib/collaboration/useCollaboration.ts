import {
  useEffect,
  useMemo,
} from "react";

import type {
  Socket,
} from "socket.io-client";

import * as Y from "yjs";

import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";

import {
  getSocket,
} from "./socket";

interface OnlineUser {
  socketId: string;
  id: string;
  name: string;
  color: string;

  role?:
    | "OWNER"
    | "EDITOR"
    | "VIEWER";
}

interface CollaborationUser {
  id: string;
  name: string;
  color: string;
}

interface UseCollaborationOptions {
  documentId: string;

  branchId?:
    | string
    | null;

  ydoc: Y.Doc;

  user?:
    CollaborationUser;

  onOnlineUsersChange?: (
    users:
      OnlineUser[],
  ) => void;
}

interface CollaborationUpdate {
  documentId: string;

  branchId?:
    | string
    | null;

  update: number[];
}

interface AwarenessUpdateEvent {
  documentId: string;

  branchId?:
    | string
    | null;

  update: number[];
}

interface AwarenessRequestEvent {
  documentId: string;

  branchId?:
    | string
    | null;
}

interface OnlineUsersEvent {
  documentId: string;

  branchId?:
    | string
    | null;

  users:
    OnlineUser[];
}

interface JoinedDocumentEvent {
  documentId: string;

  branchId?:
    | string
    | null;

  role?:
    | "OWNER"
    | "EDITOR"
    | "VIEWER";
}

interface CollaborationError {
  message: string;
}

const REMOTE_UPDATE_ORIGIN =
  "remote-update";

const REMOTE_AWARENESS_ORIGIN =
  "remote-awareness";

function isSameTarget(
  eventDocumentId: string,

  eventBranchId:
    | string
    | null
    | undefined,

  documentId: string,

  branchId:
    | string
    | null
    | undefined,
) {
  return (
    eventDocumentId ===
      documentId &&
    (
      eventBranchId ??
      null
    ) ===
      (
        branchId ??
        null
      )
  );
}

function getRemoteAwarenessClientIds(
  awareness:
    Awareness,
): number[] {
  return Array.from(
    awareness
      .getStates()
      .keys(),
  ).filter(
    (clientId) =>
      clientId !==
      awareness.clientID,
  );
}

export function useCollaboration({
  documentId,
  branchId = null,
  ydoc,
  user,
  onOnlineUsersChange,
}: UseCollaborationOptions) {
  const awareness =
    useMemo(
      () =>
        new Awareness(
          ydoc,
        ),
      [
        ydoc,
      ],
    );

  useEffect(() => {
    let socket:
      Socket;

    let hasJoinedRoom =
      false;

    let disposed =
      false;

    try {
      socket =
        getSocket();
    } catch (error) {
      console.error(
        "Unable to create collaboration socket:",
        error,
      );

      return;
    }

    if (
      user
    ) {
      awareness.setLocalStateField(
        "user",
        {
          id:
            user.id,

          name:
            user.name,

          color:
            user.color,
        },
      );
    } else {
      awareness.setLocalStateField(
        "user",
        null,
      );
    }

    function joinRoom() {
      if (
        disposed ||
        !socket.connected
      ) {
        return;
      }

      hasJoinedRoom =
        false;

      socket.emit(
        "join-document",
        {
          documentId,
          branchId,
        },
      );
    }

    function sendLocalAwarenessState() {
      if (
        !socket.connected ||
        !hasJoinedRoom
      ) {
        return;
      }

      const update =
        encodeAwarenessUpdate(
          awareness,
          [
            awareness.clientID,
          ],
        );

      socket.emit(
        "awareness-update",
        {
          documentId,
          branchId,

          update:
            Array.from(
              update,
            ),
        },
      );
    }

    const handleConnect =
      () => {
        joinRoom();
      };

    const handleDisconnect =
      () => {
        hasJoinedRoom =
          false;

        onOnlineUsersChange?.(
          [],
        );

        const remoteClientIds =
          getRemoteAwarenessClientIds(
            awareness,
          );

        if (
          remoteClientIds.length >
          0
        ) {
          removeAwarenessStates(
            awareness,
            remoteClientIds,
            REMOTE_AWARENESS_ORIGIN,
          );
        }
      };

    const sendUpdate = (
      update:
        Uint8Array,

      origin:
        unknown,
    ) => {
      if (
        origin ===
        REMOTE_UPDATE_ORIGIN
      ) {
        return;
      }

      if (
        !socket.connected ||
        !hasJoinedRoom
      ) {
        return;
      }

      socket.emit(
        "yjs-update",
        {
          documentId,
          branchId,

          update:
            Array.from(
              update,
            ),
        },
      );
    };

    const sendAwarenessUpdate =
      (
        changes: {
          added:
            number[];

          updated:
            number[];

          removed:
            number[];
        },

        origin:
          unknown,
      ) => {
        if (
          origin ===
          REMOTE_AWARENESS_ORIGIN
        ) {
          return;
        }

        if (
          !socket.connected ||
          !hasJoinedRoom
        ) {
          return;
        }

        const changedClients =
          [
            ...changes.added,
            ...changes.updated,
            ...changes.removed,
          ];

        if (
          changedClients.length ===
          0
        ) {
          return;
        }

        const update =
          encodeAwarenessUpdate(
            awareness,
            changedClients,
          );

        socket.emit(
          "awareness-update",
          {
            documentId,
            branchId,

            update:
              Array.from(
                update,
              ),
          },
        );
      };

    const applyRemoteUpdate =
      (
        data:
          CollaborationUpdate,
      ) => {
        if (
          !isSameTarget(
            data.documentId,
            data.branchId,
            documentId,
            branchId,
          )
        ) {
          return;
        }

        Y.applyUpdate(
          ydoc,
          new Uint8Array(
            data.update,
          ),
          REMOTE_UPDATE_ORIGIN,
        );
      };

    const applyRemoteAwarenessUpdate =
      (
        data:
          AwarenessUpdateEvent,
      ) => {
        if (
          !isSameTarget(
            data.documentId,
            data.branchId,
            documentId,
            branchId,
          )
        ) {
          return;
        }

        if (
          !Array.isArray(
            data.update,
          )
        ) {
          return;
        }

        applyAwarenessUpdate(
          awareness,
          new Uint8Array(
            data.update,
          ),
          REMOTE_AWARENESS_ORIGIN,
        );
      };

    const handleAwarenessRequest =
      (
        data:
          AwarenessRequestEvent,
      ) => {
        if (
          !isSameTarget(
            data.documentId,
            data.branchId,
            documentId,
            branchId,
          )
        ) {
          return;
        }

        sendLocalAwarenessState();
      };

    const handleOnlineUsers =
      (
        data:
          OnlineUsersEvent,
      ) => {
        if (
          !isSameTarget(
            data.documentId,
            data.branchId,
            documentId,
            branchId,
          )
        ) {
          return;
        }

        onOnlineUsersChange?.(
          data.users,
        );
      };

    const handleJoinedDocument =
      (
        data:
          JoinedDocumentEvent,
      ) => {
        if (
          !isSameTarget(
            data.documentId,
            data.branchId,
            documentId,
            branchId,
          )
        ) {
          return;
        }

        hasJoinedRoom =
          true;

        sendLocalAwarenessState();

        socket.emit(
          "awareness-request",
          {
            documentId,
            branchId,
          },
        );
      };

    const handleJoinError =
      (
        error:
          CollaborationError,
      ) => {
        hasJoinedRoom =
          false;

        console.error(
          "Collaboration join error:",
          error.message,
        );
      };

    const handleCollaborationError =
      (
        error:
          CollaborationError,
      ) => {
        console.error(
          "Collaboration error:",
          error.message,
        );

        if (
          error.message ===
          "You have not joined this collaboration room"
        ) {
          hasJoinedRoom =
            false;

          joinRoom();
        }
      };

    const handleAuthenticationError =
      (
        error:
          CollaborationError,
      ) => {
        hasJoinedRoom =
          false;

        console.error(
          "Collaboration authentication error:",
          error.message,
        );
      };

    socket.on(
      "connect",
      handleConnect,
    );

    socket.on(
      "disconnect",
      handleDisconnect,
    );

    socket.on(
      "document-state",
      applyRemoteUpdate,
    );

    socket.on(
      "yjs-update",
      applyRemoteUpdate,
    );

    socket.on(
      "awareness-update",
      applyRemoteAwarenessUpdate,
    );

    socket.on(
      "awareness-request",
      handleAwarenessRequest,
    );

    socket.on(
      "online-users",
      handleOnlineUsers,
    );

    socket.on(
      "joined-document",
      handleJoinedDocument,
    );

    socket.on(
      "join-document-error",
      handleJoinError,
    );

    socket.on(
      "collaboration-error",
      handleCollaborationError,
    );

    socket.on(
      "authentication-error",
      handleAuthenticationError,
    );

    ydoc.on(
      "update",
      sendUpdate,
    );

    awareness.on(
      "update",
      sendAwarenessUpdate,
    );

    if (
      socket.connected
    ) {
      joinRoom();
    }

    return () => {
      disposed =
        true;

      const shouldLeave =
        socket.connected &&
        hasJoinedRoom;

      if (
        shouldLeave
      ) {
        awareness.setLocalState(
          null,
        );
      }

      hasJoinedRoom =
        false;

      if (
        shouldLeave
      ) {
        socket.emit(
          "leave-document",
          {
            documentId,
            branchId,
          },
        );
      }

      const remoteClientIds =
        getRemoteAwarenessClientIds(
          awareness,
        );

      if (
        remoteClientIds.length >
        0
      ) {
        removeAwarenessStates(
          awareness,
          remoteClientIds,
          REMOTE_AWARENESS_ORIGIN,
        );
      }

      ydoc.off(
        "update",
        sendUpdate,
      );

      awareness.off(
        "update",
        sendAwarenessUpdate,
      );

      socket.off(
        "connect",
        handleConnect,
      );

      socket.off(
        "disconnect",
        handleDisconnect,
      );

      socket.off(
        "document-state",
        applyRemoteUpdate,
      );

      socket.off(
        "yjs-update",
        applyRemoteUpdate,
      );

      socket.off(
        "awareness-update",
        applyRemoteAwarenessUpdate,
      );

      socket.off(
        "awareness-request",
        handleAwarenessRequest,
      );

      socket.off(
        "online-users",
        handleOnlineUsers,
      );

      socket.off(
        "joined-document",
        handleJoinedDocument,
      );

      socket.off(
        "join-document-error",
        handleJoinError,
      );

      socket.off(
        "collaboration-error",
        handleCollaborationError,
      );

      socket.off(
        "authentication-error",
        handleAuthenticationError,
      );
    };
  }, [
    documentId,
    branchId,
    ydoc,
    awareness,
    user?.id,
    user?.name,
    user?.color,
    onOnlineUsersChange,
  ]);

  return {
    awareness,
  };
}