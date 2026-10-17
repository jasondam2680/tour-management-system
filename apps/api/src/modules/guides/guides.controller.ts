// apps/api/src/modules/guides/guides.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GuidesService } from './guides.service';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { QueryGuideDto } from './dto/query-guide.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementDto } from './dto/update-settlement.dto';
import { CreateSettlementLineDto } from './dto/settlement-line.dto';
import { UpdateSettlementLineDto } from './dto/update-settlement-line.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, GuideAdvanceStatus, GuideSettlementStatus } from '@prisma/client';

const WRITE_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP];
const FINANCE_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP, UserRole.FINANCE];

@ApiTags('Guides')
@ApiBearerAuth('JWT')
@Controller({ path: 'guides', version: '1' })
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  // ============================ GUIDES ============================

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Tạo hồ sơ HDV mới' })
  create(@Body() dto: CreateGuideDto, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.createGuide(dto, orgId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách HDV (search, status)' })
  findAll(@Query() query: QueryGuideDto, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.findAllGuides(query, orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết hồ sơ HDV' })
  findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.findOneGuide(id, orgId);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Cập nhật hồ sơ HDV' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGuideDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.updateGuide(id, dto, orgId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vô hiệu hóa HDV (soft-delete)' })
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.removeGuide(id, orgId);
  }

  // ============================ ASSIGNMENTS ============================

  @Post(':guideId/assignments')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Phân công HDV cho đoàn' })
  createAssignment(
    @Param('guideId') guideId: string,
    @Body() dto: CreateAssignmentDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.createAssignment(guideId, dto, orgId);
  }

  @Get(':guideId/assignments')
  @ApiOperation({ summary: 'Danh sách phân công của HDV' })
  findAssignments(@Param('guideId') guideId: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.findAssignments(guideId, orgId);
  }

  @Patch(':guideId/assignments/:assignmentId')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Cập nhật phân công' })
  updateAssignment(
    @Param('guideId') guideId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.updateAssignment(assignmentId, guideId, dto, orgId);
  }

  @Delete(':guideId/assignments/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa phân công' })
  removeAssignment(
    @Param('guideId') guideId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.removeAssignment(assignmentId, guideId, orgId);
  }

  // ============================ ADVANCES ============================

  @Post(':guideId/advances')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Tạo tạm ứng cho HDV' })
  createAdvance(
    @Param('guideId') guideId: string,
    @Body() dto: CreateAdvanceDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.createAdvance({ ...dto, guideId }, orgId);
  }

  @Get(':guideId/advances')
  @ApiOperation({ summary: 'Danh sách tạm ứng của HDV' })
  findAdvances(
    @Param('guideId') guideId: string,
    @CurrentUser('organizationId') orgId: string,
    @Query('status') status?: GuideAdvanceStatus,
  ) {
    return this.guidesService.findAllAdvances(orgId, guideId, status);
  }
}

@ApiTags('GuideAdvances')
@ApiBearerAuth('JWT')
@Controller({ path: 'guide-advances', version: '1' })
export class GuideAdvancesController {
  constructor(private readonly guidesService: GuidesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách tạm ứng (lọc theo guide/status)' })
  findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('guideId') guideId?: string,
    @Query('status') status?: GuideAdvanceStatus,
  ) {
    return this.guidesService.findAllAdvances(orgId, guideId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết tạm ứng' })
  findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.findOneAdvance(id, orgId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP, UserRole.FINANCE)
  @ApiOperation({ summary: 'Sửa tạm ứng (chỉ PENDING)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdvanceDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.updateAdvance(id, dto, orgId);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Duyệt tạm ứng (PENDING → APPROVED)' })
  approve(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.transitionAdvance(id, 'APPROVED', orgId);
  }

  @Post(':id/mark-paid')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu đã chi tạm ứng (APPROVED → PAID)' })
  markPaid(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.transitionAdvance(id, 'PAID', orgId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hủy tạm ứng' })
  cancel(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.transitionAdvance(id, 'CANCELLED', orgId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa tạm ứng (chỉ PENDING)' })
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.removeAdvance(id, orgId);
  }
}

@ApiTags('GuideSettlements')
@ApiBearerAuth('JWT')
@Controller({ path: 'guide-settlements', version: '1' })
export class GuideSettlementsController {
  constructor(private readonly guidesService: GuidesService) {}

  @Post()
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Tạo quyết toán HDV (tự tính công thức)' })
  create(@Body() dto: CreateSettlementDto, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.createSettlement(dto, orgId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách quyết toán (lọc guide/tour/status)' })
  findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('guideId') guideId?: string,
    @Query('tourId') tourId?: string,
    @Query('status') status?: GuideSettlementStatus,
  ) {
    return this.guidesService.findAllSettlements(orgId, { guideId, tourId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết quyết toán (kèm dòng chi phí)' })
  findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.findOneSettlement(id, orgId);
  }

  @Patch(':id')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Sửa quyết toán (chỉ DRAFT, tự tính lại)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSettlementDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.updateSettlement(id, dto, orgId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa quyết toán (chỉ DRAFT)' })
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.removeSettlement(id, orgId);
  }

  @Post(':id/submit')
  @Roles(...FINANCE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trình duyệt (DRAFT → SUBMITTED)' })
  submit(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.transitionSettlement(id, 'SUBMITTED', orgId);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Phê duyệt (SUBMITTED → APPROVED)' })
  approve(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.transitionSettlement(id, 'APPROVED', orgId);
  }

  @Post(':id/mark-paid')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đã thanh toán (APPROVED → PAID, tự SETTLED tạm ứng của đoàn)' })
  markPaid(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.transitionSettlement(id, 'PAID', orgId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hủy quyết toán' })
  cancel(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.guidesService.transitionSettlement(id, 'CANCELLED', orgId);
  }

  // ============================ LINES ============================

  @Post(':id/lines')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Thêm dòng chi phí HDV đã chi' })
  createLine(
    @Param('id') id: string,
    @Body() dto: CreateSettlementLineDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.createLine(id, dto, orgId);
  }

  @Patch(':id/lines/:lineId')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Sửa dòng chi phí' })
  updateLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateSettlementLineDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.updateLine(lineId, id, dto, orgId);
  }

  @Delete(':id/lines/:lineId')
  @Roles(...FINANCE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa dòng chi phí' })
  removeLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.guidesService.removeLine(lineId, id, orgId);
  }
}
