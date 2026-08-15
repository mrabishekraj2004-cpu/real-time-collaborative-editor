import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import {
  JwtService,
} from '@nestjs/jwt';

import {
  Server,
  Socket,
} from 'socket.io';

import * as Y from 'yjs';

import {
  DocumentRole,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
}

interface AuthenticatedSocketUser {
  id: string;
  name: string;
  email: string;
}

interface CollaborationTargetPayload {
  documentId: string;
  branchId?: string | null;
}

interface YjsUpdatePayload
  extends CollaborationTargetPayload {
  update: number[];
}

interface AwarenessUpdatePayload
  extends CollaborationTargetPayload {
  update: number[];
}

interface OnlineUser {
  socketId: string;
  id: string;
  name: string;
  color: string;
  role: DocumentRole;
}

interface ClientDocumentAccess {
  documentId: string;
  branchId: string | null;
  roomId: string;
  userId: string;
  role: DocumentRole;
}

interface DocumentAccess {
  content: string;
  yjsState: Uint8Array | null;
  role: DocumentRole;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  },
})
export class CollaborationGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly documents =
    new Map<
      string,
      Y.Doc
    >();

  private readonly documentUsers =
    new Map<
      string,
      Map<
        string,
        OnlineUser
      >
    >();

  private readonly clientDocuments =
    new Map<
      string,
      ClientDocumentAccess
    >();

  constructor(
    private readonly prisma:
      PrismaService,

    private readonly jwtService:
      JwtService,
  ) {}

  async handleConnection(
    client: Socket,
  ) {
    try {
      const user =
        await this.getAuthenticatedUser(
          client,
        );

      console.log(
        `Authenticated client connected: ${client.id} (${user.email})`,
      );
    } catch (error) {
      console.log(
        `Socket authentication failed: ${client.id}`,
      );

      client.emit(
        'authentication-error',
        {
          message:
            error instanceof Error
              ? error.message
              : 'Authentication failed',
        },
      );

      client.disconnect(
        true,
      );
    }
  }

  handleDisconnect(
    client: Socket,
  ) {
    const access =
      this.clientDocuments.get(
        client.id,
      );

    if (
      access
    ) {
      this.removeUserFromRoom(
        access,
        client.id,
      );
    }

    this.clientDocuments.delete(
      client.id,
    );

    console.log(
      `Client disconnected: ${client.id}`,
    );
  }

  @SubscribeMessage(
    'join-document',
  )
  async handleJoinDocument(
    @MessageBody()
    payload:
      CollaborationTargetPayload,

    @ConnectedSocket()
    client: Socket,
  ) {
    let authenticatedUser:
      AuthenticatedSocketUser;

    try {
      authenticatedUser =
        await this.getAuthenticatedUser(
          client,
        );
    } catch (error) {
      return {
        event:
          'join-document-error',

        data: {
          message:
            error instanceof Error
              ? error.message
              : 'You are not authenticated',
        },
      };
    }

    const documentId =
      payload?.documentId;

    const branchId =
      payload?.branchId ??
      null;

    if (
      !documentId
    ) {
      return {
        event:
          'join-document-error',

        data: {
          message:
            'Document ID is required',
        },
      };
    }

    const access =
      await this.getCollaborationAccess(
        authenticatedUser.id,
        documentId,
        branchId,
      );

    if (
      !access
    ) {
      return {
        event:
          'join-document-error',

        data: {
          message:
            branchId
              ? 'You do not have access to this branch'
              : 'You do not have access to this document',
        },
      };
    }

    const roomId =
      this.getRoomId(
        documentId,
        branchId,
      );

    const previousAccess =
      this.clientDocuments.get(
        client.id,
      );

    if (
      previousAccess &&
      previousAccess.roomId !==
        roomId
    ) {
      client.leave(
        previousAccess.roomId,
      );

      this.removeUserFromRoom(
        previousAccess,
        client.id,
      );
    }

    client.join(
      roomId,
    );

    this.clientDocuments.set(
      client.id,
      {
        documentId,
        branchId,
        roomId,

        userId:
          authenticatedUser.id,

        role:
          access.role,
      },
    );

    if (
      !this.documents.has(
        roomId,
      )
    ) {
      const ydoc =
        new Y.Doc();

      if (
        access.yjsState &&
        access.yjsState.length >
          0
      ) {
        Y.applyUpdate(
          ydoc,
          new Uint8Array(
            access.yjsState,
          ),
        );

        console.log(
          `Restored Yjs state for ${roomId}`,
        );
      } else {
        const sharedText =
          ydoc.getText(
            'content',
          );

        if (
          access.content
        ) {
          sharedText.insert(
            0,
            access.content,
          );
        }

        console.log(
          `Loaded legacy content for ${roomId}`,
        );
      }

      this.documents.set(
        roomId,
        ydoc,
      );

      console.log(
        `Created Y.Doc for ${roomId}`,
      );
    }

    const ydoc =
      this.documents.get(
        roomId,
      );

    if (
      !ydoc
    ) {
      return {
        event:
          'join-document-error',

        data: {
          message:
            'Unable to initialize the document',
        },
      };
    }

    this.addUserToRoom(
      roomId,
      {
        socketId:
          client.id,

        id:
          authenticatedUser.id,

        name:
          authenticatedUser.name,

        color:
          this.generateUserColor(
            authenticatedUser.id,
          ),

        role:
          access.role,
      },
    );

    const initialState =
      Y.encodeStateAsUpdate(
        ydoc,
      );

    client.emit(
      'document-state',
      {
        documentId,
        branchId,

        update:
          Array.from(
            initialState,
          ),
      },
    );

    this.broadcastOnlineUsers(
      documentId,
      branchId,
      roomId,
    );

    console.log(
      `Client ${client.id} joined ${roomId} as ${access.role}`,
    );

    return {
      event:
        'joined-document',

      data: {
        documentId,
        branchId,

        role:
          access.role,
      },
    };
  }

  @SubscribeMessage(
    'leave-document',
  )
  handleLeaveDocument(
    @MessageBody()
    payload:
      CollaborationTargetPayload,

    @ConnectedSocket()
    client: Socket,
  ) {
    const access =
      this.clientDocuments.get(
        client.id,
      );

    if (
      !access
    ) {
      return;
    }

    if (
      access.documentId !==
        payload.documentId ||
      access.branchId !==
        (
          payload.branchId ??
          null
        )
    ) {
      return;
    }

    client.leave(
      access.roomId,
    );

    this.removeUserFromRoom(
      access,
      client.id,
    );

    this.clientDocuments.delete(
      client.id,
    );
  }

  @SubscribeMessage(
    'awareness-update',
  )
  async handleAwarenessUpdate(
    @MessageBody()
    data:
      AwarenessUpdatePayload,

    @ConnectedSocket()
    client: Socket,
  ) {
    try {
      await this.getAuthenticatedUser(
        client,
      );
    } catch (error) {
      client.emit(
        'collaboration-error',
        {
          message:
            error instanceof Error
              ? error.message
              : 'You are not authenticated',
        },
      );

      return;
    }

    const branchId =
      data.branchId ??
      null;

    const access =
      this.clientDocuments.get(
        client.id,
      );

    if (
      !access ||
      access.documentId !==
        data.documentId ||
      access.branchId !==
        branchId
    ) {
      client.emit(
        'collaboration-error',
        {
          message:
            'You have not joined this collaboration room',
        },
      );

      return;
    }

    if (
      !Array.isArray(
        data.update,
      )
    ) {
      client.emit(
        'collaboration-error',
        {
          message:
            'Invalid awareness update',
        },
      );

      return;
    }

    client
      .to(
        access.roomId,
      )
      .emit(
        'awareness-update',
        {
          documentId:
            data.documentId,

          branchId,

          update:
            data.update,
        },
      );
  }

  @SubscribeMessage(
    'awareness-request',
  )
  async handleAwarenessRequest(
    @MessageBody()
    data:
      CollaborationTargetPayload,

    @ConnectedSocket()
    client: Socket,
  ) {
    try {
      await this.getAuthenticatedUser(
        client,
      );
    } catch {
      return;
    }

    const branchId =
      data.branchId ??
      null;

    const access =
      this.clientDocuments.get(
        client.id,
      );

    if (
      !access ||
      access.documentId !==
        data.documentId ||
      access.branchId !==
        branchId
    ) {
      return;
    }

    client
      .to(
        access.roomId,
      )
      .emit(
        'awareness-request',
        {
          documentId:
            data.documentId,

          branchId,
        },
      );
  }

  @SubscribeMessage(
    'yjs-update',
  )
  async handleYjsUpdate(
    @MessageBody()
    data:
      YjsUpdatePayload,

    @ConnectedSocket()
    client: Socket,
  ) {
    let authenticatedUser:
      AuthenticatedSocketUser;

    try {
      authenticatedUser =
        await this.getAuthenticatedUser(
          client,
        );
    } catch (error) {
      client.emit(
        'collaboration-error',
        {
          message:
            error instanceof Error
              ? error.message
              : 'You are not authenticated',
        },
      );

      return;
    }

    const branchId =
      data.branchId ??
      null;

    const access =
      this.clientDocuments.get(
        client.id,
      );

    if (
      !access ||
      access.documentId !==
        data.documentId ||
      access.branchId !==
        branchId
    ) {
      client.emit(
        'collaboration-error',
        {
          message:
            'You have not joined this collaboration room',
        },
      );

      return;
    }

    const currentAccess =
  await this.getCollaborationAccess(
    authenticatedUser.id,
    data.documentId,
    branchId,
  );

if (
  !currentAccess ||
  (
    currentAccess.role !==
      DocumentRole.OWNER &&
    currentAccess.role !==
      DocumentRole.EDITOR
  )
) {
  client.emit(
    'collaboration-error',
    {
      message:
        'You do not have permission to edit this document',
    },
  );

  return;
}

access.role =
  currentAccess.role;

    if (
      !Array.isArray(
        data.update,
      )
    ) {
      client.emit(
        'collaboration-error',
        {
          message:
            'Invalid collaboration update',
        },
      );

      return;
    }

    const ydoc =
      this.documents.get(
        access.roomId,
      );

    if (
      !ydoc
    ) {
      client.emit(
        'collaboration-error',
        {
          message:
            'The collaboration document was not found',
        },
      );

      return;
    }

    const update =
      new Uint8Array(
        data.update,
      );

    Y.applyUpdate(
      ydoc,
      update,
    );

    client
      .to(
        access.roomId,
      )
      .emit(
        'yjs-update',
        {
          documentId:
            data.documentId,

          branchId,

          update:
            data.update,
        },
      );

    const content =
      ydoc
        .getText(
          'content',
        )
        .toString();

    const yjsState =
      Y.encodeStateAsUpdate(
        ydoc,
      );

    if (
      branchId
    ) {
      await this.prisma.documentBranch.update({
        where: {
          id:
            branchId,
        },

        data: {
          content,

          yjsState:
            Buffer.from(
              yjsState,
            ),
        },
      });

      console.log(
        `Saved branch ${branchId} from ${authenticatedUser.email}`,
      );

      return;
    }

    await this.prisma.document.update({
      where: {
        id:
          data.documentId,
      },

      data: {
        content,

        yjsState:
          Buffer.from(
            yjsState,
          ),
      },
    });

    console.log(
      `Saved document ${data.documentId} from ${authenticatedUser.email}`,
    );
  }

  private getRoomId(
    documentId: string,
    branchId:
      | string
      | null,
  ): string {
    if (
      branchId
    ) {
      return `branch:${documentId}:${branchId}`;
    }

    return `document:${documentId}`;
  }

  private async getCollaborationAccess(
    userId: string,
    documentId: string,
    branchId:
      | string
      | null,
  ): Promise<
    DocumentAccess | null
  > {
    const document =
      await this.prisma.document.findUnique({
        where: {
          id:
            documentId,
        },

        select: {
          ownerId: true,
          content: true,
          yjsState: true,

          permissions: {
            where: {
              userId,
            },

            select: {
              role: true,
            },
          },
        },
      });

    if (
      !document
    ) {
      return null;
    }

    let role:
      | DocumentRole
      | null =
      null;

    if (
      document.ownerId ===
      userId
    ) {
      role =
        DocumentRole.OWNER;
    } else {
      role =
        document.permissions[0]
          ?.role ??
        null;
    }

    if (
      !role
    ) {
      return null;
    }

    if (
      !branchId
    ) {
      return {
        content:
          document.content,

        yjsState:
          document.yjsState,

        role,
      };
    }

    const branch =
      await this.prisma.documentBranch.findFirst({
        where: {
          id:
            branchId,

          documentId,
        },

        select: {
          content: true,
          yjsState: true,
        },
      });

    if (
      !branch
    ) {
      return null;
    }

    return {
      content:
        branch.content,

      yjsState:
        branch.yjsState,

      role,
    };
  }

  private async getAuthenticatedUser(
    client: Socket,
  ): Promise<
    AuthenticatedSocketUser
  > {
    const existingUser =
      client.data.user as
        | AuthenticatedSocketUser
        | undefined;

    if (
      existingUser
    ) {
      return existingUser;
    }

    const existingPromise =
      client.data.authPromise as
        | Promise<
            AuthenticatedSocketUser
          >
        | undefined;

    if (
      existingPromise
    ) {
      return existingPromise;
    }

    const authPromise =
      this.authenticateSocket(
        client,
      );

    client.data.authPromise =
      authPromise;

    try {
      const user =
        await authPromise;

      client.data.user =
        user;

      return user;
    } finally {
      delete client.data
        .authPromise;
    }
  }

  private async authenticateSocket(
    client: Socket,
  ): Promise<
    AuthenticatedSocketUser
  > {
    const token =
      this.extractToken(
        client,
      );

    if (
      !token
    ) {
      throw new Error(
        'Authentication token is required',
      );
    }

    let payload:
      JwtPayload;

    try {
      payload =
        await this.jwtService.verifyAsync<JwtPayload>(
          token,
        );
    } catch {
      throw new Error(
        'Invalid or expired authentication token',
      );
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            payload.sub,
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    if (
      !user
    ) {
      throw new Error(
        'Authenticated user was not found',
      );
    }

    return user;
  }

  private extractToken(
    client: Socket,
  ): string | null {
    const authToken =
      client.handshake.auth
        ?.token;

    if (
      typeof authToken ===
        'string' &&
      authToken.length >
        0
    ) {
      return authToken;
    }

    const authorizationHeader =
      client.handshake.headers
        .authorization;

    if (
      typeof authorizationHeader ===
        'string' &&
      authorizationHeader.startsWith(
        'Bearer ',
      )
    ) {
      return authorizationHeader.slice(
        7,
      );
    }

    return null;
  }

  updateUserDocumentRole(
    documentId: string,
    userId: string,
    role: DocumentRole | null,
  ) {
    for (
      const [
        socketId,
        access,
      ] of this.clientDocuments
    ) {
      if (
        access.documentId !==
          documentId ||
        access.userId !==
          userId
      ) {
        continue;
      }

      const socket =
        this.server.sockets.sockets.get(
          socketId,
        );

      if (
        role ===
        null
      ) {
        this.removeUserFromRoom(
          access,
          socketId,
        );

        this.clientDocuments.delete(
          socketId,
        );

        socket?.leave(
          access.roomId,
        );

        socket?.emit(
          'access-revoked',
          {
            documentId,
            branchId:
              access.branchId,
          },
        );

        continue;
      }

      access.role =
        role;

      const users =
        this.documentUsers.get(
          access.roomId,
        );

      const onlineUser =
        users?.get(
          socketId,
        );

      if (
        onlineUser
      ) {
        onlineUser.role =
          role;
      }

      socket?.emit(
        'permission-changed',
        {
          documentId,
          branchId:
            access.branchId,
          role,
        },
      );

      this.broadcastOnlineUsers(
        access.documentId,
        access.branchId,
        access.roomId,
      );
    }
  }

  private addUserToRoom(
    roomId: string,
    user: OnlineUser,
  ) {
    if (
      !this.documentUsers.has(
        roomId,
      )
    ) {
      this.documentUsers.set(
        roomId,
        new Map(),
      );
    }

    this.documentUsers
      .get(
        roomId,
      )
      ?.set(
        user.socketId,
        user,
      );
  }

  private removeUserFromRoom(
    access:
      ClientDocumentAccess,
    socketId: string,
  ) {
    const users =
      this.documentUsers.get(
        access.roomId,
      );

    if (
      !users
    ) {
      return;
    }

    users.delete(
      socketId,
    );

    if (
      users.size ===
        0
    ) {
      this.documentUsers.delete(
        access.roomId,
      );
    }

    this.broadcastOnlineUsers(
      access.documentId,
      access.branchId,
      access.roomId,
    );
  }

  private broadcastOnlineUsers(
    documentId: string,
    branchId:
      | string
      | null,
    roomId: string,
  ) {
    const users =
      this.documentUsers.get(
        roomId,
      );

    const onlineUsers =
      users
        ? Array.from(
            users.values(),
          )
        : [];

    this.server
      .to(
        roomId,
      )
      .emit(
        'online-users',
        {
          documentId,
          branchId,

          users:
            onlineUsers,
        },
      );

    console.log(
      `Online users in ${roomId}: ${onlineUsers.length}`,
    );
  }

  private generateUserColor(
    userId: string,
  ): string {
    const colors = [
      '#E53935',
      '#8E24AA',
      '#3949AB',
      '#039BE5',
      '#00897B',
      '#43A047',
      '#F4511E',
      '#6D4C41',
    ];

    let total =
      0;

    for (
      const character of userId
    ) {
      total +=
        character.charCodeAt(
          0,
        );
    }

    return colors[
      total %
        colors.length
    ];
  }
}
