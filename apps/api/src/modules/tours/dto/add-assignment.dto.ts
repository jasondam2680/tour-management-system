import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class AddAssignmentDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'GUIDE', description: 'GUIDE | DRIVER | TOUR_LEADER | ASSISTANT' })
  @IsString()
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ToNumber()
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
