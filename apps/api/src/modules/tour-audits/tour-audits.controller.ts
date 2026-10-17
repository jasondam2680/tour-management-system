// apps/api/src/modules/tour-audits/tour-audits.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { TourAuditsService } from './tour-audits.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateAuditLineDto } from './dto/create-audit-line.dto';
import { UpdateAuditLineDto } from './dto/update-audit-line.dto';
import { ReviewAuditLineDto } from './dto/review-audit-line.dto';

const WRITE_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP];
const REVIEW_ROLES = [...WRITE_ROLES, UserRole.FINANCE];

@ApiTags('TourAudits')
@ApiBearerAuth('JWT')
@Controller({ path: 'tours', version: '1' })
export class TourAuditController {
  constructor(private readonly service: TourAuditsService) {}

  @Post(':tourId/audit')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Mở kiểm toán cho đoàn (tự sinh dòng từ sắp xếp DV + quyết toán HDV)' })
  openAudit(@Param('tourId') tourId: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.openAudit(tourId, orgId);
  }

  @Get(':tourId/audit')
  @ApiOperation({ summary: 'Chi tiết phiếu kiểm toán của đoàn' })
  getAudit(@Param('tourId') tourId: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.getByTour(tourId, orgId);
  }

  @Post(':tourId/audit/lines')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Thêm dòng kiểm toán thủ công' })
  async createLine(
    @Param('tourId') tourId: string,
    @Body() dto: CreateAuditLineDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    const audit = await this.service.getByTour(tourId, orgId);
    return this.service.createLine(audit.id, dto, orgId);
  }

  @Get(':tourId/departure-plan')
  @ApiOperation({ summary: 'Xuất kế hoạch đoàn (出团计划表)' })
  departurePlan(@Param('tourId') tourId: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.getDeparturePlan(tourId, orgId);
  }

  @Get(':tourId/settlement')
  @ApiOperation({ summary: 'Quyết toán tài chính đoàn (结算单)' })
  settlement(@Param('tourId') tourId: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.getSettlement(tourId, orgId);
  }
}

@ApiTags('TourAudits')
@ApiBearerAuth('JWT')
@Controller({ path: 'tour-audits', version: '1' })
export class TourAuditsController {
  constructor(private readonly service: TourAuditsService) {}

  @Post(':auditId/:action')
  @Roles(...REVIEW_ROLES)
  @ApiOperation({ summary: 'Chuyển trạng thái phiếu: submit|review|approve|close|reopen' })
  transition(
    @Param('auditId') auditId: string,
    @Param('action') action: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.service.transition(auditId, action, orgId);
  }
}

@ApiTags('TourAudits')
@ApiBearerAuth('JWT')
@Controller({ path: 'audit-lines', version: '1' })
export class AuditLinesController {
  constructor(private readonly service: TourAuditsService) {}

  @Patch(':lineId')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Sửa dòng kiểm toán' })
  update(
    @Param('lineId') lineId: string,
    @Body() dto: UpdateAuditLineDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.service.updateLine(lineId, dto, orgId);
  }

  @Delete(':lineId')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Xóa dòng kiểm toán' })
  remove(@Param('lineId') lineId: string, @CurrentUser('organizationId') orgId: string) {
    return this.service.deleteLine(lineId, orgId);
  }

  @Post(':lineId/review')
  @Roles(...REVIEW_ROLES)
  @ApiOperation({ summary: 'Kế toán tick duyệt từng dòng' })
  review(
    @Param('lineId') lineId: string,
    @Body() dto: ReviewAuditLineDto,
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser() user: any,
  ) {
    const reviewer = typeof user === 'object' ? user?.id : undefined;
    return this.service.reviewLine(lineId, dto, orgId, reviewer);
  }

  @Post(':lineId/bill')
  @Roles(...WRITE_ROLES)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @ApiOperation({ summary: 'Upload ảnh bill cho dòng kiểm toán (jpg/png/pdf, tối đa 5MB)' })
  async uploadBill(
    @Param('lineId') lineId: string,
    @UploadedFile() file: any,
    @CurrentUser('organizationId') orgId: string,
  ) {
    if (!file?.buffer) throw new BadRequestException('Thiếu file upload');
    return this.service.uploadBill(lineId, file, orgId);
  }
}
