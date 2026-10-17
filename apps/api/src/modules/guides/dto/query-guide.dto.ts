import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GuideStatus } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class QueryGuideDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: GuideStatus }) @IsOptional() @IsEnum(GuideStatus)
  status?: GuideStatus;

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @ToNumber()
  page?: number;

  @ApiPropertyOptional({ default: 100 }) @IsOptional() @ToNumber()
  limit?: number;
}
