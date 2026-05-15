import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { AddReceiptDto } from './dto/add-receipt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Tổng quan AR/AP' })
  getOverview(@CurrentUser() user: any) {
    return this.financeService.getOverview(user.organizationId);
  }

  @Get('ap')
  @ApiOperation({ summary: 'Công nợ phải trả NCC (AP)' })
  getApSummary(@CurrentUser() user: any, @Query() query: PaginationDto) {
    return this.financeService.getApSummary(user.organizationId, query);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Danh sách hoá đơn' })
  findAllInvoices(@CurrentUser() user: any, @Query() query: QueryInvoiceDto) {
    return this.financeService.findAllInvoices(user.organizationId, query);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Chi tiết hoá đơn' })
  findOneInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financeService.findOneInvoice(id, user.organizationId);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Tạo hoá đơn mới' })
  createInvoice(@CurrentUser() user: any, @Body() dto: CreateInvoiceDto) {
    return this.financeService.createInvoice(user.organizationId, dto);
  }

  @Post('invoices/:id/receipts')
  @ApiOperation({ summary: 'Ghi nhận thanh toán từ khách hàng' })
  addReceipt(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: AddReceiptDto) {
    return this.financeService.addReceipt(id, user.organizationId, dto);
  }
}
