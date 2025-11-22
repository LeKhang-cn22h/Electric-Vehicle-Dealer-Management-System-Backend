import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('model') model?: string,
    @Query('status') status?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      this.logger.log('Calling vehicle service GET /vehicle with filters');
      this.logger.log(
        `Filters: keyword=${keyword}, model=${model}, status=${status}, minPrice=${minPrice}, maxPrice=${maxPrice}, cursor=${cursor}, limit=${limit}`,
      );

      // Build query parameters
      const queryParams = new URLSearchParams();

      if (keyword) queryParams.append('keyword', keyword);
      if (model) queryParams.append('model', model);
      if (status) queryParams.append('status', status);
      if (minPrice) queryParams.append('minPrice', minPrice);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);
      if (cursor) queryParams.append('cursor', cursor);
      if (limit) queryParams.append('limit', limit);

      const queryString = queryParams.toString();
      const url = queryString ? `/vehicle?${queryString}` : '/vehicle';

      const result = await this.c.vehicle().get(url);
      this.logger.log(`Success, got ${result.data?.length || 0} vehicles`);
      return result;
    } catch (error) {
      this.logger.error(' Error calling vehicle service:');
      this.logger.error('Message:', error.message);
      this.logger.error('Response:', error.response?.data);
      this.logger.error('Status:', error.response?.status);
      throw new InternalServerErrorException('Failed to fetch vehicles');
    }
  }

  @Get('search')
  async searchAll(
    @Query('keyword') keyword: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      this.logger.log(`Searching vehicles with keyword: ${keyword}`);

      const queryParams = new URLSearchParams();
      queryParams.append('keyword', keyword);
      if (cursor) queryParams.append('cursor', cursor);
      if (limit) queryParams.append('limit', limit);

      const url = `/vehicle/search?${queryParams.toString()}`;
      const result = await this.c.vehicle().get(url);

      this.logger.log(`Search success, found ${result.data?.length || 0} vehicles`);
      return result;
    } catch (error) {
      this.logger.error(' Error in search:', error.message);
      throw new InternalServerErrorException('Failed to search vehicles');
    }
  }

  @Get('filter/model')
  async filterByModel(
    @Query('model') model: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      this.logger.log(`Filtering vehicles by model: ${model}`);

      const queryParams = new URLSearchParams();
      queryParams.append('model', model);
      if (cursor) queryParams.append('cursor', cursor);
      if (limit) queryParams.append('limit', limit);

      const url = `/vehicle/filter/model?${queryParams.toString()}`;
      const result = await this.c.vehicle().get(url);

      this.logger.log(`Model filter success, found ${result.data?.length || 0} vehicles`);
      return result;
    } catch (error) {
      this.logger.error(' Error in model filter:', error.message);
      throw new InternalServerErrorException('Failed to filter vehicles by model');
    }
  }

  @Get('models')
  async getAllModels() {
    try {
      this.logger.log('Getting all vehicle models');
      const result = await this.c.vehicle().get('/vehicle/models');
      this.logger.log(`Success, got ${result.length || 0} models`);
      return result;
    } catch (error) {
      this.logger.error(' Error getting models:', error.message);
      throw new InternalServerErrorException('Failed to fetch vehicle models');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Getting vehicle details for ID: ${id}`);
      const result = await this.c.vehicle().get(`/vehicle/${id}`);
      this.logger.log(`Success, found vehicle: ${result.name}`);
      return result;
    } catch (error) {
      this.logger.error(` Error getting vehicle ${id}:`, error.message);
      if (error.response?.status === 404) {
        throw new BadRequestException('Vehicle not found');
      }
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
      console.error('[Gateway]  CAUGHT ERROR:');
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

      console.log('[Gateway] UPDATE Success:', response.data);
      return response.data;
    } catch (err) {
      console.error('[Gateway]  UPDATE Error:', err.message);
      console.error('[Gateway] Response:', err.response?.data);
      throw new BadRequestException(
        err.response?.data?.message || err.message || 'Failed to update vehicle',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Deleting vehicle ID: ${id}`);
      const result = await this.c.vehicle().delete(`/vehicle/${id}`);
      this.logger.log(`Successfully deleted vehicle ${id}`);
      return result;
    } catch (error) {
      this.logger.error(` Error deleting vehicle ${id}:`, error.message);
      throw error;
    }
  }
  @Post('compare')
  async compareVehicles(@Body() compareDto: any, @Headers('authorization') auth: string) {
    try {
      this.logger.log('Comparing vehicles');
      this.logger.log(` Vehicle IDs: ${compareDto.vehicleIds}`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().post('/vehicle/compare', compareDto, headers);

      this.logger.log('Vehicle comparison successful');
      return result;
    } catch (error) {
      this.logger.error(' Error comparing vehicles:', error.message);
      this.logger.error('Response:', error.response?.data);
      throw new InternalServerErrorException('Failed to compare vehicles');
    }
  }
  @Get(':id/compare-suggestions')
  async getComparisonSuggestions(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Headers('authorization') auth?: string,
  ) {
    try {
      this.logger.log(`Getting comparison suggestions for vehicle ID: ${id}`);

      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit);

      const url = `/vehicle/${id}/compare-suggestions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const config: any = {};
      if (auth) {
        config.headers = { authorization: auth };
      }

      const result = await this.c.vehicle().get(url, config);
      this.logger.log(`Success, got ${result.data?.length || 0} suggestions`);
      return result;
    } catch (error) {
      this.logger.error(` Error getting comparison suggestions for ${id}:`, error.message);
      throw new InternalServerErrorException('Failed to get comparison suggestions');
    }
  }
  @Get('new-arrivals')
  async getNewArrivals(@Query('limit') limit?: string) {
    try {
      this.logger.log(`Getting new arrivals with limit=${limit}`);

      // tự build query string
      const qs = limit ? `?limit=${encodeURIComponent(limit)}` : '';
      const result = await this.c.vehicle().get(`/vehicle/new-arrivals${qs}`);

      // result.data mới là mảng vehicle từ BE
      const items = (result as any).data ?? result;
      this.logger.log(`Success, got ${Array.isArray(items) ? items.length : 0} new vehicles`);

      return items;
    } catch (error: any) {
      this.logger.error('Error fetching new arrivals:', error?.message || error);
      throw new InternalServerErrorException('Failed to fetch new arrivals');
    }
  }

  // gợi ý tương tự
  @Get(':id/similar')
  async getSimilarVehicles(@Param('id') id: string, @Query('limit') limit?: string) {
    try {
      this.logger.log(`Getting similar vehicles for ID=${id}, limit=${limit}`);

      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit);

      const url = `/vehicle/${id}/similar${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const result = await this.c.vehicle().get(url);

      this.logger.log(`Success, found ${result.data?.length || 0} similar vehicles`);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching similar vehicles for ${id}:`, error.message);
      throw new InternalServerErrorException('Failed to fetch similar vehicles');
    }
  }
  @Post('Vunit')
  async createVehicleUnit(@Body() dto: any, @Headers('authorization') auth: string) {
    try {
      this.logger.log('Comparing vehicles');
      this.logger.log(` Vehicle IDs: ${dto.vehicle_id}`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().post('/vehicle/VUnit', dto, headers);

      this.logger.log('VehicleUNit create successful');
      return result;
    } catch (error) {
      this.logger.error(' Error create unit vehicles:', error.message);
      this.logger.error('Response:', error.response?.data);
      throw new InternalServerErrorException('Failed to Unit vehicles');
    }
  }
  @Post('list')
  async findList(@Body('vehicleIds') vehicleIds: number[], @Headers('authorization') auth: string) {
    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      throw new Error('vehicleIds phải là mảng và không được để trống');
    }

    // Gửi đúng body đến microservice / API
    const result = await this.c.vehicle().post('/vehicle/list', { vehicleIds });

    return {
      success: true,
      data: result,
    };
  }
}
