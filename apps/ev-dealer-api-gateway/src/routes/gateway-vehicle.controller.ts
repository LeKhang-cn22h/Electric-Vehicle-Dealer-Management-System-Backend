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
  Patch,
  ParseIntPipe,
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
  //gửi danh sách xe
  @Post('list')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      this.logger.log('Creating appointment for customer');

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c.vehicle().post('/appointments', dto, headers);
      const responseData = result.data;

      // KIỂM TRA SUCCESS FLAG TRƯỚC KHI LOG
      if (!responseData.success) {
        // Business logic error
        const errorCode = responseData.errorCode || 'UNKNOWN';
        this.logger.debug(` Business error: ${errorCode} - ${responseData.message}`);

        // RETURN NGUYÊN RESPONSE - Frontend sẽ xử lý
        return responseData;
      }

      // CHỈ LOG SUCCESS KHI THẬT SỰ THÀNH CÔNG
      this.logger.log(`Appointment created - ID: ${responseData.data?.id}`);
      return responseData;
    } catch (err: any) {
      // CHỈ LOG ERROR CHO SERVER/NETWORK ERRORS
      const statusCode = err.response?.status || 500;

      if (statusCode >= 500) {
        this.logger.error(`Server error (${statusCode}): ${err.message}`);
        this.logger.error('Response:', err.response?.data);
      } else {
        this.logger.debug(`Client error (${statusCode}): ${err.message}`);
      }

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
  @Get('appointments/test-drive-slots/customer')
  async findAllSlotsForCustomer(@Headers('authorization') auth?: string) {
    this.logger.log('Fetching available test drive slots for customer');

    const headers: Record<string, string> = {};
    if (auth) headers.authorization = auth;

    const result = await this.c.vehicle().get('/appointments/test-drive-slots/customer', headers);

    // Xử lý cả 2 trường hợp: array trực tiếp hoặc wrapped trong .data
    const slots = Array.isArray(result) ? result : result.data;

    this.logger.log(`Success, got ${slots?.length || 0} available slots`);
    return slots;
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
  //mở lại slot đã đóng (admin)
  @Patch('test-drive-slots/:id/reopen')
  async reopenSlot(@Param('id') id: string, @Headers('authorization') auth: string) {
    try {
      this.logger.log(`Reopening test drive slot ID=${id}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c
        .vehicle()
        .patch(`/appointments/test-drive-slots/${id}/reopen`, {}, headers);
      this.logger.log(`Slot ${id} reopened successfully`);
      return result;
    } catch (err: any) {
      this.logger.error(`Error reopening slot ${id}:`, err.message);
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

  //VEHICLE UNITS

  // Tạo vehicle unit
  @Post('units')
  async createVehicleUnit(@Body() dto: any, @Headers('authorization') auth: string) {
    try {
      this.logger.log('Creating vehicle unit');
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c.vehicle().post('/vehicle/units', dto, headers);

      this.logger.log('Vehicle unit created successfully');
      return result;
    } catch (error) {
      this.logger.error('Error creating vehicle unit:', error.message);
      this.logger.error('Response:', error.response?.data);
      throw new InternalServerErrorException('Failed to create vehicle unit');
    }
  }

  // Lấy tất cả units (có filter)
  @Get('units')
  async getAllVehicleUnits(
    @Query('vehicle_id') vehicle_id?: string,
    @Query('status') status?: string,
    @Query('warehouse_id') warehouse_id?: string,
    @Headers('authorization') auth?: string,
  ) {
    try {
      // LOG 1: Check giá trị nhận được
      this.logger.log('=== RECEIVED QUERY PARAMS ===');
      this.logger.log(`vehicle_id: "${vehicle_id}" (type: ${typeof vehicle_id})`);
      this.logger.log(`status: "${status}" (type: ${typeof status})`);
      this.logger.log(`warehouse_id: "${warehouse_id}" (type: ${typeof warehouse_id})`);

      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const queryParams = new URLSearchParams();

      if (vehicle_id && vehicle_id !== 'undefined') {
        queryParams.append('vehicle_id', vehicle_id);
      }
      if (status && status !== 'undefined') {
        queryParams.append('status', status);
      }
      if (warehouse_id && warehouse_id !== 'undefined') {
        queryParams.append('warehouse_id', warehouse_id);
      }

      const queryString = queryParams.toString();
      const url = `/vehicle/units${queryString ? '?' + queryString : ''}`;

      // LOG 2: Check URL cuối cùng
      this.logger.log('=== FINAL REQUEST ===');
      this.logger.log(`URL: ${url}`);
      this.logger.log(`Query String: ${queryString}`);

      const result = await this.c.vehicle().get(url, headers);

      this.logger.log('Vehicle units fetched successfully');
      return result;
    } catch (error) {
      // LOG 3: Check lỗi chi tiết
      this.logger.error('=== ERROR DETAILS ===');
      this.logger.error(`Message: ${error.message}`);
      this.logger.error(`Response: ${JSON.stringify(error.response?.data || {})}`);
      throw new InternalServerErrorException('Failed to fetch vehicle units');
    }
  }

  @Get('units/group/:id')
  async getVehicleUnitsGroup(@Param('id') id: string, @Headers('authorization') auth?: string) {
    try {
      this.logger.log(`Fetching vehicle units group for vehicle ID: ${id}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c.vehicle().get(`/vehicle/units/group/${id}`, headers);
      this.logger.log('Vehicle units group fetched successfully');
      return result;
    } catch (error) {
      this.logger.error(`Error fetching vehicle units group for ${id}:`, error.message);
      throw new InternalServerErrorException('Failed to fetch vehicle units group');
    }
  }
  // Lấy một unit theo VIN
  @Get('units/vin/:vin')
  async getUnitByVIN(@Param('vin') vin: string, @Headers('authorization') auth?: string) {
    try {
      this.logger.log(`Fetching vehicle unit with VIN: ${vin}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c.vehicle().get(`/vehicle/units/vin/${vin}`, headers);

      this.logger.log('Vehicle unit fetched successfully by VIN');
      return result;
    } catch (error) {
      this.logger.error(`Error fetching vehicle unit by VIN ${vin}:`, error.message);
      throw new InternalServerErrorException('Failed to fetch vehicle unit by VIN');
    }
  }

  // Đếm số lượng xe chưa điều phối theo vehicleId
  @Get('units/count/undeployed/:vehicleId')
  async countUndeployed(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Headers('authorization') auth?: string,
  ) {
    try {
      this.logger.log(`Counting undeployed units for vehicle: ${vehicleId}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c
        .vehicle()
        .get(`/vehicle/units/count/undeployed/${vehicleId}`, headers);

      this.logger.log('Undeployed units counted successfully');
      return result;
    } catch (error) {
      this.logger.error(`Error counting undeployed units:`, error.message);
      throw new InternalServerErrorException('Failed to count undeployed units');
    }
  }

  // Đếm số lượng xe chưa được phân kho (available)
  @Get('units/count/unallocated/:vehicleId')
  async countUnallocated(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Headers('authorization') auth?: string,
  ) {
    try {
      this.logger.log(`Counting unallocated units for vehicle: ${vehicleId}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c
        .vehicle()
        .get(`/vehicle/units/count/unallocated/${vehicleId}`, headers);

      this.logger.log('Unallocated units counted successfully');
      return result;
    } catch (error) {
      this.logger.error(`Error counting unallocated units:`, error.message);
      throw new InternalServerErrorException('Failed to count unallocated units');
    }
  }

  // Điều phối 1 xe xuống kho
  @Patch('units/deploy/single')
  async deploySingle(
    @Body('unit_id', ParseIntPipe) unitId: number,
    @Body('warehouse_id', ParseIntPipe) warehouseId: number,
    @Headers('authorization') auth: string,
  ) {
    try {
      this.logger.log(`Deploying single unit ${unitId} to warehouse ${warehouseId}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c
        .vehicle()
        .patch(
          '/vehicle/units/deploy/single',
          { unit_id: unitId, warehouse_id: warehouseId },
          headers,
        );

      this.logger.log('Single unit deployed successfully');
      return result;
    } catch (error) {
      this.logger.error('Error deploying single unit:', error.message);
      this.logger.error('Response:', error.response?.data);
      throw new InternalServerErrorException('Failed to deploy single unit');
    }
  }

  // Điều phối nhiều xe theo số lượng
  @Patch('units/deploy/multiple')
  async deployMultiple(@Body() dto: any, @Headers('authorization') auth: string) {
    try {
      this.logger.log('Deploying multiple units');
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c.vehicle().patch('/vehicle/units/deploy/multiple', dto, headers);

      this.logger.log('Multiple units deployed successfully');
      return result;
    } catch (error) {
      this.logger.error('Error deploying multiple units:', error.message);
      this.logger.error('Response:', error.response?.data);
      throw new InternalServerErrorException('Failed to deploy multiple units');
    }
  }

  // Điều phối theo danh sách ID
  @Patch('units/deploy/batch')
  async deployBatch(@Body() dto: any, @Headers('authorization') auth: string) {
    try {
      this.logger.log('Deploying batch units');
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c.vehicle().patch('/vehicle/units/deploy/batch', dto, headers);

      this.logger.log('Batch units deployed successfully');
      return result;
    } catch (error) {
      this.logger.error('Error deploying batch units:', error.message);
      this.logger.error('Response:', error.response?.data);
      throw new InternalServerErrorException('Failed to deploy batch units');
    }
  }

  // Thanh toán xe bằng VIN
  @Patch('units/pay')
  async payVehicle(@Body('vin') vin: string, @Headers('authorization') auth: string) {
    try {
      this.logger.log(`Processing payment for vehicle VIN: ${vin}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c.vehicle().patch('/vehicle/units/pay', { vin }, headers);

      this.logger.log('Vehicle payment processed successfully');
      return result;
    } catch (error) {
      this.logger.error('Error processing vehicle payment:', error.message);
      this.logger.error('Response:', error.response?.data);
      throw new InternalServerErrorException('Failed to process vehicle payment');
    }
  }

  // Lấy danh sách xe available theo vehicleId (+ optional warehouse)
  @Get('units/available/:vehicleId')
  async getAvailableUnits(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Query('warehouse_id') warehouse_id?: number,
    @Headers('authorization') auth?: string,
  ) {
    try {
      this.logger.log(`Fetching available units for vehicle: ${vehicleId}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }

      const url = warehouse_id
        ? `/vehicle/units/available/${vehicleId}?warehouse_id=${warehouse_id}`
        : `/vehicle/units/available/${vehicleId}`;

      const result = await this.c.vehicle().get(url, headers);

      this.logger.log('Available units fetched successfully');
      return result;
    } catch (error) {
      this.logger.error('Error fetching available units:', error.message);
      throw new InternalServerErrorException('Failed to fetch available units');
    }
  }
  // Lấy một unit theo ID
  @Get('units/:id')
  async getUnitById(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth?: string,
  ) {
    try {
      this.logger.log(`Fetching vehicle unit with ID: ${id}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c.vehicle().get(`/vehicle/units/${id}`, headers);

      this.logger.log('Vehicle unit fetched successfully');
      return result;
    } catch (error) {
      this.logger.error(`Error fetching vehicle unit ${id}:`, error.message);
      throw new InternalServerErrorException('Failed to fetch vehicle unit');
    }
  }

  // Update unit
  @Put('units/:id')
  async updateUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Headers('authorization') auth: string,
  ) {
    try {
      this.logger.log(`Updating vehicle unit with ID: ${id}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c.vehicle().put(`/vehicle/units/${id}`, dto, headers);

      this.logger.log('Vehicle unit updated successfully');
      return result;
    } catch (error) {
      this.logger.error(`Error updating vehicle unit ${id}:`, error.message);
      this.logger.error('Response:', error.response?.data);
      throw new InternalServerErrorException('Failed to update vehicle unit');
    }
  }

  // Xoá unit
  @Delete('units/:id')
  async deleteUnit(@Param('id', ParseIntPipe) id: number, @Headers('authorization') auth: string) {
    try {
      this.logger.log(`Deleting vehicle unit with ID: ${id}`);
      const headers: Record<string, string> = {};
      if (auth) {
        headers.authorization = auth;
      }
      const result = await this.c.vehicle().delete(`/vehicle/units/${id}`, headers);

      this.logger.log('Vehicle unit deleted successfully');
      return result;
    } catch (error) {
      this.logger.error(`Error deleting vehicle unit ${id}:`, error.message);
      throw new InternalServerErrorException('Failed to delete vehicle unit');
    }
  }
}
