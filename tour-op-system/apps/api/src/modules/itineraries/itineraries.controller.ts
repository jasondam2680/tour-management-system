import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ItinerariesService } from './itineraries.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { QueryItineraryDto } from './dto/query-itinerary.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Itineraries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('itineraries')
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo itinerary mới' })
  create(@CurrentUser() user: any, @Body() dto: CreateItineraryDto) {
    return this.itinerariesService.create(user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách itineraries' })
  findAll(@CurrentUser() user: any, @Query() query: QueryItineraryDto) {
    return this.itinerariesService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết itinerary' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.itinerariesService.findOne(id, user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật itinerary' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateItineraryDto) {
    return this.itinerariesService.update(id, user.organizationId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa itinerary' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.itinerariesService.remove(id, user.organizationId);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Tạo version mới cho itinerary' })
  createVersion(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateVersionDto) {
    return this.itinerariesService.createVersion(id, user.organizationId, dto);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Danh sách versions' })
  getVersions(@Param('id') id: string, @CurrentUser() user: any) {
    return this.itinerariesService.getVersions(id, user.organizationId);
  }

  @Get(':id/versions/:vid')
  @ApiOperation({ summary: 'Chi tiết version' })
  getVersion(@Param('id') id: string, @Param('vid') vid: string, @CurrentUser() user: any) {
    return this.itinerariesService.getVersion(id, vid, user.organizationId);
  }

  @Patch(':id/versions/:vid')
  @ApiOperation({ summary: 'Cập nhật version (chỉ version không active)' })
  updateVersion(
    @Param('id') id: string,
    @Param('vid') vid: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateVersionDto,
  ) {
    return this.itinerariesService.updateVersion(id, vid, user.organizationId, dto);
  }

  @Post(':id/versions/:vid/activate')
  @ApiOperation({ summary: 'Kích hoạt version' })
  activateVersion(@Param('id') id: string, @Param('vid') vid: string, @CurrentUser() user: any) {
    return this.itinerariesService.activateVersion(id, vid, user.organizationId);
  }
}
