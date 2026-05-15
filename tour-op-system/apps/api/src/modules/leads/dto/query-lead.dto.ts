import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { LeadStatus, LeadPriority } from '@prisma/client';

export class QueryLeadDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional() @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadPriority })
  @IsOptional() @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  customerId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional() @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 50;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional() @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional() @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
