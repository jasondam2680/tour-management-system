import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreateVersionActivityDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

class CreateVersionDayDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dayNumber: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  meals?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accommodation?: string;

  @ApiPropertyOptional({ type: [CreateVersionActivityDto] })
  @IsOptional()
  activities?: CreateVersionActivityDto[];
}

export class CreateVersionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateVersionDayDto] })
  @IsOptional()
  days?: CreateVersionDayDto[];
}
