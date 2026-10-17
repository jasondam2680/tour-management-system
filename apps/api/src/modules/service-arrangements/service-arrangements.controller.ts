// apps/api/src/modules/service-arrangements/service-arrangements.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ServiceArrangementsService } from './service-arrangements.service';
import { CreateArrangementDto } from './dto/create-arrangement.dto';
import { UpdateArrangementDto } from './dto/update-arrangement.dto';
import { QueryArrangementDto } from './dto/query-arrangement.dto';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { CreateArrangementPaymentDto } from './dto/create-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

const WRITE_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP];
const FINANCE_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP, UserRole.FINANCE];

@ApiTags('ServiceArrangements')
@ApiBearerAuth('JWT')
@Controller({ version: '1' })
export class TourServicesController {
  constructor(private readonly service: ServiceArrangementsService) {}

  // ============================ SERVICES ============================

  @Get('tours/:tourId/services')
  @ApiOperation({ summary: 'Lưới sắp xếp dịch vụ của đoàn (lọc theo loại/trạng thái)' })
  listServices(
    @Param('tourId') tourId: string,
    @Query() query: QueryArrangementDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.service.listArrangements(tourId, orgId, query);
  }

  @Post('tours/:tourId/services')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Thêm dòng sắp xếp dịch vụ' })
  createService(
    @Param('tourId') tourId: string,
    @Body() dto: CreateArrangementDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.service.createArrangement(tourId, dto, orgId);
  }

  // ============================ GUESTS ============================

  @Get('tours/:tourId/guests')
  @ApiOperation({ summary: 'Danh sách khách của đoàn' })
  listGuests(
    @Param('tourId') tourId: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.service.listGuests(tourId, orgId);
  }

  @Post('tours/:tourId/guests')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Thêm khách thủ công' })
  createGuest(
    @Param('tourId') tourId: string,
    @Body() dto: CreateGuestDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.service.createGuest(tourId, dto, orgId);
  }

  @Post('tours/:tourId/guests/import')
  @Roles(...WRITE_ROLES)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Import danh sách khách từ file Excel (.xlsx)' })
  async importGuests(
    @Param('tourId') tourId: string,
    @UploadedFile() file: any,
    @CurrentUser('organizationId') orgId: string,
  ) {
    if (!file?.buffer) throw new BadRequestException('Thiếu file upload');
    return this.service.importGuests(tourId, file.buffer, orgId);
  }
}

@ApiTags('ServiceArrangements')
@ApiBearerAuth('JWT')
@Controller({ path: 'service-arrangements', version: '1' })
export class ServiceArrangementsController {
  constructor(private readonly service: ServiceArrangementsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết dòng sắp xếp' })
  getOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.getArrangement(id, orgId);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Sửa dòng sắp xếp' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArrangementDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.service.updateArrangement(id, dto, orgId);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Xoá dòng sắp xếp' })
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.deleteArrangement(id, orgId);
  }

  @Post(':id/confirm')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Xác nhận dịch vụ (PENDING → CONFIRMED)' })
  confirm(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.transition(id, orgId, 'CONFIRMED');
  }

  @Post(':id/cancel')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Huỷ dòng dịch vụ' })
  cancel(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.transition(id, orgId, 'CANCELLED');
  }

  @Post(':id/mark-paid')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Đánh dấu đã thanh toán' })
  markPaid(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.transition(id, orgId, 'PAID');
  }

  @Post(':id/create-payment')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Tạo đề nghị thanh toán NCC từ dòng dịch vụ ($)' })
  createPayment(
    @Param('id') id: string,
    @Body() dto: CreateArrangementPaymentDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.service.createPayment(id, dto, orgId);
  }
}

@ApiTags('ServiceArrangements')
@ApiBearerAuth('JWT')
@Controller({ path: 'tour-guests', version: '1' })
export class TourGuestsController {
  constructor(private readonly service: ServiceArrangementsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết khách' })
  getOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.getGuest(id, orgId);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Sửa thông tin khách' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGuestDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.service.updateGuest(id, dto, orgId);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Xoá khách' })
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.deleteGuest(id, orgId);
  }
}
