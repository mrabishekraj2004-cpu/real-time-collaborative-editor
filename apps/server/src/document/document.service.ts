import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DocumentRole } from '../../generated/prisma/client';
import { CollaborationGateway } from '../collaboration/collaboration.gateway';
import { PrismaService } from '../prisma/prisma.service';

import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collaborationGateway: CollaborationGateway,
  ) {}

  async create(
    userId: string,
    createDocumentDto: CreateDocumentDto,
  ) {
    return this.prisma.document.create({
      data: {
        title: createDocumentDto.title,
        ownerId: userId,
      },
    });
  }

  async findAll(
    userId: string,
  ) {
    const documents =
      await this.prisma.document.findMany({
        where: {
          OR: [
            {
              ownerId: userId,
            },
            {
              permissions: {
                some: {
                  userId,
                },
              },
            },
          ],
        },

        include: {
          permissions: {
            where: {
              userId,
            },

            select: {
              role: true,
            },
          },
        },

        orderBy: {
          updatedAt: 'desc',
        },
      });

    return documents.map(
      (document) => {
        const {
          permissions,
          ...documentData
        } = document;

        const role =
          document.ownerId === userId
            ? DocumentRole.OWNER
            : permissions[0]?.role;

        return {
          ...documentData,
          role,
        };
      },
    );
  }

  async findOne(
    userId: string,
    documentId: string,
  ) {
    const document =
      await this.prisma.document.findUnique({
        where: {
          id: documentId,
        },

        include: {
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

    if (!document) {
      throw new NotFoundException(
        'Document not found',
      );
    }

    const role =
      document.ownerId === userId
        ? DocumentRole.OWNER
        : document.permissions[0]?.role;

    if (!role) {
      throw new ForbiddenException(
        'You do not have access to this document',
      );
    }

    const {
      permissions,
      yjsState,
      ...documentData
    } = document;

    return {
      ...documentData,

      yjsState:
        yjsState
          ? Array.from(
              yjsState,
            )
          : null,

      role,
    };
  }

  async update(
    userId: string,
    documentId: string,
    updateDocumentDto: UpdateDocumentDto,
  ) {
    const role =
      await this.getUserRole(
        userId,
        documentId,
      );

    if (
      role !== DocumentRole.OWNER &&
      role !== DocumentRole.EDITOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to edit this document',
      );
    }

    return this.prisma.document.update({
      where: {
        id: documentId,
      },

      data: {
        title:
          updateDocumentDto.title,

        content:
          updateDocumentDto.content,
      },
    });
  }

  async delete(
    userId: string,
    documentId: string,
  ) {
    await this.assertOwner(
      userId,
      documentId,
    );

    await this.prisma.document.delete({
      where: {
        id: documentId,
      },
    });

    return {
      message:
        'Document deleted successfully',
    };
  }

  async share(
    ownerId: string,
    documentId: string,
    shareDocumentDto: ShareDocumentDto,
  ) {
    const document =
      await this.assertOwner(
        ownerId,
        documentId,
      );

    const invitedUser =
      await this.prisma.user.findUnique({
        where: {
          email:
            shareDocumentDto.email,
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    if (!invitedUser) {
      throw new NotFoundException(
        'User with this email was not found',
      );
    }

    if (
      invitedUser.id ===
      document.ownerId
    ) {
      throw new BadRequestException(
        'The document owner already has full access',
      );
    }

    const permission =
      await this.prisma.documentPermission.upsert({
        where: {
          documentId_userId: {
            documentId,
            userId: invitedUser.id,
          },
        },

        create: {
          documentId,
          userId: invitedUser.id,
          role:
            shareDocumentDto.role as DocumentRole,
        },

        update: {
          role:
            shareDocumentDto.role as DocumentRole,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    this.collaborationGateway.updateUserDocumentRole(
      documentId,
      invitedUser.id,
      permission.role,
    );

    return {
      message:
        'Document shared successfully',

      permission: {
        id: permission.id,
        role: permission.role,
        user: permission.user,
      },
    };
  }

  async findSharedUsers(
    ownerId: string,
    documentId: string,
  ) {
    const document =
      await this.assertOwner(
        ownerId,
        documentId,
      );

    const permissions =
      await this.prisma.documentPermission.findMany({
        where: {
          documentId,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },

        orderBy: {
          createdAt: 'asc',
        },
      });

    return {
      owner: {
        id: document.owner.id,
        name: document.owner.name,
        email: document.owner.email,
        role: DocumentRole.OWNER,
      },

      sharedUsers:
        permissions.map(
          (permission) => ({
            permissionId:
              permission.id,

            role:
              permission.role,

            user:
              permission.user,
          }),
        ),
    };
  }

  async removeAccess(
    ownerId: string,
    documentId: string,
    sharedUserId: string,
  ) {
    const document =
      await this.assertOwner(
        ownerId,
        documentId,
      );

    if (
      sharedUserId ===
      document.ownerId
    ) {
      throw new BadRequestException(
        'The document owner cannot be removed',
      );
    }

    const result =
      await this.prisma.documentPermission.deleteMany({
        where: {
          documentId,
          userId: sharedUserId,
        },
      });

    if (
      result.count === 0
    ) {
      throw new NotFoundException(
        'Document permission was not found',
      );
    }

    this.collaborationGateway.updateUserDocumentRole(
      documentId,
      sharedUserId,
      null,
    );

    return {
      message:
        'Document access removed successfully',
    };
  }

  async createSnapshot(
    userId: string,
    documentId: string,
    createSnapshotDto: CreateSnapshotDto,
  ) {
    const role =
      await this.getUserRole(
        userId,
        documentId,
      );

    if (
      role !== DocumentRole.OWNER &&
      role !== DocumentRole.EDITOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to create a snapshot',
      );
    }

    const document =
      await this.prisma.document.findUnique({
        where: {
          id: documentId,
        },

        select: {
          id: true,
          title: true,
          content: true,
          yjsState: true,
        },
      });

    if (!document) {
      throw new NotFoundException(
        'Document not found',
      );
    }

    const snapshotCount =
      await this.prisma.documentSnapshot.count({
        where: {
          documentId,
        },
      });

    const customName =
      createSnapshotDto.name?.trim();

    const snapshotName =
      customName ||
      `Version ${snapshotCount + 1}`;

    const snapshot =
      await this.prisma.documentSnapshot.create({
        data: {
          documentId,
          createdById: userId,
          name: snapshotName,
          title: document.title,
          content: document.content,
          yjsState:
            document.yjsState,
        },

        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    return {
      id: snapshot.id,
      name: snapshot.name,
      title: snapshot.title,
      createdAt: snapshot.createdAt,
      createdBy: snapshot.createdBy,
    };
  }

  async findSnapshots(
    userId: string,
    documentId: string,
  ) {
    await this.getUserRole(
      userId,
      documentId,
    );

    return this.prisma.documentSnapshot.findMany({
      where: {
        documentId,
      },

      select: {
        id: true,
        name: true,
        title: true,
        createdAt: true,

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findSnapshot(
    userId: string,
    documentId: string,
    snapshotId: string,
  ) {
    await this.getUserRole(
      userId,
      documentId,
    );

    const snapshot =
      await this.prisma.documentSnapshot.findFirst({
        where: {
          id: snapshotId,
          documentId,
        },

        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    if (!snapshot) {
      throw new NotFoundException(
        'Document snapshot not found',
      );
    }

    return {
      id: snapshot.id,
      documentId:
        snapshot.documentId,
      name: snapshot.name,
      title: snapshot.title,
      content: snapshot.content,

      yjsState:
        snapshot.yjsState
          ? Array.from(
              snapshot.yjsState,
            )
          : null,

      createdAt:
        snapshot.createdAt,

      createdBy:
        snapshot.createdBy,
    };
  }

  async deleteSnapshot(
    userId: string,
    documentId: string,
    snapshotId: string,
  ) {
    await this.assertOwner(
      userId,
      documentId,
    );

    const snapshot =
      await this.prisma.documentSnapshot.findFirst({
        where: {
          id: snapshotId,
          documentId,
        },

        select: {
          id: true,
        },
      });

    if (!snapshot) {
      throw new NotFoundException(
        'Document snapshot not found',
      );
    }

    await this.prisma.documentSnapshot.delete({
      where: {
        id: snapshot.id,
      },
    });

    return {
      message:
        'Snapshot deleted successfully',
    };
  }

  async createBranch(
    userId: string,
    documentId: string,
    createBranchDto: CreateBranchDto,
  ) {
    const role =
      await this.getUserRole(
        userId,
        documentId,
      );

    if (
      role !== DocumentRole.OWNER &&
      role !== DocumentRole.EDITOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to create a branch',
      );
    }

    const name =
      createBranchDto.name.trim();

    if (!name) {
      throw new BadRequestException(
        'Branch name is required',
      );
    }

    const existingBranch =
      await this.prisma.documentBranch.findFirst({
        where: {
          documentId,
          name,
        },

        select: {
          id: true,
        },
      });

    if (existingBranch) {
      throw new BadRequestException(
        'A branch with this name already exists',
      );
    }

    let sourceSnapshotId:
      | string
      | null = null;

    let title = '';
    let content = '';

    let yjsState:
      | Uint8Array<ArrayBuffer>
      | null = null;

    if (
      createBranchDto.sourceSnapshotId
    ) {
      const snapshot =
        await this.prisma.documentSnapshot.findFirst({
          where: {
            id:
              createBranchDto.sourceSnapshotId,

            documentId,
          },

          select: {
            id: true,
            title: true,
            content: true,
            yjsState: true,
          },
        });

      if (!snapshot) {
        throw new NotFoundException(
          'Source snapshot not found',
        );
      }

      sourceSnapshotId =
        snapshot.id;

      title =
        snapshot.title;

      content =
        snapshot.content;

      yjsState =
        snapshot.yjsState
          ? new Uint8Array(
              snapshot.yjsState,
            )
          : null;
    } else {
      const document =
        await this.prisma.document.findUnique({
          where: {
            id: documentId,
          },

          select: {
            title: true,
            content: true,
            yjsState: true,
          },
        });

      if (!document) {
        throw new NotFoundException(
          'Document not found',
        );
      }

      title =
        document.title;

      content =
        document.content;

      yjsState =
        document.yjsState
          ? new Uint8Array(
              document.yjsState,
            )
          : null;
    }

    const branch =
      await this.prisma.documentBranch.create({
        data: {
          documentId,
          createdById: userId,
          sourceSnapshotId,
          name,
          title,
          content,
          yjsState,
        },
      });

    const creator =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    if (!creator) {
      throw new NotFoundException(
        'Branch creator was not found',
      );
    }

    return {
      id: branch.id,

      documentId:
        branch.documentId,

      sourceSnapshotId:
        branch.sourceSnapshotId,

      name:
        branch.name,

      title:
        branch.title,

      createdAt:
        branch.createdAt,

      updatedAt:
        branch.updatedAt,

      createdBy:
        creator,
    };
  }

  async findBranches(
    userId: string,
    documentId: string,
  ) {
    await this.getUserRole(
      userId,
      documentId,
    );

    const branches =
      await this.prisma.documentBranch.findMany({
        where: {
          documentId,
        },

        orderBy: {
          updatedAt: 'desc',
        },
      });

    const creatorIds =
      Array.from(
        new Set(
          branches.map(
            (branch) =>
              branch.createdById,
          ),
        ),
      );

    const creators =
      await this.prisma.user.findMany({
        where: {
          id: {
            in: creatorIds,
          },
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    const creatorMap =
      new Map(
        creators.map(
          (creator) => [
            creator.id,
            creator,
          ],
        ),
      );

    return branches.map(
      (branch) => ({
        id: branch.id,

        documentId:
          branch.documentId,

        sourceSnapshotId:
          branch.sourceSnapshotId,

        name:
          branch.name,

        title:
          branch.title,

        createdAt:
          branch.createdAt,

        updatedAt:
          branch.updatedAt,

        createdBy:
          creatorMap.get(
            branch.createdById,
          ) ?? null,
      }),
    );
  }

  async findBranch(
    userId: string,
    documentId: string,
    branchId: string,
  ) {
    await this.getUserRole(
      userId,
      documentId,
    );

    const branch =
      await this.prisma.documentBranch.findFirst({
        where: {
          id: branchId,
          documentId,
        },
      });

    if (!branch) {
      throw new NotFoundException(
        'Document branch not found',
      );
    }

    const creator =
      await this.prisma.user.findUnique({
        where: {
          id:
            branch.createdById,
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    return {
      id: branch.id,

      documentId:
        branch.documentId,

      sourceSnapshotId:
        branch.sourceSnapshotId,

      name:
        branch.name,

      title:
        branch.title,

      content:
        branch.content,

      yjsState:
        branch.yjsState
          ? Array.from(
              branch.yjsState,
            )
          : null,

      createdAt:
        branch.createdAt,

      updatedAt:
        branch.updatedAt,

      createdBy:
        creator,
    };
  }

  async deleteBranch(
    userId: string,
    documentId: string,
    branchId: string,
  ) {
    await this.assertOwner(
      userId,
      documentId,
    );

    const branch =
      await this.prisma.documentBranch.findFirst({
        where: {
          id: branchId,
          documentId,
        },

        select: {
          id: true,
        },
      });

    if (!branch) {
      throw new NotFoundException(
        'Document branch not found',
      );
    }

    await this.prisma.documentBranch.delete({
      where: {
        id: branch.id,
      },
    });

    return {
      message:
        'Branch deleted successfully',
    };
  }

  private async getUserRole(
    userId: string,
    documentId: string,
  ): Promise<DocumentRole> {
    const document =
      await this.prisma.document.findUnique({
        where: {
          id: documentId,
        },

        select: {
          ownerId: true,

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

    if (!document) {
      throw new NotFoundException(
        'Document not found',
      );
    }

    if (
      document.ownerId ===
      userId
    ) {
      return DocumentRole.OWNER;
    }

    const role =
      document.permissions[0]?.role;

    if (!role) {
      throw new ForbiddenException(
        'You do not have access to this document',
      );
    }

    return role;
  }

  private async assertOwner(
    userId: string,
    documentId: string,
  ) {
    const document =
      await this.prisma.document.findUnique({
        where: {
          id: documentId,
        },

        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    if (!document) {
      throw new NotFoundException(
        'Document not found',
      );
    }

    if (
      document.ownerId !==
      userId
    ) {
      throw new ForbiddenException(
        'Only the document owner can perform this action',
      );
    }

    return document;
  }
}