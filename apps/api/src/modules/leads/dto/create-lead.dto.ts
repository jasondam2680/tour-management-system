import {
  IsString, IsOptional, IsEnum, IsInt, IsDateString,
  IsArray, IsNumber, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LeadStatus, LeadPriority, Currency,
} from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ example: 'Hana Travel - 10 pax Vietnam 7 days' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'website' })
  @IsOptional() @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.NEW })
  @IsOptional() @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadPriority, default: LeadPriority.MEDIUM })
  @IsOptional() @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional() @IsInt() @Min(1)
  pax?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  paxAdult?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  paxChild?: number;

  @ApiPropertyOptional({ example: '2024-03-15' })
  @IsOptional() @IsDateString()
  travelDateFrom?: string;

  @ApiPropertyOptional({ example: '2024-03-22' })
  @IsOptional() @IsDateString()
  travelDateTo?: string;

  @ApiPropertyOptional({ example: 'Vietnam - Hanoi, Halong, Hoi An' })
  @IsOptional() @IsString()
  destination?: string;

  @ApiPropertyOptional({ example: 'cultural' })
  @IsOptional() @IsString()
  tourType?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional() @IsNumber()
  budget?: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.USD })
  @IsOptional() @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  followUpAt?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  estimatedValue?: number;
}
