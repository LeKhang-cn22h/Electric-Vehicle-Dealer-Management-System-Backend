// //ev-dealer-api-gateway/src/routes/gateway-dealer-coordination.controller.ts
// import { Controller, Post, Get, Body, Query, Headers, BadRequestException } from '@nestjs/common';
// import { ServiceClients } from '../service-clients';
// import { CreateVehicleRequestDto } from '../../../dealer-coordination/src/dto/create-vehicle-request.dto';

// @Controller('dealer-coordination')
// export class GatewayDealerCoordinationController {
//   constructor(private readonly c: ServiceClients) {}

//   // gateway-dealer-coordination.controller.ts
//   @Post('requests')
//   async createRequest(
//     @Body() body: CreateVehicleRequestDto,
//     @Headers('authorization') auth?: string,
//   ) {
//     if (!auth) {
//       throw new BadRequestException('Authorization header is required');
//     }

//     // Thêm prefix /dealer-coordination
//     return this.c.dealerCoordination().post('/dealer-coordination/requests', body, {
//       authorization: auth,
//     });
//   }

//   @Get('requests')
//   async getRequests(
//     @Query('dealer_name') dealer_name?: string,
//     @Headers('authorization') auth?: string,
//   ) {
//     if (!auth) {
//       throw new BadRequestException('Authorization header is required');
//     }

//     // Thêm prefix /dealer-coordination
//     const url = dealer_name
//       ? `/dealer-coordination/requests?dealer_name=${encodeURIComponent(dealer_name)}`
//       : '/dealer-coordination/requests';

//     return this.c.dealerCoordination().get(url, {
//       authorization: auth,
//     });
//   }
// }
//ev-dealer-api-gateway/src/routes/gateway-dealer-coordination.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { ServiceClients } from '../service-clients';
import { CreateVehicleRequestDto } from '../../../dealer-coordination/src/dto/create-vehicle-request.dto';

@Controller('dealer-coordination')
export class GatewayDealerCoordinationController {
  constructor(private readonly c: ServiceClients) {}

  // Tạo yêu cầu mới
  @Post('requests')
  async createRequest(
    @Body() body: CreateVehicleRequestDto,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    return this.c.dealerCoordination().post('/dealer-coordination/requests', body, {
      authorization: auth,
    });
  }

  // Lấy danh sách requests (có thể filter theo dealer_name)
  @Get('requests')
  async getRequests(
    @Query('dealer_name') dealer_name?: string,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = dealer_name
      ? `/dealer-coordination/requests?dealer_name=${encodeURIComponent(dealer_name)}`
      : '/dealer-coordination/requests';

    return this.c.dealerCoordination().get(url, {
      authorization: auth,
    });
  }

  // THÊM: Lấy requests theo status
  @Get('requests/status/:status')
  async getRequestsByStatus(
    @Param('status') status: string,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = `/dealer-coordination/requests/status/${status}`;

    return this.c.dealerCoordination().get(url, {
      authorization: auth,
    });
  }

  // THÊM: Cập nhật status của request
  @Put('requests/:id/status')
  async updateRequestStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = `/dealer-coordination/requests/${id}/status`;

    return this.c.dealerCoordination().put(url, body, {
      authorization: auth,
    });
  }

  // THÊM: Lấy chi tiết request theo ID
  @Get('requests/:id')
  async getRequestById(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = `/dealer-coordination/requests/${id}`;

    return this.c.dealerCoordination().get(url, {
      authorization: auth,
    });
  }

  // THÊM: Lấy tất cả requests (không filter)
  @Get('requests/all')
  async getAllRequests(@Headers('authorization') auth?: string) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const url = '/dealer-coordination/requests';

    return this.c.dealerCoordination().get(url, {
      authorization: auth,
    });
  }
}
