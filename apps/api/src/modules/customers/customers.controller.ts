import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiCreatedResponse, ApiOkResponse,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Customers')
@ApiBearerAuth('JWT')
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Create a new customer (B2B or B2C)' })
  @ApiCreatedResponse({ description: 'Customer created successfully' })
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.customersService.create(dto, orgId);
  }

  @Get()
  @ApiOperation({ summary: 'List all customers with filtering & pagination' })
  @ApiOkResponse({ description: 'Paginated customer list' })
  findAll(
    @Query() query: QueryCustomerDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.customersService.findAll(query, orgId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get customer statistics' })
  getStats(@CurrentUser('organizationId') orgId: string) {
    return this.customersService.getStats(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.customersService.findOne(id, orgId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Update customer' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.customersService.update(id, dto, orgId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete customer' })
  remove(
    @Param('id') id: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.customersService.remove(id, orgId);
  }
}
