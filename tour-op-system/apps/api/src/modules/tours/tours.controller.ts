// apps/api/src/modules/tours/tours.controller.ts
import { TourDocumentsService } from './tour-documents.service';
import { CreateTourDocumentDto } from './dto/create-tour-document.dto';
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  HttpCode, 
  HttpStatus,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TourStatus } from '@prisma/client';
import { ToursService } from './tours.service';
import { ToursMacroService } from './tours.macro.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

@ApiTags('Tours')
@ApiBearerAuth()
@Controller('tours')
export class ToursController {
  constructor(
    private readonly toursService: ToursService,
    private readonly toursMacroService: ToursMacroService,
    private readonly tourDocumentsService: TourDocumentsService,
  ) {}

  private getOrgId(req: any): string {
    if (req.user && req.user.organizationId) {
      return req.user.organizationId;
    }
    return 'demo-org-id'; 
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tour record from a confirmed quotation' })
  @ApiResponse({ status: 201, description: 'The tour has been successfully created.' })
  create(@Req() req: any, @Body() createTourDto: CreateTourDto) {
    const orgId = this.getOrgId(req);
    return this.toursService.create(orgId, createTourDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of tours with advanced multi-filters' })
  findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const orgId = this.getOrgId(req);
    const tourStatus = status ? (status as TourStatus) : undefined;
    return this.toursService.findAll(orgId, { page, limit, search, status: tourStatus });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get summary metrics and statistical analysis for tour operations' })
  getStats(@Req() req: any) {
    const orgId = this.getOrgId(req);
    return this.toursService.getStats(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comprehensive tour details by unique ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    const orgId = this.getOrgId(req);
    return this.toursService.findOne(id, orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tour logistics, dates, or administrative records' })
  update(@Req() req: any, @Param('id') id: string, @Body() updateTourDto: UpdateTourDto) {
    const orgId = this.getOrgId(req);
    return this.toursService.update(id, orgId, updateTourDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a tour record from active deployment' })
  remove(@Req() req: any, @Param('id') id: string) {
    const orgId = this.getOrgId(req);
    return this.toursService.update(id, orgId, { status: 'CANCELLED' } as any);
  }

  @Post(':id/recalculate-finance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force trigger a financial recalculation aggregating from all bookings cost base' })
  async recalculateFinance(@Param('id') id: string) {
    await this.toursMacroService.recalculateTourFinance(id);
    return { success: true, message: 'Tour financial totals and profit margins aggregated successfully.' };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel tour contract and safely cascade cancellation status into supplier bookings' })
  async cancelTour(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    await this.toursMacroService.cancelTourWithRefundRules(id, reason || 'Cancelled due to business/operational adjustments.');
    return { success: true, message: 'Tour status converted to CANCELLED and downstream bookings suspended.' };
  }

  @Post(':id/assignments')
  @ApiOperation({ summary: 'Assign a professional human resource (Guide/Driver) to a tour' })
  assignStaff(
    @Req() req: any,
    @Param('id') id: string, 
    @Body() dto: { userId: string; role: string; fee?: number; notes?: string }
  ) {
    const orgId = this.getOrgId(req);
    return this.toursService.update(id, orgId, { assignments: { create: dto } } as any);
  }

  @Delete(':id/assignments/:assignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a staff assignment from this tour' })
  removeAssignment(
    @Req() req: any,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    const orgId = this.getOrgId(req);
    return this.toursService.removeAssignment(id, assignmentId, orgId);
  }

  @Post(':id/incidents')
  @ApiOperation({ summary: 'Log a new critical or non-critical operational incident during execution' })
  addIncident(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { type: string; severity: any; title: string; description: string; location?: string }
  ) {
    const orgId = this.getOrgId(req);
    return this.toursService.addIncident(id, orgId, dto);
  }

  @Patch(':id/incidents/:incidentId/resolve')
  @ApiOperation({ summary: 'Mark an active tour incident as resolved with mitigation details' })
  resolveIncident(
    @Req() req: any,
    @Param('id') id: string,
    @Param('incidentId') incidentId: string,
    @Body() dto: { resolution: string }
  ) {
    const orgId = this.getOrgId(req);
    return this.toursService.update(id, orgId, { incidents: { update: { where: { id: incidentId }, data: { resolution: dto.resolution, resolvedAt: new Date() } } } } as any);
  }
  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload and attach an official file artifact (Visa, Contract, Itinerary) to a tour' })
  @ApiResponse({ status: 201, description: 'File attached successfully.' })
  async uploadDocument(
    @Req() req: any,
    @Param('id') tourId: string,
    @Body() dto: CreateTourDocumentDto,
  ) {
    const orgId = this.getOrgId(req);
    return this.tourDocumentsService.uploadDocument(tourId, orgId, dto);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Retrieve all legal and operational documents belonging to a specific tour' })
  async getDocuments(@Req() req: any, @Param('id') tourId: string) {
    const orgId = this.getOrgId(req);
    return this.tourDocumentsService.getDocuments(tourId, orgId);
  }

  @Delete(':id/documents/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently unlink and remove an attached document asset from a tour' })
  async deleteDocument(
    @Req() req: any,
    @Param('id') tourId: string,
    @Param('documentId') documentId: string,
  ) {
    const orgId = this.getOrgId(req);
    return this.tourDocumentsService.deleteDocument(tourId, documentId, orgId);
  }
}