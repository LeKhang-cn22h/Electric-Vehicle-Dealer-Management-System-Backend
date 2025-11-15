import { Controller, Post, Get, Body, Query, Req, Param } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('commission')
export class CommissionGatewayController {
  constructor(private readonly c: ServiceClients) {}

  @Post('plans')
  async createPlan(@Body() body: { dealer_id: string; name: string }, @Req() req) {
    return this.c.commission().post('/commission/plans', body, {
      'x-forwarded-for': req.ip,
    });
  }

  @Get('plans')
  async listPlans(@Query('dealer_id') dealer_id: string, @Req() req) {
    const query = dealer_id ? `?dealer_id=${dealer_id}` : '';
    return this.c.commission().get(`/commission/plans${query}`, {
      'x-forwarded-for': req.ip,
    });
  }

  @Post('plans/:plan_id/rules')
  async addRule(
    @Param('plan_id') plan_id: string,
    @Body() body: { rule_type: string; percent?: number; fixed_cents?: number },
    @Req() req,
  ) {
    return this.c.commission().post(`/commission/plans/${plan_id}/rules`, body, {
      'x-forwarded-for': req.ip,
    });
  }

  @Get('plans/:plan_id/rules')
  async listRules(@Param('plan_id') plan_id: string, @Req() req) {
    return this.c.commission().get(`/commission/plans/${plan_id}/rules`, {
      'x-forwarded-for': req.ip,
    });
  }

  @Post('run')
  async runCommission(@Body() body: { invoice_id: string }, @Req() req) {
    return this.c.commission().post('/commission/run', body, {
      'x-forwarded-for': req.ip,
    });
  }

  @Post('payout')
  async payout(@Body() body: { dealer_id: string; period: string }, @Req() req) {
    return this.c.commission().post('/commission/payout', body, {
      'x-forwarded-for': req.ip,
    });
  }
}
