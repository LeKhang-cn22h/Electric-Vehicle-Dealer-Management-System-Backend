import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('dealer-coordination')
export class GatewayDealerCoordinationController {
  constructor(private readonly c: ServiceClients) {}
  @Post('create-request')
  createRequest(@Body() body: any, @Headers('authorization') auth: string) {
    return this.c
      .dealerCoordination()
      .post('/dealer-coordination/create-request', body, { Authorization: auth });
  }
}
