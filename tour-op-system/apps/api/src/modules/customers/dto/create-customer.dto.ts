import {
  IsEmail, IsEnum, IsOptional, IsString,
  IsArray, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType, Currency } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ enum: CustomerType, default: CustomerType.B2C })
  @IsEnum(CustomerType)
  type: CustomerType;

  @ApiPropertyOptional() @IsOptional() @IsString()
  firstName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  lastName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  nationality?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  passportNo?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  companyName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  taxCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  contactPerson?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  industry?: string;

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
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: Currency, default: Currency.USD })
  @IsOptional() @IsEnum(Currency)
  currency?: Currency;
}
