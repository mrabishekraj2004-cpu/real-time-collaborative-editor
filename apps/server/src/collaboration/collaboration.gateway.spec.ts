import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CollaborationGateway } from './collaboration.gateway';

describe('CollaborationGateway', () => {
  let gateway: CollaborationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationGateway,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    gateway = module.get<CollaborationGateway>(
      CollaborationGateway,
    );
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
