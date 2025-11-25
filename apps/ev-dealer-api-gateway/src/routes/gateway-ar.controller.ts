import { Controller, Post, Body, Req, Query, Get } from '@nestjs/common';
import { ServiceClients } from '../service-clients';
import axios from 'axios';

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
    console.log('[GATEWAY] VNPay return query from FE:', q);
    const params = new URLSearchParams(q as Record<string, string>).toString();
    const base = process.env.AR_SERVICE_URL || 'http://localhost:4400';

    const url = `${base}/vnpay/return?${params}`;
    console.log('[GATEWAY] Forwarding to AR URL =', url);

    const resp = await axios.get(url);
    return resp.data;
  }

  @Get('ipn')
  async vnpIpn(@Query() q: any) {
    return this.c.ar().get('/vnpay/ipn', { params: q });
  }

  @Post('query')
  async queryPayment(@Body() body: any) {
    return this.c.ar().post('/vnpay/query', body);
  }
}
