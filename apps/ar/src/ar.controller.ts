import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ArService } from './ar.service';
import { CreateZpDto } from './dtos/create-zp.dto';
import { QueryZpDto } from './dtos/query-zp.dto';
import { RefundZpDto } from './dtos/refund-zp.dto';

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ArController {
  constructor(private readonly svc: ArService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      ts: new Date().toISOString(),
      ZP_KEY1: process.env.ZP_KEY1 ?? 'not found',
      ZP_APP_ID: process.env.ZP_APP_ID ?? 'not found',
    };
  }

  // CREATE ORDER
  @Post('payments/zalopay/create')
  create(@Body() dto: CreateZpDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    return this.svc.zpCreateOrder(dto.inv_id, dto.app_user ?? 'ev-dealer', ip);
  }

  // CALLBACK (IPN)
  @Post('payments/zalopay/callback')
  async callback(@Body() body: any, @Res() res: Response) {
    const result = await this.svc.zpHandleCallback(body);
    return res.json(result);
  }

  // QUERY
  @Get('payments/zalopay/query')
  query(@Query() q: QueryZpDto) {
    return this.svc.zpQuery(q.app_trans_id);
  }

  // REFUND
  @Post('payments/zalopay/refund')
  refund(@Body() b: RefundZpDto) {
    return this.svc.zpRefund(b.zp_trans_id, b.amount, b.description, b.m_refund_id);
  }
}
