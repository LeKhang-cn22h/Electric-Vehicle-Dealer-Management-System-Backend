// evm-staff-api-gateway/src/routes/gateway-staff-coordination.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { ServiceClients } from '../service-clients';
import { CreateVehicleRequestDto } from '../../../evm-staff-coordination-service/src/dto/create-vehicle-request.dto';
import { ProcessVehicleRequestDto } from '../../../evm-staff-coordination-service/src/dto/process-vehicle-request.dto';

@Controller('staff-coordination')
export class GatewayStaffCoordinationController {
  constructor(private readonly serviceClients: ServiceClients) {}

  // Dealer gửi yêu cầu
  @Post('vehicle-requests')
  async createRequest(
    @Body() body: CreateVehicleRequestDto,
    @Headers('authorization') auth?: string,
    @Headers('user-id') userId?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }
    if (!userId) {
      throw new BadRequestException('User ID header is required');
    }

    return this.serviceClients.staffCoordination().post(
      '/vehicle-requests',
      {
        ...body,
        user_id: userId,
      },
      {
        authorization: auth,
        'user-id': userId,
      },
    );
  }

  // Hãng xem danh sách yêu cầu
  @Get('vehicle-requests')
  async getRequests(
    @Query('status') status?: string,
    @Query('dealer_name') dealer_name?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    let url = '/vehicle-requests?';
    const params = new URLSearchParams();

    if (status) params.append('status', status);
    if (dealer_name) params.append('dealer_name', dealer_name);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    url += params.toString();

    return this.serviceClients.staffCoordination().get(url, {
      authorization: auth,
    });
  }

  // Lấy yêu cầu theo user_id
  @Get('vehicle-requests/user/:userId')
  async getRequestsByUserId(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    let url = `/vehicle-requests/user/${userId}?`;
    const params = new URLSearchParams();

    if (status) params.append('status', status);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    url += params.toString();

    return this.serviceClients.staffCoordination().get(url, {
      authorization: auth,
    });
  }

  // Tìm kiếm theo email
  @Get('vehicle-requests/search/email')
  async searchByEmail(@Query('email') email: string, @Headers('authorization') auth?: string) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }
    if (!email) {
      throw new BadRequestException('Email query parameter is required');
    }

    const url = `/vehicle-requests/search/email?email=${encodeURIComponent(email)}`;

    return this.serviceClients.staffCoordination().get(url, {
      authorization: auth,
    });
  }

  // Lấy chi tiết yêu cầu
  @Get('vehicle-requests/:id')
  async getRequestById(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = `/vehicle-requests/${id}`;

    return this.serviceClients.staffCoordination().get(url, {
      authorization: auth,
    });
  }

  // Hãng xử lý yêu cầu (phê duyệt/từ chối)
  @Put('vehicle-requests/:id/process')
  async processRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ProcessVehicleRequestDto,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = `/vehicle-requests/${id}/process`;

    return this.serviceClients.staffCoordination().put(url, body, {
      authorization: auth,
    });
  }

  // Cập nhật yêu cầu
  @Put('vehicle-requests/:id')
  async updateRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<CreateVehicleRequestDto>,
    @Headers('authorization') auth?: string,
    @Headers('user-id') userId?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = `/vehicle-requests/${id}`;

    return this.serviceClients.staffCoordination().put(url, body, {
      authorization: auth,
      'user-id': userId,
    });
  }

  // Xóa yêu cầu
  @Delete('vehicle-requests/:id')
  async deleteRequest(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = `/vehicle-requests/${id}`;

    return this.serviceClients.staffCoordination().delete(url, {
      authorization: auth,
    });
  }

  // Dashboard thống kê
  @Get('vehicle-requests/stats/summary')
  async getStats(@Headers('authorization') auth?: string) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = '/vehicle-requests/stats/summary';

    return this.serviceClients.staffCoordination().get(url, {
      authorization: auth,
    });
  }

  // Health check
  @Get('vehicle-requests/health/check')
  async healthCheck(@Headers('authorization') auth?: string) {
    // Health check có thể không cần auth
    const url = '/vehicle-requests/health/check';

    return this.serviceClients.staffCoordination().get(url, {
      authorization: auth,
    });
  }
}
