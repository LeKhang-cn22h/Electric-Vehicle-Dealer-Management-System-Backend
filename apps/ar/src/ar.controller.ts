import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ArService } from './ar.service';

@Controller('vnpay')
export class ArController {
  constructor(private readonly svc: ArService) {}

  @Post('create')
  create(@Body() b: any, @Req() req) {
    return this.svc.createVnpayPayment(b.inv_id, req, b.locale, b.bank_code);
  }

  // @Get('return')
  // vnpReturn(@Query() q: any) {
  //   return this.svc.handleVnpReturn(q);
  // }

  @Get('return')
  async vnpayReturn(@Query() query: any) {
    return this.svc.handleVnpReturn(query);
  }

  @Get('ipn')
  vnpIpn(@Query() q: any) {
    return this.svc.handleVnpIpn(q);
  }

  @Post('query')
  queryPayment(@Body() b: any) {
    return this.svc.queryPayment(b.txnRef);
  }
}
