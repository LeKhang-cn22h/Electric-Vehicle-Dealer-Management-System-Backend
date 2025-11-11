import {
  Body,
  Controller,
  Put,
  Get,
  BadRequestException,
  Headers,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Req } from '@nestjs/common';
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('profile')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    avatar: Express.Multer.File | undefined,
    @Body() body: UpdateProfileDto,
  ) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
      throw new BadRequestException('Missing Authorization header');
    }

    const token = authHeader.toString().replace('Bearer ', '').trim();

    if (!token) {
      throw new BadRequestException('Invalid Authorization header');
    }

    console.log('Received update request:', {
      hasAvatar: !!avatar,
      body,
      tokenLength: token.length,
    });

    return this.usersService.updateProfile(token, body, avatar);
  }

  @Get('profile')
  async getProfile(@Req() req) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
      throw new BadRequestException('Missing Authorization header');
    }

    const token = authHeader.toString().replace('Bearer ', '').trim();

    if (!token) {
      throw new BadRequestException('Invalid Authorization header');
    }
    console.log('Getting profile for token length:', token.length);
    return this.usersService.getProfile(token);
  }
}
