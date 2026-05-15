import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';

export class AddAssignmentDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'GUIDE', description: 'GUIDE | DRIVER | TOUR_LEADER | ASSISTANT' })
  @IsString()
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fee?: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
