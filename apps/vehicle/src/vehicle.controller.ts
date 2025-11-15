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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VehicleService } from './vehicle.service';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  async findAll() {
    return this.vehicleService.findAll();
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
  // 📌 CREATE VEHICLE — MULTIPART FORM
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
}
