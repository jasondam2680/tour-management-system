import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Currency } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreatePriceInquiryDto {
  @IsString()
  supplierId: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @ToNumber()
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
