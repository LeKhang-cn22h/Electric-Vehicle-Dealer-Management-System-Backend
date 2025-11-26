import { Controller, Get, Post, Put, Body, Param, BadRequestException } from '@nestjs/common';
import { ProfileCustomerService } from './profile-customer.service';
import { CreateCustomerDto } from './DTO/create-customer.dto';
import { UpdateCustomerDto } from './DTO/update-customer.dto';
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
  async create(@Body() dto: CreateCustomerDto) {
    return this.profileService.create(dto);
  }

  // Cập nhật profile
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const profileId = Number(id);
    if (isNaN(profileId)) {
      throw new BadRequestException('Invalid profile ID');
    }
    return this.profileService.update(profileId, dto);
  }

  // Xóa profile
  @Put('delete/:id')
  async remove(@Param('id') id: string) {
    console.log(`[CustomerController] Delete request for ID: ${id}`);

    const profileId = Number(id);
    if (isNaN(profileId)) {
      throw new BadRequestException('Invalid profile ID');
    }

    return this.profileService.remove(profileId);
  }
  @Post('auto-link')
  async autoLink(@Body() body: any) {
    const { email, phone, uid } = body;

    if (!uid) {
      throw new BadRequestException('Thiếu uid người dùng');
    }

    if (!email && !phone) {
      throw new BadRequestException('Phải có email hoặc số điện thoại để tìm hồ sơ');
    }

    return this.profileService.findAndLinkByEmailOrPhone(email, phone, uid);
  }
}
