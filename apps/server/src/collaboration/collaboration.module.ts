import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CollaborationGateway } from './collaboration.gateway';

@Module({
  imports: [PrismaModule],
  providers: [CollaborationGateway],
  exports: [CollaborationGateway],
})
export class CollaborationModule {}