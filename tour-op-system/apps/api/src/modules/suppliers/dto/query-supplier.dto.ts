import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { SupplierCategory } from '@prisma/client';

export class QuerySupplierDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SupplierCategory })
  @IsOptional() @IsEnum(SupplierCategory)
  category?: SupplierCategory;

  @ApiPropertyOptional() @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isPreferred?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'name' })
  @IsOptional() @IsString()
  sortBy?: string = 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional() @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
