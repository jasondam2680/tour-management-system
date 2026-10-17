// apps/api/src/modules/service-arrangements/dto/create-guest.dto.ts
import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreateGuestDto {
  @ApiPropertyOptional({ description: 'Lấy từ URL khi dùng route nested' })
  @IsOptional() @IsString()
  tourId?: string;

  @ApiProperty({ description: 'Họ tên' }) @IsString()
  fullName: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  gender?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  nationality?: string;

  @ApiPropertyOptional({ description: 'Số hộ chiếu' }) @IsOptional() @IsString()
  passportNo?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  birthPlace?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  issuePlace?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Cơ quan cấp' }) @IsOptional() @IsString()
  issueAuthority?: string;

  @ApiPropertyOptional({ description: 'Loại phòng: TWIN/SINGLE...' }) @IsOptional() @IsString()
  roomType?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @ToNumber()
  sortOrder?: number;
}
