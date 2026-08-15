import { Module } from '@nestjs/common';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [
    PrismaModule,
    CollaborationModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
