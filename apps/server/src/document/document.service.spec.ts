import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationGateway } from '../collaboration/collaboration.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: CollaborationGateway,
          useValue: {
            updateUserDocumentRole: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
