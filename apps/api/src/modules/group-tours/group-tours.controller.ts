import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GroupToursService } from './group-tours.service';
import { CreateGroupTourTemplateDto } from './dto/create-group-tour-template.dto';
import { UpdateGroupTourTemplateDto } from './dto/update-group-tour-template.dto';
import { QueryGroupTourTemplateDto } from './dto/query-group-tour-template.dto';

@ApiTags('Group Tours')
@ApiBearerAuth()
@Controller('group-tours')
export class GroupToursController {
  constructor(private readonly groupToursService: GroupToursService) {}

  @Post('templates')
  @ApiOperation({ summary: 'Create a new group tour template' })
  create(@Req() req, @Body() dto: CreateGroupTourTemplateDto) {
    return this.groupToursService.create(req.user.organizationId, dto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List all group tour templates' })
  findAll(@Req() req, @Query() query: QueryGroupTourTemplateDto) {
    return this.groupToursService.findAll(req.user.organizationId, query);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a group tour template by ID' })
  findOne(@Req() req, @Param('id') id: string) {
    return this.groupToursService.findOne(id, req.user.organizationId);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update a group tour template' })
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateGroupTourTemplateDto) {
    return this.groupToursService.update(id, req.user.organizationId, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a group tour template' })
  remove(@Req() req, @Param('id') id: string) {
    return this.groupToursService.remove(id, req.user.organizationId);
  }

  @Post('templates/:id/days')
  @ApiOperation({ summary: 'Add a day to template itinerary' })
  addDay(@Req() req, @Param('id') id: string, @Body() dayData: any) {
    return this.groupToursService.addDay(id, req.user.organizationId, dayData);
  }

  @Patch('templates/:id/days/:dayId')
  @ApiOperation({ summary: 'Update a day in template itinerary' })
  updateDay(
    @Req() req,
    @Param('id') id: string,
    @Param('dayId') dayId: string,
    @Body() dayData: any,
  ) {
    return this.groupToursService.updateDay(id, dayId, req.user.organizationId, dayData);
  }

  @Delete('templates/:id/days/:dayId')
  @ApiOperation({ summary: 'Delete a day from template itinerary' })
  removeDay(@Req() req, @Param('id') id: string, @Param('dayId') dayId: string) {
    return this.groupToursService.removeDay(id, dayId, req.user.organizationId);
  }

  @Post('templates/:id/days/:dayId/activities')
  @ApiOperation({ summary: 'Add an activity to a day' })
  addActivity(
    @Req() req,
    @Param('id') id: string,
    @Param('dayId') dayId: string,
    @Body() activityData: any,
  ) {
    return this.groupToursService.addActivity(id, dayId, req.user.organizationId, activityData);
  }

  @Patch('templates/:id/days/:dayId/activities/:activityId')
  @ApiOperation({ summary: 'Update an activity' })
  updateActivity(
    @Req() req,
    @Param('id') id: string,
    @Param('dayId') dayId: string,
    @Param('activityId') activityId: string,
    @Body() activityData: any,
  ) {
    return this.groupToursService.updateActivity(
      id,
      dayId,
      activityId,
      req.user.organizationId,
      activityData,
    );
  }

  @Delete('templates/:id/days/:dayId/activities/:activityId')
  @ApiOperation({ summary: 'Delete an activity' })
  removeActivity(
    @Req() req,
    @Param('id') id: string,
    @Param('dayId') dayId: string,
    @Param('activityId') activityId: string,
  ) {
    return this.groupToursService.removeActivity(id, dayId, activityId, req.user.organizationId);
  }

  @Post('templates/:id/copy')
  @ApiOperation({ summary: 'Copy template itinerary for quotation' })
  copyTemplate(@Req() req, @Param('id') id: string) {
    return this.groupToursService.copyTemplateToVersion(id, req.user.organizationId);
  }
}
