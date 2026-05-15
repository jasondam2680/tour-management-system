import { IsNumber, IsEnum, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class AddReceiptDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exchangeRate?: number;

  @ApiProperty({ example: 'bank_transfer' })
  @IsString()
  method: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
