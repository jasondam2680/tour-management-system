import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { QueryTourDto } from './dto/query-tour.dto';
import { ChangeTourStatusDto } from './dto/change-status.dto';
import { AddAssignmentDto } from './dto/add-assignment.dto';
import { AddIncidentDto } from './dto/add-incident.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tours')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Tour Statistics' })
  getStats(@CurrentUser() user: any) {
    return this.toursService.getStats(user.organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Tour List' })
  findAll(@CurrentUser() user: any, @Query() query: QueryTourDto) {
    return this.toursService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tour Details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.toursService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create New Tour' })
  create(@CurrentUser() user: any, @Body() dto: CreateTourDto) {
    return this.toursService.create(user.organizationId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Tour' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateTourDto) {
    return this.toursService.update(id, user.organizationId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change Tour Status' })
  changeStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ChangeTourStatusDto,
  ) {
    return this.toursService.changeStatus(id, user.organizationId, dto);
  }

  @Post(':id/assignments')
  @ApiOperation({ summary: 'Assign Guide/Driver' })
  addAssignment(
    @Param('id') tourId: string,
    @CurrentUser() user: any,
    @Body() dto: AddAssignmentDto,
  ) {
    return this.toursService.addAssignment(tourId, user.organizationId, dto);
  }

  @Delete(':id/assignments/:assignmentId')
  @ApiOperation({ summary: 'Remove Assignment' })
  removeAssignment(
    @Param('id') tourId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.toursService.removeAssignment(tourId, assignmentId, user.organizationId);
  }

  @Post(':id/incidents')
  @ApiOperation({ summary: 'Record Incident in Tour' })
  addIncident(@Param('id') tourId: string, @CurrentUser() user: any, @Body() dto: AddIncidentDto) {
    return this.toursService.addIncident(tourId, user.organizationId, dto);
  }

  @Post('convert-from-quotation/:quotationId')
  @ApiOperation({ summary: 'Convert Approved Quotation to Tour + Bookings Automatically' })
  convertFromQuotation(@Param('quotationId') quotationId: string, @CurrentUser() user: any) {
    return this.toursService.convertFromQuotation(quotationId, user.organizationId);
  }
}
