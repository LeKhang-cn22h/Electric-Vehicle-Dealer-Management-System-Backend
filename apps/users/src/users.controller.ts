import {
  Body,
  Controller,
  Put,
  Get,
  Post,
  Delete,
  Param,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  private extractToken(req: any): string {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
      throw new BadRequestException('Missing Authorization header');
    }

    const token = authHeader.toString().replace('Bearer ', '').trim();

    if (!token) {
      throw new BadRequestException('Invalid Authorization header');
    }

    return token;
  }

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

  @Get('dealers')
  async listDealers() {
    return this.usersService.listDealers();
  }

  @Post('dealers')
  async createDealer(@Body() body: any) {
    return this.usersService.createDealer(body);
  }

  @Put('dealers/:id')
  async updateDealer(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateDealer(id, body);
  }

  @Delete('dealers/:id')
  async deleteDealer(@Param('id') id: string) {
    return this.usersService.deleteDealer(id);
  }
  @Get('dealer-staff')
  async listDealerStaff(@Req() req) {
    const token = this.extractToken(req);
    return this.usersService.listDealerStaff(token);
  }

  @Post('dealer-staff')
  async createDealerStaff(
    @Req() req,
    @Body()
    body: {
      full_name: string;
      email: string;
      phone?: string;
      password: string;
    },
  ) {
    const token = this.extractToken(req);
    return this.usersService.createDealerStaff(token, body);
  }

  @Put('dealer-staff/:id')
  async updateDealerStaff(
    @Req() req,
    @Param('id') id: string,
    @Body()
    body: {
      full_name?: string;
      phone?: string;
    },
  ) {
    const token = this.extractToken(req);
    return this.usersService.updateDealerStaff(token, id, body);
  }

  @Delete('dealer-staff/:id')
  async deleteDealerStaff(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
    return this.usersService.deleteDealerStaff(token, id);
  }
}
