import { Body, Controller, Put, Get, BadRequestException, Headers } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('profile')
  async updateProfile(@Headers('authorization') auth: string, @Body() dto: UpdateProfileDto) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    const token = auth.replace('Bearer ', '');

    return this.usersService.updateProfile(token, dto);
  }

  @Get('profile')
  async getProfile(@Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    const token = auth.replace('Bearer ', '');
    return this.usersService.getProfile(token);
  }
}
