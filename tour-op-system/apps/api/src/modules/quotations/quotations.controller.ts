import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, QuotationStatus } from '@prisma/client';

class ChangeQuotationStatusDto {
  @ApiProperty({ enum: QuotationStatus })
  @IsEnum(QuotationStatus)
  status: QuotationStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  reason?: string;
}

@ApiTags('Quotations')
@ApiBearerAuth('JWT')
@Controller({ path: 'quotations', version: '1' })
export class QuotationsController {
  constructor(private readonly svc: QuotationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Create a new quotation with line items' })
  create(
    @Body() dto: CreateQuotationDto,
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.create(dto, orgId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List quotations with filters & pagination' })
  findAll(
    @Query() query: QueryQuotationDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.findAll(query, orgId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Quotation statistics by status' })
  getStats(@CurrentUser('organizationId') orgId: string) {
    return this.svc.getStats(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full quotation detail with items & itinerary' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.findOne(id, orgId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Update quotation (recalculates totals automatically)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.update(id, dto, orgId);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Change quotation status (validates workflow transitions)' })
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeQuotationStatusDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.svc.changeStatus(id, dto.status, orgId, dto.reason);
  }

  @Post(':id/duplicate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate a quotation as new DRAFT' })
  duplicate(
    @Param('id') id: string,
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.duplicate(id, orgId, userId);
  }
}
