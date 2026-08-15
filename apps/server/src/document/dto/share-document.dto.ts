import {
  IsEmail,
  IsEnum,
} from 'class-validator';

import { DocumentRole } from '../../../generated/prisma/client';

export class ShareDocumentDto {
  @IsEmail()
  email: string;

  @IsEnum(DocumentRole)
  role: DocumentRole;
}