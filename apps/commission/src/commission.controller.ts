import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { CommissionService } from './commission.service';

@Controller('commission')
export class CommissionController {
  constructor(private readonly svc: CommissionService) {}

  @Post('plans')
  createPlan(@Body() b: { dealer_id: string; name: string }) {
    return this.svc.createPlan(b.dealer_id, b.name);
  }

  @Get('plans')
  listPlans(@Query('dealer_id') dealer_id?: string) {
    return this.svc.listPlans(dealer_id);
  }

  @Post('plans/:plan_id/rules')
  addRule(@Param('plan_id') plan_id: string, @Body() b: any) {
    return this.svc.addRule(plan_id, b);
  }

  @Get('plans/:plan_id/rules')
  listRules(@Param('plan_id') plan_id: string) {
    return this.svc.listRules(plan_id);
  }

  @Post('run')
  run(@Body() b: { invoice_id: string }) {
    return this.svc.runCommission(b.invoice_id);
  }

  @Post('payout')
  payout(@Body() b: { dealer_id: string; period: string }) {
    return this.svc.payout(b.dealer_id, b.period);
  }
}
