import {
  Controller,
  Put,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServiceClients } from '../service-clients';
import FormData from 'form-data';

@Controller('users')
export class GatewayUsersController {
  constructor(private readonly c: ServiceClients) {}

  @Put('profile')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Req() req,
    @UploadedFile() avatar: Express.Multer.File,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Missing Authorization header');
    }

    console.log('[Gateway] Update profile request:', {
      hasAvatar: !!avatar,
      avatarSize: avatar?.size,
      body,
      authLength: auth.length,
    });
    if (avatar) {
      const formData = new FormData();
      formData.append('avatar', avatar.buffer, {
        filename: avatar.originalname,
        contentType: avatar.mimetype,
      });
      if (body.full_name) {
        formData.append('full_name', body.full_name);
      }
      if (body.phone) {
        formData.append('phone', body.phone);
      }

      console.log('[Gateway] Sending FormData with headers:', formData.getHeaders());

      try {
        const response = await this.c.users().rawRequest({
          method: 'PUT',
          url: '/users/profile',
          headers: {
            ...formData.getHeaders(),
            authorization: auth,
          },
          data: formData,
        });

        console.log('[Gateway] Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('[Gateway] Error:', error.response?.data || error.message);
        throw error;
      }
    }

    console.log('[Gateway] Sending JSON (no avatar)');
    return this.c.users().put('/users/profile', body, {
      authorization: auth,
    });
  }

  @Get('profile')
  getProfile(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new BadRequestException('Missing Authorization header');
    }
    console.log('[Gateway] Get profile request, auth length:', auth.length);
    return this.c.users().get('/users/profile', {
      authorization: auth,
    });
  }

  @Get('dealers')
  async listDealers(@Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().get('/users/dealers', {
      authorization: auth,
    });
  }

  @Post('dealers')
  async createDealer(@Body() body: any, @Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().post('/users/dealers', body, {
      authorization: auth,
    });
  }

  @Put('dealers/:id')
  async updateDealer(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().put(`/users/dealers/${id}`, body, {
      authorization: auth,
    });
  }

  @Delete('dealers/:id')
  async deleteDealer(@Param('id') id: string, @Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().delete(`/users/dealers/${id}`, {
      authorization: auth,
    });
  }

  @Get('dealer-staff')
  async listDealerStaff(@Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().get('/users/dealer-staff', {
      authorization: auth,
    });
  }

  @Post('dealer-staff')
  async createDealerStaff(
    @Body()
    body: {
      full_name: string;
      email: string;
      phone?: string;
      password: string;
    },
    @Headers('authorization') auth: string,
  ) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().post('/users/dealer-staff', body, {
      authorization: auth,
    });
  }

  @Put('dealer-staff/:id')
  async updateDealerStaff(
    @Param('id') id: string,
    @Body()
    body: {
      full_name?: string;
      phone?: string;
    },
    @Headers('authorization') auth: string,
  ) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().put(`/users/dealer-staff/${id}`, body, {
      authorization: auth,
    });
  }

  @Delete('dealer-staff/:id')
  async deleteDealerStaff(@Param('id') id: string, @Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().delete(`/users/dealer-staff/${id}`, {
      authorization: auth,
    });
  }

  @Get('evm-staff')
  async listEvmStaff(@Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().get('/users/evm-staff', {
      authorization: auth,
    });
  }

  // Cập nhật thông tin EVM staff
  @Put('evm-staff/:id')
  async updateEvmStaff(
    @Param('id') id: string,
    @Body()
    body: {
      full_name?: string;
      phone?: string;
      dealer_id?: string | null;
    },
    @Headers('authorization') auth: string,
  ) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().put(`/users/evm-staff/${id}`, body, {
      authorization: auth,
    });
  }

  // Khóa EVM staff
  @Post('evm-staff/:id/lock')
  async lockEvmStaff(@Param('id') id: string, @Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().post(
      `/users/evm-staff/${id}/lock`,
      {},
      {
        authorization: auth,
      },
    );
  }

  // Mở khóa EVM staff
  @Post('evm-staff/:id/unlock')
  async unlockEvmStaff(@Param('id') id: string, @Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.c.users().post(
      `/users/evm-staff/${id}/unlock`,
      {},
      {
        authorization: auth,
      },
    );
  }
}
