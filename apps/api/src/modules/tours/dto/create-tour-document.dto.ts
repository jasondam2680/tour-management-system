import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentTypeEnum {
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  ITINERARY = 'ITINERARY',
  PERMIT = 'PERMIT',
  INSURANCE = 'INSURANCE',
  PASSPORT = 'PASSPORT',
  VISA = 'VISA',
  OTHER = 'OTHER',
}

export class CreateTourDocumentDto {
  @ApiProperty({ enum: DocumentTypeEnum })
  @IsEnum(DocumentTypeEnum)
  type: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  fileSize?: number;
}
