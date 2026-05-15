import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { AddActivityDto } from './dto/add-activity.dto';
import { ChangeLeadStatusDto } from './dto/change-status.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Leads')
@ApiBearerAuth('JWT')
@Controller({ path: 'leads', version: '1' })
export class LeadsController {
  constructor(private readonly svc: LeadsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Create a new lead' })
  create(
    @Body() dto: CreateLeadDto,
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.create(dto, orgId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with filters & pagination' })
  findAll(
    @Query() query: QueryLeadDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.findAll(query, orgId);
  }

  @Get('kanban')
  @ApiOperation({ summary: 'Get leads grouped by status for Kanban board' })
  @ApiQuery({ name: 'assignedToId', required: false })
  findKanban(
    @CurrentUser('organizationId') orgId: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.svc.findKanban(orgId, assignedToId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lead pipeline statistics' })
  getStats(@CurrentUser('organizationId') orgId: string) {
    return this.svc.getStats(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead details with activities & quotations' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.findOne(id, orgId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Update lead fields' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.update(id, dto, orgId);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Change lead status (validates transitions)' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeLeadStatusDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.changeStatus(id, dto, orgId);
  }

  @Post(':id/activities')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Add activity log to lead (call, email, meeting...)' })
  addActivity(
    @Param('id') id: string,
    @Body() dto: AddActivityDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.addActivity(id, dto, orgId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Abandon lead (soft delete)' })
  remove(
    @Param('id') id: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.remove(id, orgId);
  }
}
