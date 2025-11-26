import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  // BadRequestException,
  InternalServerErrorException,
  Logger,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('api/customer')
export class GatewayCustomersController {
  private readonly logger = new Logger(GatewayCustomersController.name);

  constructor(private readonly c: ServiceClients) {}

  // ========== ENDPOINTS CHO KHÁCH HÀNG ==========

  /**
   * Lấy danh sách tất cả khách hàng
   */
  @Get()
  async findAll() {
    try {
      this.logger.log(' Đang gọi service khách hàng để lấy danh sách');
      const result = await this.c.customer().get('/profile-customer');
      this.logger.log('Thành công, đã nhận dữ liệu khách hàng');
      return result;
    } catch (error) {
      this.logger.error('Lỗi khi gọi service khách hàng:');
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      this.logger.error('Mã trạng thái:', error.response?.status);
      this.logger.error('Chi tiết lỗi:', error.stack);
      throw new InternalServerErrorException('Không thể lấy danh sách khách hàng');
    }
  }

  /**
   * Lấy thông tin chi tiết của một khách hàng theo ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(` Đang lấy thông tin khách hàng với ID: ${id}`);
      const result = await this.c.customer().get(`/profile-customer/${id}`);
      this.logger.log(`Thành công, đã lấy thông tin khách hàng ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thông tin khách hàng ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Tạo mới một khách hàng
   */
  @Post()
  async create(@Headers('authorization') auth: string, @Body() body: any) {
    try {
      this.logger.log('Đang tạo mới khách hàng');
      const result = await this.c.customer().post('/profile-customer', body);
      this.logger.log('Thành công, đã tạo khách hàng mới');
      this.logger.log(`- Auth header:`, auth ? 'Present' : 'Missing');

      return result;
    } catch (error) {
      this.logger.error('Lỗi khi tạo khách hàng mới:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin khách hàng
   */
  @Put(':id')
  async update(@Param('id') id: string, @Headers('authorization') auth: string, @Body() body: any) {
    try {
      this.logger.log(`Đang cập nhật thông tin khách hàng ID: ${id}`);
      const result = await this.c.customer().put(`/profile-customer/${id}`, body);
      this.logger.log(`- Auth header:`, auth ? 'Present' : 'Missing');

      this.logger.log(`Thành công, đã cập nhật khách hàng ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật khách hàng ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Xóa một khách hàng
   */
  // ✅ SỬA THÀNH - Đúng endpoint
  @Put('delete/:id')
  async remove(@Param('id') id: string, @Headers('authorization') auth: string) {
    try {
      this.logger.log(`Đang xóa khách hàng ID: ${id}`);

      const headers: any = {};
      if (auth) {
        headers.authorization = auth;
      }

      const result = await this.c
        .customer()
        .put(`/profile-customer/delete/${id}`, undefined, { headers });

      this.logger.log(`Thành công, đã xóa khách hàng ID: ${id}`);
      return result.data; // ✅ QUAN TRỌNG: Trả về result.data
    } catch (error) {
      this.logger.error(`Lỗi khi xóa khách hàng ID ${id}:`, error.message);

      // ✅ Forward lỗi từ customer service
      if (error.response?.data) {
        throw error;
      }

      throw new InternalServerErrorException('Không thể xóa khách hàng');
    }
  }

  // ========== ENDPOINTS CHO PHẢN HỒI ==========

  @Get('feedback/all')
  async findAllFeedbacks(
    @Query('status') status?: string,
    @Query('customer_uid') customer_uid?: string,
  ) {
    try {
      this.logger.log(' Đang lấy danh sách tất cả phản hồi');

      // Xây dựng URL với các tham số query
      let url = '/feedback-customer';
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (customer_uid) queryParams.append('customer_uid', customer_uid);

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const result = await this.c.customer().get(url);
      this.logger.log('Thành công, đã lấy danh sách phản hồi');
      return result;
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách phản hồi:');
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      this.logger.error('Mã trạng thái:', error.response?.status);
      throw new InternalServerErrorException('Không thể lấy danh sách phản hồi');
    }
  }
  // lấy những feedback của người gửi
  @Get('feedback/allU')
  async FindFeedbackCustomer(@Headers('authorization') auth: string) {
    try {
      this.logger.log('Đang lấy danh sách dành cho customer');

      if (!auth) {
        throw new UnauthorizedException('Missing Authorization header');
      }

      const result = await this.c.customer().get('/feedback-customer/customer', {
        authorization: auth,
      } as any);

      this.logger.log('Thành công, đã lấy phản hồi');
      return result;
    } catch (error) {
      this.logger.error('Lỗi khi lấy phản hồi:');
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể lấy phản hồi');
    }
  }

  /**
   * Lấy thông tin chi tiết của một phản hồi theo ID
   */
  @Get('feedback/:id')
  async findFeedbackById(@Param('id') id: string) {
    try {
      this.logger.log(` Đang lấy thông tin phản hồi với ID: ${id}`);
      const result = await this.c.customer().get(`/feedback-customer/${id}`);
      this.logger.log(`Thành công, đã lấy thông tin phản hồi ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy thông tin phản hồi ID ${id}:`);
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể lấy thông tin phản hồi');
    }
  }

  /**
   * Lấy tất cả phản hồi của một khách hàng cụ thể
   */
  @Get('customer/:customer_uid/feedbacks')
  async getFeedbacksByCustomer(@Param('customer_uid') customer_uid: string) {
    try {
      this.logger.log(` Đang lấy phản hồi của khách hàng ID: ${customer_uid}`);
      const result = await this.c.customer().get(`/feedback-customer/customer/${customer_uid}`);
      this.logger.log(`Thành công, đã lấy phản hồi của khách hàng ID: ${customer_uid}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy phản hồi của khách hàng ID ${customer_uid}:`);
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể lấy phản hồi của khách hàng');
    }
  }

  /**
   * Tạo mới một phản hồi
   */
  @Post('feedback')
  async createFeedback(@Headers('authorization') auth: string, @Body() body: any) {
    try {
      this.logger.log('Đang tạo phản hồi mới');

      if (!auth) {
        throw new UnauthorizedException('Missing Authorization header');
      }

      // ⬅️ Forward token sang Feedback service
      const result = await this.c.customer().post('/feedback-customer', body, {
        authorization: auth,
      });

      this.logger.log('Thành công, đã tạo phản hồi mới');
      this.logger.log(`- Auth header:`, auth ? 'Present' : 'Missing');

      return result;
    } catch (error) {
      this.logger.error('Lỗi khi tạo phản hồi mới:');
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể tạo phản hồi mới');
    }
  }

  /**
   * Phản hồi lại từ admin cho một phản hồi của khách hàng
   */
  @Put('feedback/:id/reply')
  async replyToFeedback(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
    @Body() body: any,
  ) {
    try {
      this.logger.log(`Đang gửi phản hồi từ admin cho phản hồi ID: ${id}`);
      const result = await this.c.customer().put(`/feedback-customer/${id}/reply`, body, {
        authorization: auth,
      });
      this.logger.log(`Thành công, đã gửi phản hồi cho phản hồi ID: ${id}`);
      this.logger.log(`- Auth header:`, auth ? 'Present' : 'Missing');

      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi gửi phản hồi cho phản hồi ID ${id}:`);
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể gửi phản hồi');
    }
  }

  /**
   * Xóa một phản hồi
   */
  @Put('deletefeedback/:id')
  async deleteFeedback(@Param('id') id: string, @Headers('authorization') auth: string) {
    try {
      this.logger.log(`Đang xóa phản hồi ID: ${id}`);
      this.logger.log(`- Auth header:`, auth ? 'Present' : 'Missing');

      const result = await this.c.customer().put(`/feedback-customer/delete/${id}`, undefined);
      this.logger.log(`Thành công, đã xóa phản hồi ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi xóa phản hồi ID ${id}:`);
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể xóa phản hồi');
    }
  }
  // điều hướng đến liên kết hồ sơ
  @Post('auto-link')
  async autoLinkProfile(@Body() body: any) {
    try {
      this.logger.log('Đang forward auto-link hồ sơ khách hàng đến service customer');

      const result = await this.c.customer().post('/profile-customer/auto-link', body);

      this.logger.log('Thành công, đã auto-link hồ sơ khách hàng');
      return result;
    } catch (error) {
      this.logger.error('Lỗi auto-link hồ sơ khách hàng:');
      this.logger.error('Message:', error.message);
      this.logger.error('Response:', error.response?.data);

      throw new InternalServerErrorException('Không thể tự động liên kết hồ sơ');
    }
  }
}
