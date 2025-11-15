import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  InternalServerErrorException,
  Logger,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { ServiceClients } from '../service-clients';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Req } from '@nestjs/common';
import FormData from 'form-data';

@Controller('api/vehicle')
export class GatewayVehicleController {
  private readonly logger = new Logger(GatewayVehicleController.name);

  constructor(private readonly c: ServiceClients) {}

  @Get()
  async findAll() {
    try {
      this.logger.log('🔍 Calling vehicle service GET /vehicle');
      const result = await this.c.vehicle().get('/vehicle');
      this.logger.log('✅ Success, got data:', JSON.stringify(result).slice(0, 100));
      return result;
    } catch (error) {
      this.logger.error('❌ Error calling vehicle service:');
      this.logger.error('Message:', error.message);
      this.logger.error('Response:', error.response?.data);
      this.logger.error('Status:', error.response?.status);
      this.logger.error('Stack:', error.stack);
      throw new InternalServerErrorException('Failed to fetch vehicles');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.c.vehicle().get(`/vehicle/${id}`);
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async createVehicle(
    @Req() req,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    try {
      console.log('[Gateway] 1. Request received!');
      console.log('[Gateway] 2. Auth:', auth ? 'Present' : 'Missing');
      console.log('[Gateway] 3. Images:', images?.length || 0);
      console.log('[Gateway] 4. Body:', JSON.stringify(body));

      if (!auth) {
        throw new BadRequestException('Missing Authorization header');
      }

      console.log('[Gateway] 5. Creating FormData...');
      const form = new FormData();

      // Append images
      if (images && images.length > 0) {
        console.log('[Gateway] 6. Appending images...');
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          console.log(`[Gateway] 6.${i + 1}. File:`, file.originalname);
          form.append('images', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
          });
        }
      } else {
        console.log('[Gateway] 6. No images to append');
      }

      // Append vehicle JSON
      console.log('[Gateway] 7. Checking body.vehicle...');
      if (body.vehicle) {
        console.log('[Gateway] 8. Appending vehicle:', body.vehicle);
        form.append('vehicle', body.vehicle);
      } else {
        console.log('[Gateway] 8. ERROR: Missing vehicle JSON');
        throw new BadRequestException('Missing vehicle JSON');
      }

      console.log('[Gateway] 9. Form headers:', form.getHeaders());
      console.log('[Gateway] 10. Forwarding to Vehicle Service...');

      const response = await this.c.vehicle().rawRequest({
        method: 'POST',
        url: '/vehicle',
        headers: {
          ...form.getHeaders(),
          authorization: auth,
        },
        data: form,
      });

      console.log('[Gateway] 11. SUCCESS! Response:', response.data);
      return response.data;
    } catch (err) {
      console.error('[Gateway] ❌ CAUGHT ERROR:');
      console.error('[Gateway] Error message:', err.message);
      console.error('[Gateway] Error stack:', err.stack);
      console.error('[Gateway] Response data:', err.response?.data);
      console.error('[Gateway] Response status:', err.response?.status);

      throw new BadRequestException(
        err.response?.data?.message || err.message || 'Failed to create vehicle',
      );
    }
  }
  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  async updateVehicle(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    try {
      console.log('[Gateway] UPDATE Request received for ID:', id);
      console.log('[Gateway] Images:', images?.length || 0);
      console.log('[Gateway] Body:', JSON.stringify(body));

      if (!auth) {
        throw new BadRequestException('Missing Authorization header');
      }

      const form = new FormData();

      // Append images (nếu có)
      if (images && images.length > 0) {
        console.log('[Gateway] Appending', images.length, 'images...');
        for (const file of images) {
          form.append('images', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
          });
        }
      }

      // Append vehicle JSON
      if (body.vehicle) {
        form.append('vehicle', body.vehicle);
      } else {
        throw new BadRequestException('Missing vehicle JSON');
      }

      console.log('[Gateway] Forwarding UPDATE to Vehicle Service...');

      const response = await this.c.vehicle().rawRequest({
        method: 'PUT',
        url: `/vehicle/${id}`,
        headers: {
          ...form.getHeaders(),
          authorization: auth,
        },
        data: form,
      });

      console.log('[Gateway] ✅ UPDATE Success:', response.data);
      return response.data;
    } catch (err) {
      console.error('[Gateway] ❌ UPDATE Error:', err.message);
      console.error('[Gateway] Response:', err.response?.data);
      throw new BadRequestException(
        err.response?.data?.message || err.message || 'Failed to update vehicle',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.c.vehicle().delete(`/vehicle/${id}`);
    } catch (error) {
      this.logger.error('Error in remove:', error);
      throw error;
    }
  }
}
