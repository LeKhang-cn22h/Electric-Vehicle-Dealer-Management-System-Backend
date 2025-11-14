import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), 'apps/commission/.env');
dotenv.config({ path: envPath });

@Injectable()
export class CommissionService {
  private db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    db: { schema: 'platform' },
  });

  async createPlan(dealer_id: string, name: string) {
    const { data, error } = await this.db
      .from('commission_plans')
      .insert({ dealer_id, name })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async listPlans(dealer_id?: string) {
    let q = this.db.from('commission_plans').select('*').order('created_at');
    if (dealer_id) q = q.eq('dealer_id', dealer_id);
    return q;
  }

  async addRule(
    plan_id: string,
    body: {
      rule_type: string;
      product_code?: string;
      percent?: number;
      fixed_cents?: number;
    },
  ) {
    const { data, error } = await this.db
      .from('commission_rules')
      .insert({ plan_id, ...body })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async listRules(plan_id: string) {
    return this.db.from('commission_rules').select('*').eq('plan_id', plan_id);
  }

  async runCommission(invoice_id: string) {
    const inv = await this.db
      .from('billing_invoices')
      .select('id, dealer_id, total_cents')
      .eq('id', invoice_id)
      .single();

    if (inv.error) throw inv.error;
    if (!inv.data.dealer_id) throw new Error('Invoice has no dealer_id');

    const plan = await this.db
      .from('commission_plans')
      .select('id')
      .eq('dealer_id', inv.data.dealer_id)
      .eq('active', true)
      .single();

    if (plan.error) throw plan.error;

    const rules = await this.db
      .from('commission_rules')
      .select('*')
      .eq('plan_id', plan.data.id)
      .eq('active', true);

    if (rules.error) throw rules.error;

    let commission = 0;

    for (const r of rules.data) {
      if (r.rule_type === 'percent_total') {
        commission += Math.floor(inv.data.total_cents * (Number(r.percent) / 100));
      }
    }

    const period = new Date().toISOString().slice(0, 7);

    const ins = await this.db
      .from('commission_transactions')
      .insert({
        dealer_id: inv.data.dealer_id,
        invoice_id: invoice_id,
        amount_cents: commission,
        period,
        meta: {},
      })
      .select('*')
      .single();

    if (ins.error) throw ins.error;
    return ins.data;
  }

  async payout(dealer_id: string, period: string) {
    const sum = await this.db
      .from('commission_transactions')
      .select('amount_cents')
      .eq('dealer_id', dealer_id)
      .eq('period', period);

    const total = sum.data?.reduce((a, b) => a + b.amount_cents, 0) ?? 0;

    const payout = await this.db
      .from('commission_payouts')
      .insert({
        dealer_id,
        period,
        total_cents: total,
        status: 'pending',
        meta: {},
      })
      .select('*')
      .single();

    if (payout.error) throw payout.error;
    return payout.data;
  }
}
