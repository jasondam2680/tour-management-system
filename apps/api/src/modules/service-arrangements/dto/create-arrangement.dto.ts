// apps/api/src/modules/service-arrangements/dto/create-arrangement.dto.ts
import {
  IsString, IsOptional, IsNumber, IsEnum, IsDateString, IsInt, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, ServiceType, ArrangementPayBy } from '@prisma/client';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreateArrangementDto {
  @ApiPropertyOptional({ description: 'Lấy từ URL khi dùng route nested' })
  @IsOptional() @IsString()
  tourId?: string;

  @ApiProperty({ enum: ServiceType }) @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional() @IsOptional() @IsString()
  supplierId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Ngày sử dụng dịch vụ' }) @IsOptional() @IsDateString()
  serviceDate?: string;

  @ApiPropertyOptional({ description: 'Mô tả: tên KS, điểm tham quan, chuyến bay...' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Số lượng (mặc định 1)' })
  @IsOptional() @IsNumber() @Min(0) @ToNumber()
  quantity?: number;

  @ApiProperty({ description: 'Đơn giá' }) @IsNumber() @Min(0) @ToNumber()
  unitPrice: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.VND })
  @IsOptional() @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ enum: ArrangementPayBy, default: ArrangementPayBy.COMPANY_DIRECT })
  @IsOptional() @IsEnum(ArrangementPayBy)
  payBy?: ArrangementPayBy;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @ToNumber()
  sortOrder?: number;
}
