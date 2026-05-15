import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateResourceDto, UpdateResourceDto } from './dto/resource.dto';

@ApiTags('Suppliers')
@ApiBearerAuth('JWT')
@Controller({ path: 'suppliers', version: '1' })
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post(':supplierId/resources')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP)
  @ApiOperation({ summary: 'Create resource for supplier' })
  createResource(
    @Param('supplierId') supplierId: string,
    @Body() dto: CreateResourceDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.createResource(supplierId, dto, orgId);
  }

  @Get(':supplierId/resources')
  @ApiOperation({ summary: 'List resources for supplier' })
  findResources(
    @Param('supplierId') supplierId: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.findResources(supplierId, orgId);
  }

  @Get(':supplierId/resources/:resourceId')
  @ApiOperation({ summary: 'Get resource details' })
  findResource(
    @Param('supplierId') supplierId: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.findResource(supplierId, resourceId, orgId);
  }

  @Patch(':supplierId/resources/:resourceId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP)
  @ApiOperation({ summary: 'Update supplier resource' })
  updateResource(
    @Param('supplierId') supplierId: string,
    @Param('resourceId') resourceId: string,
    @Body() dto: UpdateResourceDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.updateResource(supplierId, resourceId, dto, orgId);
  }

  @Delete(':supplierId/resources/:resourceId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete supplier resource' })
  removeResource(
    @Param('supplierId') supplierId: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.removeResource(supplierId, resourceId, orgId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP)
  @ApiOperation({ summary: 'Create a new supplier' })
  create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.create(dto, orgId);
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers with filtering & pagination' })
  findAll(
    @Query() query: QuerySupplierDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.findAll(query, orgId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get supplier statistics' })
  getStats(@CurrentUser('organizationId') orgId: string) {
    return this.suppliersService.getStats(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.findOne(id, orgId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OP)
  @ApiOperation({ summary: 'Update supplier' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.update(id, dto, orgId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete supplier' })
  remove(
    @Param('id') id: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.suppliersService.remove(id, orgId);
  }
}
