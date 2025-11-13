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
import { CustomersService } from './customer.service';
@Controller('customer')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // Lấy danh sách tất cả xe
  @Get()
  async findAll() {
    return this.customersService.findAll();
  }

  // Lấy 1 xe theo ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customersId = Number(id);
    if (isNaN(customersId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }
    return this.customersService.findOne(customersId);
  }

  // Tạo xe mới
  @Post()
  async create(@Body() dto: any) {
    return this.customersService.create(dto);
  }

  // Cập nhật thông tin xe
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const customersId = Number(id);
    if (isNaN(customersId)) {
      throw new BadRequestException('Invalid customer ID');
    }
    return this.customersService.update(customersId, dto);
  }

  // Xóa xe
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const customersId = Number(id);
    if (isNaN(customersId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }
    return this.customersService.remove(customersId);
  }
}
