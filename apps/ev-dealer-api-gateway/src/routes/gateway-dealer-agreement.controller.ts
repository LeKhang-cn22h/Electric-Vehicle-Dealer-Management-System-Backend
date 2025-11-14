import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('dealer-agreement')
export class GatewayDealerAgreementController {
  constructor(private readonly c: ServiceClients) {}

  @Post('contract-request')
  createContractRequest(@Body() body: any, @Headers('authorization') auth: string) {
    return this.c.dealerAgreement().post('/dealer-agreement/contract-request', body, {
      Authorization: auth,
    });
  }
}
