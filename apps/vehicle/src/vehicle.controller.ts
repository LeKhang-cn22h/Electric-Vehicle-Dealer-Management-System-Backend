import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  // Lấy danh sách tất cả xe
  @Get()
  async findAll() {
    return this.vehicleService.findAll();
  }

  // Lấy 1 xe theo ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const vehicleId = Number(id);
    if (isNaN(vehicleId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }
    return this.vehicleService.findOne(vehicleId);
  }

  // Tạo xe mới
  @Post()
  async create(@Body() dto: any) {
    return this.vehicleService.create(dto);
  }

  // Cập nhật thông tin xe
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const vehicleId = Number(id);
    if (isNaN(vehicleId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }
    return this.vehicleService.update(vehicleId, dto);
  }

  // Xóa xe
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const vehicleId = Number(id);
    if (isNaN(vehicleId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }
    return this.vehicleService.remove(vehicleId);
  }
}
