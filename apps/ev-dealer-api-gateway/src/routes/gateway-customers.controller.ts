import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  // BadRequestException,
  InternalServerErrorException,
  Logger,
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
      const result = await this.c.customer().get('/customer');
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
      const result = await this.c.customer().get(`/customer/${id}`);
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
  async create(@Body() body: any) {
    try {
      this.logger.log('Đang tạo mới khách hàng');
      const result = await this.c.customer().post('/customer', body);
      this.logger.log('Thành công, đã tạo khách hàng mới');
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
  async update(@Param('id') id: string, @Body() body: any) {
    try {
      this.logger.log(`Đang cập nhật thông tin khách hàng ID: ${id}`);
      const result = await this.c.customer().put(`/customer/${id}`, body);
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
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Đang xóa khách hàng ID: ${id}`);
      const result = await this.c.customer().delete(`/customer/${id}`);
      this.logger.log(`Thành công, đã xóa khách hàng ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi xóa khách hàng ID ${id}:`, error);
      throw error;
    }
  }

  // ========== ENDPOINTS CHO PHẢN HỒI ==========

  /**
   * Lấy tất cả phản hồi với bộ lọc tùy chọn
   * @param status - Trạng thái phản hồi (pending, reviewed, resolved)
   * @param customer_id - ID khách hàng để lọc
   */
  @Get('feedback/all')
  async findAllFeedbacks(
    @Query('status') status?: string,
    @Query('customer_id') customer_id?: string,
  ) {
    try {
      this.logger.log(' Đang lấy danh sách tất cả phản hồi');

      // Xây dựng URL với các tham số query
      let url = '/feedback-customer';
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (customer_id) queryParams.append('customer_id', customer_id);

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

  /**
   * Lấy thống kê về phản hồi
   */
  @Get('feedback/stats')
  async getFeedbackStats() {
    try {
      this.logger.log('Đang lấy thống kê phản hồi');
      const result = await this.c.customer().get('/feedback-customer/stats');
      this.logger.log('Thành công, đã lấy thống kê phản hồi');
      return result;
    } catch (error) {
      this.logger.error('Lỗi khi lấy thống kê phản hồi:');
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể lấy thống kê phản hồi');
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
  @Get('customer/:customer_id/feedbacks')
  async getFeedbacksByCustomer(@Param('customer_id') customer_id: string) {
    try {
      this.logger.log(` Đang lấy phản hồi của khách hàng ID: ${customer_id}`);
      const result = await this.c.customer().get(`/feedback-customer/customer/${customer_id}`);
      this.logger.log(`Thành công, đã lấy phản hồi của khách hàng ID: ${customer_id}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy phản hồi của khách hàng ID ${customer_id}:`);
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể lấy phản hồi của khách hàng');
    }
  }

  /**
   * Tạo mới một phản hồi
   */
  @Post('feedback')
  async createFeedback(@Body() body: any) {
    try {
      this.logger.log('Đang tạo phản hồi mới');
      const result = await this.c.customer().post('/feedback-customer', body);
      this.logger.log('Thành công, đã tạo phản hồi mới');
      return result;
    } catch (error) {
      this.logger.error('Lỗi khi tạo phản hồi mới:');
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể tạo phản hồi mới');
    }
  }

  /**
   * Cập nhật thông tin phản hồi
   */
  @Put('feedback/:id')
  async updateFeedback(@Param('id') id: string, @Body() body: any) {
    try {
      this.logger.log(`Đang cập nhật phản hồi ID: ${id}`);
      const result = await this.c.customer().put(`/feedback-customer/${id}`, body);
      this.logger.log(`Thành công, đã cập nhật phản hồi ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật phản hồi ID ${id}:`);
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể cập nhật phản hồi');
    }
  }

  /**
   * Phản hồi lại từ admin cho một phản hồi của khách hàng
   */
  @Put('feedback/:id/reply')
  async replyToFeedback(@Param('id') id: string, @Body() body: any) {
    try {
      this.logger.log(`Đang gửi phản hồi từ admin cho phản hồi ID: ${id}`);
      const result = await this.c.customer().put(`/feedback-customer/${id}/reply`, body);
      this.logger.log(`Thành công, đã gửi phản hồi cho phản hồi ID: ${id}`);
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
  @Delete('feedback/:id')
  async deleteFeedback(@Param('id') id: string) {
    try {
      this.logger.log(`Đang xóa phản hồi ID: ${id}`);
      const result = await this.c.customer().delete(`/feedback-customer/${id}`);
      this.logger.log(`Thành công, đã xóa phản hồi ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi xóa phản hồi ID ${id}:`);
      this.logger.error('Thông báo lỗi:', error.message);
      this.logger.error('Phản hồi từ service:', error.response?.data);
      throw new InternalServerErrorException('Không thể xóa phản hồi');
    }
  }
}
