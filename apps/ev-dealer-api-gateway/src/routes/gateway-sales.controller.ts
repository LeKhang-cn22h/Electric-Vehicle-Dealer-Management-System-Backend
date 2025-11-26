// Đây là ở Backend
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Patch,
  Headers,
  Query,
  HttpCode,
  HttpStatus,
  // UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ServiceClients } from '../service-clients';
import { IsUUID } from 'class-validator';

export class FindQuotationsByCreatorDto {
  @IsUUID()
  createBy: string;
}

@Controller('sales')
export class GatewaySalesController {
  constructor(private readonly c: ServiceClients) {}

  // ------------------------------
  // PRICING
  // ------------------------------
  @Get('price')
  findAllPricing(@Query() query: any, @Headers('authorization') auth: string) {
    return this.c.sales().get('/pricing-promotion/price', {
      authorization: auth,
      ...this.buildQueryHeaders(query),
    });
  }

  @Get('price/:id')
  findOnePricing(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().get(`/pricing-promotion/price/${id}`, {
      authorization: auth,
    });
  }

  @Post('price')
  @HttpCode(HttpStatus.CREATED)
  createPricing(@Body() body: any, @Headers('authorization') auth: string) {
    return this.c.sales().post('/pricing-promotion/price', body, {
      authorization: auth,
    });
  }

  @Patch('price/:id')
  updatePricing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.c.sales().patch(`/pricing-promotion/price/${id}`, body, {
      authorization: auth,
    });
  }

  @Delete('price/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePricing(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().delete(`/pricing-promotion/price/${id}`, {
      authorization: auth,
    });
  }

  // ------------------------------
  // PROMOTIONS
  // ------------------------------
  @Get('promotions')
  findAllPromotions(@Headers('authorization') auth: string) {
    return this.c.sales().get('/pricing-promotion/promotion', {
      authorization: auth,
    });
  }

  @Get('promotions/aplied')
  findAllAppliedPromotions(
    @Query('minOrderValue') minOrderValue = 0,
    @Query('minQuantity') minQuantity = 0,
    @Headers('authorization') auth: string,
  ) {
    const url = `/pricing-promotion/promotion/aplied?minOrderValue=${minOrderValue}&minQuantity=${minQuantity}`;
    return this.c.sales().get(url, { authorization: auth });
  }

  @Get('promotions/:id')
  findOnePromotion(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().get(`/pricing-promotion/promotion/${id}`, {
      authorization: auth,
    });
  }

  @Post('promotions')
  @HttpCode(HttpStatus.CREATED)
  createPromotion(@Body() body: any, @Headers('authorization') auth: string) {
    return this.c.sales().post('/pricing-promotion/promotion', body, {
      authorization: auth,
    });
  }

  @Patch('promotions/:id')
  updatePromotion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.c.sales().patch(`/pricing-promotion/promotion/${id}`, body, {
      authorization: auth,
    });
  }

  @Delete('promotions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePromotion(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().delete(`/pricing-promotion/promotion/${id}`, {
      authorization: auth,
    });
  }

  // ------------------------------
  // QUOTATIONS
  // ------------------------------
  @Get('quotations')
  findAllQuotations(@Query() query: any, @Headers('authorization') auth: string) {
    return this.c.sales().get('/quotations', {
      authorization: auth,
      ...this.buildQueryHeaders(query),
    });
  }

  @Get('quotations/:id')
  findOneQuotation(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().get(`/quotations/${id}`, {
      authorization: auth,
    });
  }

  @Get('quotations/creator/:id')
  async findAllByCreator(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('authorization') auth: string,
  ) {
    try {
      const url = `/quotations/creator/${id}`;
      const res = await this.c.sales().get(url, { authorization: auth });
      return res;
    } catch (e) {
      console.error('[GatewaySalesController] findAllByCreator error:', e);
      throw e;
    }
  }

  @Post('quotations')
  @HttpCode(HttpStatus.CREATED)
  createQuotation(@Body() body: any, @Headers('authorization') auth: string) {
    return this.c.sales().post('/quotations', body, {
      authorization: auth,
    });
  }

  @Patch('quotations/:id')
  updateQuotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.c.sales().patch(`/quotations/${id}`, body, {
      authorization: auth,
    });
  }

  @Delete('quotations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteQuotation(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().delete(`/quotations/${id}`, {
      authorization: auth,
    });
  }
  // ------------------------------
  // ORDERS
  // ------------------------------
  @Post('orders')
  async findAllOrders(@Body() filters: any, @Headers('authorization') auth: string) {
    try {
      const res = await this.c.sales().post('/orders', filters, { authorization: auth });
      return res;
    } catch (err) {
      console.error('Error in findAllOrders:', err);
      throw err;
    }
  }

  @Get('orders/:id')
  findOneOrder(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().get(`/orders/${id}`, {
      authorization: auth,
    });
  }

  @Post('orders/create')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() body: any, @Headers('authorization') auth: string) {
    try {
      return await this.c.sales().post('/orders/create', body, {
        authorization: auth,
      });
    } catch (err: any) {
      console.error('[Gateway] CreateOrder ERROR:', err?.response?.data || err?.message || err);
      throw err;
    }
  }

  @Patch('orders/:id')
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.c.sales().patch(`/orders/${id}`, body, {
      authorization: auth,
    });
  }

  @Delete('orders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteOrder(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().delete(`/orders/${id}`, {
      authorization: auth,
    });
  }

  @Patch('orders/:id/invoice')
  attachInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { invoiceId: string },
    @Headers('authorization') auth: string,
  ) {
    return this.c.sales().patch(`/orders/${id}/invoice`, body, {
      authorization: auth,
    });
  }

  // ------------------------------
  // CONTRACTS
  // ------------------------------
  @Get('contracts')
  findAllContracts(@Query() query: any, @Headers('authorization') auth: string) {
    return this.c.sales().get('/contracts', {
      authorization: auth,
      ...this.buildQueryHeaders(query),
    });
  }

  @Get('contracts/:id')
  findOneContract(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().get(`/contracts/${id}`, {
      authorization: auth,
    });
  }

  @Post('contracts')
  @HttpCode(HttpStatus.CREATED)
  createContract(@Body() body: any, @Headers('authorization') auth: string) {
    return this.c.sales().post('/contracts', body, {
      authorization: auth,
    });
  }

  @Patch('contracts/:id')
  updateContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    return this.c.sales().patch(`/contracts/${id}`, body, {
      authorization: auth,
    });
  }

  @Delete('contracts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteContract(@Param('id', ParseUUIDPipe) id: string, @Headers('authorization') auth: string) {
    return this.c.sales().delete(`/contracts/${id}`, {
      authorization: auth,
    });
  }

  // ------------------------------
  // HELPER METHODS
  // ------------------------------
  private buildQueryHeaders(query: any): Record<string, string> {
    const headers: Record<string, string> = {};

    if (query.page) headers['x-page'] = query.page.toString();
    if (query.limit) headers['x-limit'] = query.limit.toString();
    if (query.sort) headers['x-sort'] = query.sort;
    if (query.filter) headers['x-filter'] = query.filter;

    return headers;
  }
}
