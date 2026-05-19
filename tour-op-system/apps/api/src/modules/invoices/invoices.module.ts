import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../prisma/prisma.service'; // Import trực tiếp Service

@Module({
  imports: [], // Bỏ PrismaModule đi
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService], // Khai báo PrismaService trực tiếp vào đây
  exports: [InvoicesService],
})
export class InvoicesModule {}