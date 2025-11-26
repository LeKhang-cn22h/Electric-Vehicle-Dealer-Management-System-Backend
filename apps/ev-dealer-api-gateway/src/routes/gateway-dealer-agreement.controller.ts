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
// apps/ev-dealer-api-gateway/src/routes/gateway-dealer-agreement.controller.ts

// import { Controller, Post, Body, Headers, Get, Req } from '@nestjs/common';
// import { ServiceClients } from '../service-clients';
// import type { Request } from 'express';

// @Controller('dealer-agreement')
// export class GatewayDealerAgreementController {
//   constructor(private readonly c: ServiceClients) {}

//   /** Proxy tạo contract request */
//   @Post('contract-request')
//   createContractRequest(@Body() body: any, @Headers('authorization') auth: string) {
//     return this.c.dealerAgreement().post('/dealer-agreement/contract-request', body, {
//       authorization: auth, // 'authorization' viết thường đúng theo interface
//     });
//   }

//   @Get('history')
//   async getHistory(@Req() req: Request) {
//     return this.c.dealerAgreement().get('/dealer-agreement/history', {
//       authorization: req.headers.authorization as string | undefined,
//     });
//   }
// }
