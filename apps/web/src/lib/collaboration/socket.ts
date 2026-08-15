import {
  io,
  Socket,
} from "socket.io-client";

const ACCESS_TOKEN_KEY =
  "collab-docs-access-token";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(): Socket {
  const accessToken =
    window.localStorage.getItem(
      ACCESS_TOKEN_KEY,
    );

  console.log(
    "Socket token:",
    accessToken,
  );

  if (!accessToken) {
    console.error(
      "Authentication token not found in localStorage",
    );

    throw new Error(
      "Authentication token was not found",
    );
  }

  if (
    socket &&
    currentToken !== accessToken
  ) {
    console.log(
      "JWT changed. Reconnecting socket...",
    );

    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    currentToken = accessToken;

    console.log(
      "Creating authenticated socket...",
    );

    socket = io(
      "http://localhost:4000",
      {
        transports: ["websocket"],
        auth: {
          token: accessToken,
        },
      },
    );

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket?.id,
      );
    });

    socket.on("disconnect", (reason) => {
      console.log(
        "Socket disconnected:",
        reason,
      );
    });

    socket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message,
      );
    });

    socket.on(
      "authentication-error",
      (error) => {
        console.error(
          "Authentication error:",
          error,
        );
      },
    );
  }

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();

  socket = null;
  currentToken = null;
}