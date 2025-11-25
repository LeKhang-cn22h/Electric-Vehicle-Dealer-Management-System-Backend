// import { Controller, Post, Body, Headers } from '@nestjs/common';
// import { ServiceClients } from '../service-clients';

// @Controller('dealer-coordination')
// export class GatewayDealerCoordinationController {
//   constructor(private readonly c: ServiceClients) {}
//   @Post('create-request')
//   createRequest(@Body() body: any, @Headers('authorization') auth: string) {
//     return this.c
//       .dealerCoordination()
//       .post('/dealer-coordination/create-request', body, { Authorization: auth });
//   }
// }
import { Controller, Post, Get, Body, Headers, Query, Param } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('dealer-coordination')
export class GatewayDealerCoordinationController {
  constructor(private readonly c: ServiceClients) {}

  // === POST /dealer-coordination/requests ===
  @Post('requests')
  createRequest(@Body() body: any, @Headers('authorization') auth: string) {
    return this.c
      .dealerCoordination()
      .post('/dealer-coordination/requests', body, { Authorization: auth });
  }

  // === GET /dealer-coordination/requests?dealer_name=... ===
  @Get('requests')
  getRequests(@Query('dealer_name') dealer_name: string, @Headers('authorization') auth: string) {
    return this.c.dealerCoordination().get('/dealer-coordination/requests', {
      Authorization: auth,
      dealer_name,
    });
  }

  // === GET /dealer-coordination/requests/:dealer_id ===
  @Get('requests/:dealer_id')
  getRequestsByDealerId(
    @Param('dealer_id') dealerId: string,
    @Headers('authorization') auth: string,
  ) {
    return this.c
      .dealerCoordination()
      .get(`/dealer-coordination/requests/${dealerId}`, { Authorization: auth });
  }
}
