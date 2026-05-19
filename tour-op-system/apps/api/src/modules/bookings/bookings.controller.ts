import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { ChangeBookingStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Currency } from '@prisma/client';

class AddPaymentDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency: string;

  @ApiProperty({ example: 'bank_transfer' })
  @IsString()
  method: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;
}

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Booking Statistics' })
  getStats(@CurrentUser() user: any) {
    return this.bookingsService.getStats(user.organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Booking List' })
  findAll(@CurrentUser() user: any, @Query() query: QueryBookingDto) {
    return this.bookingsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Booking Details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create New Booking for Tour' })
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.organizationId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Booking' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.update(id, user.organizationId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change Booking Status' })
  changeStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ChangeBookingStatusDto,
  ) {
    return this.bookingsService.changeStatus(id, user.organizationId, dto);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record Payment for Supplier' })
  addPayment(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: AddPaymentDto) {
    return this.bookingsService.addPayment(id, user.organizationId, dto);
  }
}
