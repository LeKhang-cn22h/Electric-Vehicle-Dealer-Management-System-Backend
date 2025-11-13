import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('staff-coordination')
export class GatewayEvmStaffCoordinationController {
  constructor(private readonly clients: ServiceClients) {}

  @Post('create-response')
  createResponse(@Body() body: any, @Headers('authorization') auth: string) {
    return this.clients
      .evmStaffCoordination()
      .post('/staff-coordination/create-response', body, { Authorization: auth });
  }
}
