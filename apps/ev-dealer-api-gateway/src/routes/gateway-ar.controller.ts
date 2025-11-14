import { Controller, Post, Body, Req, Query, Get } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('payments/vnpay')
export class GatewayARController {
  constructor(private readonly c: ServiceClients) {}

  @Post('create')
  async createPayment(@Body() body: any, @Req() req) {
    return this.c.ar().post('/vnpay/create', body, {
      'x-forwarded-for': req.ip,
    });
  }

  @Get('return')
  async vnpReturn(@Query() q: any) {
    return this.c.ar().get('/vnpay/return', q);
  }

  @Get('ipn')
  async vnpIpn(@Query() q: any) {
    return this.c.ar().get('/vnpay/ipn', q);
  }

  @Post('query')
  async queryPayment(@Body() body: any) {
    return this.c.ar().post('/vnpay/query', body);
  }
}
