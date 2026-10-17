// apps/api/src/modules/service-arrangements/dto/create-payment.dto.ts
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArrangementPaymentDto {
  @ApiPropertyOptional({ description: 'Booking liên kết (nếu tour có nhiều booking)' })
  @IsOptional() @IsString()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Phương thức thanh toán', default: 'bank_transfer' })
  @IsOptional() @IsString()
  method?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;
}
