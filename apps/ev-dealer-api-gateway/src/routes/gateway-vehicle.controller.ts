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
  //lấy tất cả xe
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
  // tìm kiếm xe

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
  // lọc xe theo model
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
  //lấy tên tất cả các model
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

  @Get('noPrice')
  async getListVehicleWithNoPrice() {
    try {
      this.logger.log('Getting all vehicle no create price');
      const result = await this.c.vehicle().get('/vehicle/noPrice');
      this.logger.log(`Success, got ${result.length || 0} noPrice`);
      return result;
    } catch (error) {
      this.logger.error(' Error getting models no price:', error.message);
      throw new InternalServerErrorException('Failed to fetch vehicle models no price');
    }
  }

  //lấy xe cụ thể
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
  // tạo xe
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
  //cập nhật xe
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
  // xóa xe
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
  //so sánh xe
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
  // tiến hành so sánh xe
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
  //lấy xe mới
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
  //tạo xe cụ thể
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
  //gửi danh sách xe
  @Post('list')
  async findList(@Body('vehicleIds') vehicleIds: number[], @Headers('authorization') auth: string) {
    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      throw new Error('vehicleIds phải là mảng và không được để trống');
    }
    const result = await this.c.vehicle().post('/vehicle/list', { vehicleIds });

    return {
      success: true,
      data: result,
    };
  }
  // APPOINTMENTS (Lịch hẹn lái thử)
  // ===========================

  // Tạo lịch hẹn (khách đặt)
  @Post('appointments')
  async createAppointment(@Headers('authorization') auth: string, @Body() dto: any) {
    try {
      this.logger.log(`Creating appointment for customer`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().post('/appointments', dto, headers);
      this.logger.log('Appointment created successfully');
      return result;
    } catch (err: any) {
      this.logger.error('Error creating appointment:', err.message);
      this.logger.error('Response:', err.response?.data);
      throw new BadRequestException(err.response?.data?.message || err.message);
    }
  }

  // Lấy lịch sử đặt lái thử của khách hàng
  @Get('appointments/history/customer')
  async findAppointmentHistoryForCustomer(@Headers('authorization') auth: string) {
    try {
      this.logger.log('Fetching appointment history for customer');

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().get('/appointments/history/customer', headers);
      this.logger.log('Appointment history fetched successfully');
      return result;
    } catch (err: any) {
      this.logger.error('Error fetching appointment history:', err.message);
      throw new InternalServerErrorException(err.response?.data?.message || err.message);
    }
  }

  // Lấy tất cả lịch hẹn (admin)
  @Get('appointments/all')
  async findAllAppointments(@Headers('authorization') auth: string) {
    try {
      this.logger.log('Fetching all appointments (admin)');

      // Tạo headers với authorization
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // QUAN TRỌNG: Truyền authorization header xuống service vehicle
      if (auth) {
        headers.authorization = auth;
        this.logger.log('Authorization header included');
      } else {
        this.logger.warn('No authorization header provided');
      }

      // Gọi service vehicle với headers đầy đủ
      const result = await this.c.vehicle().get('/appointments/all', {
        auth, // Đảm bảo truyền headers
      });

      this.logger.log(`Success, got ${result.data?.length || 0} appointments`);
      return result;
    } catch (err: any) {
      this.logger.error('Error fetching appointments:', err.message);
      this.logger.error('Error details:', err.response?.data);
      throw new InternalServerErrorException(err.response?.data?.message || err.message);
    }
  }

  // Lấy chi tiết 1 lịch hẹn
  @Get('appointments/:id')
  async findOneAppointment(@Param('id') id: string, @Headers('authorization') auth: string) {
    try {
      this.logger.log(`Fetching appointment ID=${id}`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().get(`/appointments/${id}`, headers);
      this.logger.log(`Success, found appointment ${id}`);
      return result;
    } catch (err: any) {
      this.logger.error(`Error fetching appointment ${id}:`, err.message);
      throw new BadRequestException(err.response?.data?.message || err.message);
    }
  }

  // Cập nhật lịch hẹn
  @Put('appointments/:id')
  async updateAppointment(
    @Param('id') id: string,
    @Body() dto: any,
    @Headers('authorization') auth: string,
  ) {
    try {
      this.logger.log(`Updating appointment ID=${id}`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().put(`/appointments/${id}`, dto, headers);
      this.logger.log(`Appointment ${id} updated successfully`);
      return result;
    } catch (err: any) {
      this.logger.error(`Error updating appointment ${id}:`, err.message);
      throw new BadRequestException(err.response?.data?.message || err.message);
    }
  }

  // Xóa lịch hẹn
  @Delete('appointments/:id')
  async removeAppointment(@Param('id') id: string, @Headers('authorization') auth: string) {
    try {
      this.logger.log(`Deleting appointment ID=${id}`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().delete(`/appointments/${id}`, headers);
      this.logger.log(`Appointment ${id} deleted successfully`);
      return result;
    } catch (err: any) {
      this.logger.error(`Error deleting appointment ${id}:`, err.message);
      throw new BadRequestException(err.response?.data?.message || err.message);
    }
  }

  // ===========================
  // TEST DRIVE SLOTS (Slot lái thử)
  // ===========================

  // Khách xem slot available
  @Get('test-drive-slots')
  async findAllSlotsForCustomer(@Headers('authorization') auth?: string) {
    try {
      this.logger.log('Fetching available test drive slots for customer');

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().get('/appointments/test-drive-slots', headers);
      this.logger.log(`Success, got ${result.data?.length || 0} available slots`);
      return result;
    } catch (err: any) {
      this.logger.error('Error fetching slots:', err.message);
      throw new InternalServerErrorException(err.response?.data?.message || err.message);
    }
  }

  // Admin xem tất cả slot
  @Get('test-drive-slots/admin')
  async findAllSlotsForAdmin(@Headers('authorization') auth: string) {
    try {
      this.logger.log('Fetching all test drive slots (admin)');

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().get('/appointments/test-drive-slots/admin', headers);
      this.logger.log(`Success, got ${result.data?.length || 0} slots`);
      return result;
    } catch (err: any) {
      this.logger.error('Error fetching slots:', err.message);
      throw new InternalServerErrorException(err.response?.data?.message || err.message);
    }
  }

  // Tạo slot mới (admin)
  @Post('test-drive-slots')
  async createSlot(@Body() dto: any, @Headers('authorization') auth: string) {
    try {
      this.logger.log('Creating new test drive slot');

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().post('/appointments/test-drive-slots', dto, headers);
      this.logger.log('Test drive slot created successfully');
      return result;
    } catch (err: any) {
      this.logger.error('Error creating test drive slot:', err.message);
      throw new BadRequestException(err.response?.data?.message || err.message);
    }
  }

  // Lấy chi tiết 1 slot
  @Get('test-drive-slots/:id')
  async findOneSlot(@Param('id') id: string, @Headers('authorization') auth?: string) {
    try {
      this.logger.log(`Fetching test drive slot ID=${id}`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().get(`/appointments/test-drive-slots/${id}`, headers);
      this.logger.log(`Success, found slot ${id}`);
      return result;
    } catch (err: any) {
      this.logger.error(`Error fetching slot ${id}:`, err.message);
      throw new BadRequestException(err.response?.data?.message || err.message);
    }
  }

  // Cập nhật slot
  @Put('test-drive-slots/:id')
  async updateSlot(
    @Param('id') id: string,
    @Body() dto: any,
    @Headers('authorization') auth: string,
  ) {
    try {
      this.logger.log(`Updating test drive slot ID=${id}`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c
        .vehicle()
        .put(`/appointments/test-drive-slots/${id}`, dto, headers);
      this.logger.log(`Slot ${id} updated successfully`);
      return result;
    } catch (err: any) {
      this.logger.error(`Error updating slot ${id}:`, err.message);
      throw new BadRequestException(err.response?.data?.message || err.message);
    }
  }

  // Xóa/Ẩn slot
  @Delete('test-drive-slots/:id')
  async removeSlot(@Param('id') id: string, @Headers('authorization') auth: string) {
    try {
      this.logger.log(`Hiding test drive slot ID=${id}`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().delete(`/appointments/test-drive-slots/${id}`, headers);
      this.logger.log(`Slot ${id} hidden successfully`);
      return result;
    } catch (err: any) {
      this.logger.error(`Error hiding slot ${id}:`, err.message);
      throw new BadRequestException(err.response?.data?.message || err.message);
    }
  }
}
