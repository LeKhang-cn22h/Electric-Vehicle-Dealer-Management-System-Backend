import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
  UploadedFiles,
  UseInterceptors,
  Req,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VehicleService } from './vehicle.service';
import { VehicleCompareDto } from './DTO/vehicle_compare.dto';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('model') model?: string,
    @Query('status') status?: string,

    @Query('cursor') cursor?: number,
    @Query('limit') limit = 20,
  ) {
    return this.vehicleService.findAll({
      keyword,
      model,
      status,
      cursor: cursor ? Number(cursor) : undefined,
      limit: Number(limit),
    });
  }

  @Get('search')
  async searchAll(
    @Query('keyword') keyword: string,
    @Query('cursor') cursor?: number,
    @Query('limit') limit = 20,
  ) {
    return this.vehicleService.searchAll(keyword, cursor, limit);
  }

  @Get('filter/model')
  async filterByModel(
    @Query('model') model: string,
    @Query('cursor') cursor?: number,
    @Query('limit') limit = 20,
  ) {
    return this.vehicleService.filterByModel(model, cursor, limit);
  }

  @Get('models')
  async getAllModels() {
    return this.vehicleService.getAllModels();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const vehicleId = Number(id);
    if (isNaN(vehicleId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }
    return this.vehicleService.findOne(vehicleId);
  }

  // -------------------------------
  // CREATE VEHICLE — MULTIPART FORM
  // -------------------------------
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @Req() req,
    @UploadedFiles() images: Express.Multer.File[],
    @Body('vehicle') vehicleJson: string,
  ) {
    if (!vehicleJson) {
      throw new BadRequestException('Missing vehicle JSON');
    }

    let vehicleData;
    try {
      vehicleData = JSON.parse(vehicleJson);
    } catch (err) {
      throw new BadRequestException('Invalid JSON in vehicle field ');
    }

    console.log('[VehicleService] Received request:', {
      imagesCount: images?.length ?? 0,
      vehicleData,
    });

    return this.vehicleService.create(vehicleData, images);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body('vehicle') vehicleJson: string,
  ) {
    const vehicleId = Number(id);
    if (isNaN(vehicleId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }

    if (!vehicleJson) {
      throw new BadRequestException('Missing vehicle JSON');
    }

    let vehicleData;
    try {
      vehicleData = JSON.parse(vehicleJson);
    } catch (err) {
      throw new BadRequestException('Invalid JSON in vehicle field');
    }

    console.log('[VehicleService] Update request:', {
      vehicleId,
      imagesCount: images?.length ?? 0,
      vehicleData,
    });

    return this.vehicleService.update(vehicleId, vehicleData, images);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const vehicleId = Number(id);
    if (isNaN(vehicleId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }
    return this.vehicleService.remove(vehicleId);
  }
  @Post('compare')
  async compareVehicles(@Body() compareDto: VehicleCompareDto) {
    console.log('Endpoint so sánh xe được gọi với dữ liệu:', compareDto);
    return this.vehicleService.compareVehicles(compareDto.vehicleIds);
  }
  @Get(':id/compare-suggestions')
  async getComparisonSuggestions(@Param('id') id: string, @Query('limit') limit?: string) {
    console.log(`Lấy xe gợi ý so sánh cho xe ID: ${id}`);
    return this.vehicleService.getComparisonSuggestions(parseInt(id), limit ? parseInt(limit) : 5);
  }
}
