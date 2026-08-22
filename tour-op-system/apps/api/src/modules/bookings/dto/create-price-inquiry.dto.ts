import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Currency } from '@prisma/client';

export class CreatePriceInquiryDto {
  @IsString()
  supplierId: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quotedPrice?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsString()
  notes?: string;
}
