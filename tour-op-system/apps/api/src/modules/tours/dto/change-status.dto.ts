import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TourStatus } from '@prisma/client';

export class ChangeTourStatusDto {
  @ApiProperty({ enum: TourStatus })
  @IsEnum(TourStatus)
  status: TourStatus;

  @ApiPropertyOptional({ description: 'Lý do huỷ (bắt buộc nếu status = CANCELLED)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
