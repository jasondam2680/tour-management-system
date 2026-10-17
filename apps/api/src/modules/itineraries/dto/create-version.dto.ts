import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

class CreateVersionActivityDto {
  @ApiProperty()
  @ToNumber()
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
  @ToNumber()
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
  @ToNumber()
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
