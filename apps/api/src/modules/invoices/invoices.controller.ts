import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; // Tuỳ chỉnh theo đường dẫn auth guard thực tế của bạn

@Controller('v1/invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Req() req: any, @Body() createInvoiceDto: CreateInvoiceDto) {
    // Lấy organizationId từ token của user đang đăng nhập
    const organizationId = req.user.organizationId;
    
    return this.invoicesService.create(organizationId, createInvoiceDto);
  }
  
}

