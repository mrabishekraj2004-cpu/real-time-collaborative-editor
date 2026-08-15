import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { DocumentModule } from './document/document.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DocumentModule,
    CollaborationModule,
  ],
})
export class AppModule {}