import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Query,
  Body,
  Headers,
  HttpException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('billing')
export class GatewayBillingController {
  private billingURL = process.env.BILLING_SERVICE_URL || 'http://localhost:4300';

  constructor(private readonly http: HttpService) {}

  @Post('/bills')
  async createBill(@Body() body: any, @Headers('Idempotency-Key') idempotencyKey?: string) {
    try {
      const res$ = this.http.post(`${this.billingURL}/bills`, body, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      });
      const res = await firstValueFrom(res$);
      return res.data;
    } catch (err: any) {
      throw new HttpException(
        err?.response?.data || 'Billing service error',
        err?.response?.status || 500,
      );
    }
  }

  @Get('/bills')
  async listBills(@Query() query: any) {
    try {
      const res$ = this.http.get(`${this.billingURL}/bills`, { params: query });
      const res = await firstValueFrom(res$);
      return res.data;
    } catch (err: any) {
      throw new HttpException(
        err?.response?.data || 'Billing service error',
        err?.response?.status || 500,
      );
    }
  }

  @Get('/bills/:id')
  async getBill(@Param('id') id: string) {
    try {
      const res$ = this.http.get(`${this.billingURL}/bills/${id}`);
      const res = await firstValueFrom(res$);
      return res.data;
    } catch (err: any) {
      throw new HttpException(
        err?.response?.data || 'Billing service error',
        err?.response?.status || 500,
      );
    }
  }

  @Patch('/bills/:id/paid')
  async markPaid(@Param('id') id: string) {
    try {
      const res$ = this.http.patch(`${this.billingURL}/bills/${id}/paid`, {});
      const res = await firstValueFrom(res$);
      return res.data;
    } catch (err: any) {
      throw new HttpException(
        err?.response?.data || 'Billing service error',
        err?.response?.status || 500,
      );
    }
  }

  @Patch('/bills/:id/void')
  async voidBill(@Param('id') id: string) {
    try {
      const res$ = this.http.patch(`${this.billingURL}/bills/${id}/void`, {});
      const res = await firstValueFrom(res$);
      return res.data;
    } catch (err: any) {
      throw new HttpException(
        err?.response?.data || 'Billing service error',
        err?.response?.status || 500,
      );
    }
  }
}
