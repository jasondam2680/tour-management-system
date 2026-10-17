import {
  IsString, IsOptional, IsEnum, IsArray, IsNumber, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuideStatus } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreateGuideDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'CMND/CCCD' }) @IsOptional() @IsString()
  idCard?: string;

  @ApiPropertyOptional({ description: 'Số thẻ HDV' }) @IsOptional() @IsString()
  licenseNo?: string;

  @ApiPropertyOptional({ type: [String], example: ['中文', 'Tiếng Việt'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString()
  bankName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  bankAccount?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  accountName?: string;

  @ApiPropertyOptional({ description: 'Giá mặc định/ngày (VND)' })
  @IsOptional() @IsNumber() @Min(0) @ToNumber()
  defaultDailyRate?: number;

  @ApiPropertyOptional({ enum: GuideStatus, default: GuideStatus.ACTIVE })
  @IsOptional() @IsEnum(GuideStatus)
  status?: GuideStatus;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;
}
