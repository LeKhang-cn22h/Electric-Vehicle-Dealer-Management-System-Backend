import { Body, Controller, Get, Param, Post, Delete, Patch } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('sales')
export class GatewaySalesController {
  constructor(private readonly c: ServiceClients) {}

  // ------------------------------
  // PRICING
  // ------------------------------
  @Get('price')
  findAllPricing() {
    return this.c.sales().get('/pricing-promotion/price');
  }

  @Post('price')
  createPricing(@Body() body: any) {
    return this.c.sales().post('/pricing-promotion/price', body);
  }

  @Patch('price/:id')
  updatePricing(@Param('id') id: string, @Body() body: any) {
    return this.c.sales().put(`/pricing-promotion/price/${id}`, body);
  }

  @Delete('price/:id')
  deletePricing(@Param('id') id: string) {
    return this.c.sales().delete(`/pricing-promotion/price/${id}`);
  }

  // ------------------------------
  // PROMOTIONS
  // ------------------------------
  @Get('promotions')
  findAllPromotions() {
    return this.c.sales().get('/pricing-promotion/promotion');
  }

  @Get('promotions/:id')
  findOnePromotion(@Param('id') id: string) {
    return this.c.sales().get(`/pricing-promotion/promotion/${id}`);
  }

  @Post('promotions')
  createPromotion(@Body() body: any) {
    return this.c.sales().post('/pricing-promotion/promotion', body);
  }

  @Patch('promotions/:id')
  updatePromotion(@Param('id') id: string, @Body() body: any) {
    return this.c.sales().put(`/pricing-promotion/promotion/${id}`, body);
  }

  @Delete('promotions/:id')
  deletePromotion(@Param('id') id: string) {
    return this.c.sales().delete(`/pricing-promotion/promotion/${id}`);
  }

  // ------------------------------
  // QUOTATIONS
  // ------------------------------
  @Get('quotations')
  findAllQuotations() {
    return this.c.sales().get('/quotations');
  }

  @Get('quotations/:id')
  findOneQuotation(@Param('id') id: string) {
    return this.c.sales().get(`/quotations/${id}`);
  }

  @Post('quotations')
  createQuotation(@Body() body: any) {
    return this.c.sales().post('/quotations', body);
  }

  @Patch('quotations/:id')
  updateQuotation(@Param('id') id: string, @Body() body: any) {
    return this.c.sales().patch(`/quotations/${id}`, body);
  }

  @Delete('quotations/:id')
  deleteQuotation(@Param('id') id: string) {
    return this.c.sales().delete(`/quotations/${id}`);
  }

  // ------------------------------
  // ORDERS
  // ------------------------------
  @Get('orders')
  findAllOrders() {
    return this.c.sales().get('/orders');
  }

  @Get('orders/:id')
  findOneOrder(@Param('id') id: string) {
    return this.c.sales().get(`/orders/${id}`);
  }

  @Post('orders')
  createOrder(@Body() body: any) {
    return this.c.sales().post('/orders', body);
  }

  @Patch('orders/:id')
  updateOrder(@Param('id') id: string, @Body() body: any) {
    return this.c.sales().put(`/orders/${id}`, body);
  }

  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.c.sales().delete(`/orders/${id}`);
  }

  // ------------------------------
  // CONTRACTS
  // ------------------------------
  @Get('contracts')
  findAllContracts() {
    return this.c.sales().get('/contracts');
  }

  @Get('contracts/:id')
  findOneContract(@Param('id') id: string) {
    return this.c.sales().get(`/contracts/${id}`);
  }

  @Post('contracts')
  createContract(@Body() body: any) {
    return this.c.sales().post('/contracts', body);
  }

  @Patch('contracts/:id')
  updateContract(@Param('id') id: string, @Body() body: any) {
    return this.c.sales().put(`/contracts/${id}`, body);
  }

  @Delete('contracts/:id')
  deleteContract(@Param('id') id: string) {
    return this.c.sales().delete(`/contracts/${id}`);
  }
}
