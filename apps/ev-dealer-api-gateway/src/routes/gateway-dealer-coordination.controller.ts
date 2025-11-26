//ev-dealer-api-gateway/src/routes/gateway-dealer-coordination.controller.ts
import { Controller, Post, Get, Body, Query, Headers, BadRequestException } from '@nestjs/common';
import { ServiceClients } from '../service-clients';
import { CreateVehicleRequestDto } from '../../../dealer-coordination/src/dto/create-vehicle-request.dto';

@Controller('dealer-coordination')
export class GatewayDealerCoordinationController {
  constructor(private readonly c: ServiceClients) {}

  // gateway-dealer-coordination.controller.ts
  @Post('requests')
  async createRequest(
    @Body() body: CreateVehicleRequestDto,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    // Thêm prefix /dealer-coordination
    return this.c.dealerCoordination().post('/dealer-coordination/requests', body, {
      authorization: auth,
    });
  }

  @Get('requests')
  async getRequests(
    @Query('dealer_name') dealer_name?: string,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    // Thêm prefix /dealer-coordination
    const url = dealer_name
      ? `/dealer-coordination/requests?dealer_name=${encodeURIComponent(dealer_name)}`
      : '/dealer-coordination/requests';

    return this.c.dealerCoordination().get(url, {
      authorization: auth,
    });
  }
}
