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
import { ProfileCustomerService } from './profile-customer.service';

@Controller('profile-customer')
export class ProfileCustomerController {
  constructor(private readonly profileService: ProfileCustomerService) {}

  // Lấy danh sách tất cả profile
  @Get()
  async findAll() {
    return this.profileService.findAll();
  }

  // Lấy 1 profile theo ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const profileId = Number(id);
    if (isNaN(profileId)) {
      throw new BadRequestException('Invalid profile ID');
    }
    return this.profileService.findOne(profileId);
  }

  // Tạo profile mới
  @Post()
  async create(@Body() dto: any) {
    return this.profileService.create(dto);
  }

  // Cập nhật profile
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const profileId = Number(id);
    if (isNaN(profileId)) {
      throw new BadRequestException('Invalid profile ID');
    }
    return this.profileService.update(profileId, dto);
  }

  // Xóa profile
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const profileId = Number(id);
    if (isNaN(profileId)) {
      throw new BadRequestException('Invalid profile ID');
    }
    return this.profileService.remove(profileId);
  }
}
