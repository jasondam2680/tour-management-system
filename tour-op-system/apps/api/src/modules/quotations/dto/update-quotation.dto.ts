import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateQuotationDto } from './create-quotation.dto';
import { QuotationStatus } from '@prisma/client';

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {
  @ApiPropertyOptional() @IsOptional() @IsString()
  rejectedReason?: string;
}
