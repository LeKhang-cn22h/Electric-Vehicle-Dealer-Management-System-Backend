import { Body, Controller, Get, Param, Post, Put, Delete, Patch } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('sales')
export class GatewaySalesController {
  constructor(private readonly c: ServiceClients) {}

  // ------------------------------
  // PRICING
  // ------------------------------
  @Get('pricing')
  findAllPricing() {
    return this.c.sales().get('/pricing');
  }

  @Post('pricing')
  createPricing(@Body() body: any) {
    return this.c.sales().post('/pricing', body);
  }

  @Put('pricing/:id')
  updatePricing(@Param('id') id: string, @Body() body: any) {
    return this.c.sales().put(`/pricing/${id}`, body);
  }

  @Delete('pricing/:id')
  deletePricing(@Param('id') id: string) {
    return this.c.sales().delete(`/pricing/${id}`);
  }

  // ------------------------------
  // PROMOTIONS
  // ------------------------------
  @Get('promotions')
  findAllPromotions() {
    return this.c.sales().get('/promotions');
  }

  @Get('promotions/:id')
  findOnePromotion(@Param('id') id: string) {
    return this.c.sales().get(`/promotions/${id}`);
  }

  @Post('promotions')
  createPromotion(@Body() body: any) {
    return this.c.sales().post('/promotions', body);
  }

  @Put('promotions/:id')
  updatePromotion(@Param('id') id: string, @Body() body: any) {
    return this.c.sales().put(`/promotions/${id}`, body);
  }

  @Delete('promotions/:id')
  deletePromotion(@Param('id') id: string) {
    return this.c.sales().delete(`/promotions/${id}`);
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

  @Put('orders/:id')
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

  @Put('contracts/:id')
  updateContract(@Param('id') id: string, @Body() body: any) {
    return this.c.sales().put(`/contracts/${id}`, body);
  }

  @Delete('contracts/:id')
  deleteContract(@Param('id') id: string) {
    return this.c.sales().delete(`/contracts/${id}`);
  }
}
