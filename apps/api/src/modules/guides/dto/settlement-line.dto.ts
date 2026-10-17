import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToNumber } from '../../../common/decorators/to-number.decorator';

export class CreateSettlementLineDto {
  @ApiProperty({ example: 'Tiền vé tham quan HDV tự chi' }) @IsString()
  description: string;

  @ApiProperty() @IsNumber() @Min(0) @ToNumber()
  amount: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) @ToNumber()
  sortOrder?: number;
}
