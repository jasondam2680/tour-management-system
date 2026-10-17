import {
  IsEmail, IsEnum, IsOptional, IsString,
  IsArray, IsBoolean, IsInt, Min, Max, IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierCategory, Currency } from '@prisma/client';

export class CreateSupplierDto {
  @ApiProperty({ enum: SupplierCategory })
  @IsEnum(SupplierCategory)
  category: SupplierCategory;

  @ApiProperty({ example: 'Khách sạn Caravelle' })
  @IsString()
  name: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  contactPerson?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  country?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  website?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  taxCode?: string;

  @ApiPropertyOptional({ enum: Currency, default: Currency.VND })
  @IsOptional() @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional() @IsOptional() @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  bankAccount?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  bankName?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 3 })
  @IsOptional() @IsInt() @Min(1) @Max(5)
  rating?: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  isPreferred?: boolean;
}
