import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';

class CreateActivityDto {
  @ApiProperty()
  @IsString()
  time: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  duration: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder: number;
}

class CreateDayDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  dayNumber: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meals: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accommodation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActivityDto)
  activities: CreateActivityDto[];
}

export class CreateGroupTourTemplateDto {
  @ApiProperty()
  @IsString()
  templateName: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  duration: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  minPax: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  packagePrice: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  packagePriceCurrency: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overview: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes: string;

  @ApiPropertyOptional()
  @IsOptional()
  packageIncludes: any;

  @ApiPropertyOptional({ type: [CreateDayDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDayDto)
  days: CreateDayDto[];
}
