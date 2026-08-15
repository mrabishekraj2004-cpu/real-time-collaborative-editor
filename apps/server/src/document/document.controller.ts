import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { ShareDocumentDto } from './dto/share-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentService } from './document.service';

interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
  ) {}

  @Post()
  create(
    @Req() request: Request,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.create(
      user.id,
      createDocumentDto,
    );
  }

  @Get()
  findAll(
    @Req() request: Request,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.findAll(
      user.id,
    );
  }

  @Get(':id')
  findOne(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.findOne(
      user.id,
      id,
    );
  }

  @Patch(':id')
  update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.update(
      user.id,
      id,
      updateDocumentDto,
    );
  }

  @Delete(':id')
  delete(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.delete(
      user.id,
      id,
    );
  }

  @Post(':id/share')
  share(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() shareDocumentDto: ShareDocumentDto,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.share(
      user.id,
      id,
      shareDocumentDto,
    );
  }

  @Get(':id/share')
  findSharedUsers(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.findSharedUsers(
      user.id,
      id,
    );
  }

  @Delete(':id/share/:userId')
  removeAccess(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('userId') sharedUserId: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.removeAccess(
      user.id,
      id,
      sharedUserId,
    );
  }

  @Post(':id/snapshots')
  createSnapshot(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() createSnapshotDto: CreateSnapshotDto,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.createSnapshot(
      user.id,
      id,
      createSnapshotDto,
    );
  }

  @Get(':id/snapshots')
  findSnapshots(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.findSnapshots(
      user.id,
      id,
    );
  }

  @Get(':id/snapshots/:snapshotId')
  findSnapshot(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('snapshotId') snapshotId: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.findSnapshot(
      user.id,
      id,
      snapshotId,
    );
  }

  @Delete(':id/snapshots/:snapshotId')
  deleteSnapshot(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('snapshotId') snapshotId: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.deleteSnapshot(
      user.id,
      id,
      snapshotId,
    );
  }

  @Post(':id/branches')
  createBranch(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() createBranchDto: CreateBranchDto,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.createBranch(
      user.id,
      id,
      createBranchDto,
    );
  }

  @Get(':id/branches')
  findBranches(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.findBranches(
      user.id,
      id,
    );
  }

  @Get(':id/branches/:branchId')
  findBranch(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('branchId') branchId: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.findBranch(
      user.id,
      id,
      branchId,
    );
  }

  @Delete(':id/branches/:branchId')
  deleteBranch(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('branchId') branchId: string,
  ) {
    const user =
      request.user as AuthenticatedUser;

    return this.documentService.deleteBranch(
      user.id,
      id,
      branchId,
    );
  }
}