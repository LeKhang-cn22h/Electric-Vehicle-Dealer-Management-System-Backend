import { Injectable } from '@nestjs/common';
import axios from 'axios';

import {
  yymmddVN,
  zpMacCreate,
  zpMacQuery,
  zpMacRefund,
  zpVerifyCallback,
  nowMs,
} from './zalopay.util';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class ArService {
  private db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    db: { schema: 'platform' },
  });
  async zpCreateOrder(inv_id: string, app_user = 'ev-dealer', userIP = '127.0.0.1') {
    const inv = await this.db
      .from('billing_invoices')
      .select('id,total_cents,currency,status')
      .eq('id', inv_id)
      .single();

    if (inv.error) throw inv.error;
    if (inv.data.status === 'void') throw new Error('Invoice is void');
    if (inv.data.status === 'paid') return { alreadyPaid: true };

    const app_id = Number(process.env.ZP_APP_ID!);
    const key1 = process.env.ZP_KEY1!;
    const createUrl = process.env.ZP_CREATE_ENDPOINT!;
    const callback_url = process.env.ZP_CALLBACK_URL!;
    const app_time = nowMs();
    const app_trans_id = `${yymmddVN()}_${inv_id}`;
    const amount = Number(inv.data.total_cents);
    const embed_data = JSON.stringify({ redirecturl: process.env.ZP_REDIRECT_AFTER || '' });
    const item = JSON.stringify([{ inv_id }]);

    // lưu intent pending
    const intent = await this.db
      .from('ar_payment_intents')
      .insert({
        invoice_id: inv_id,
        provider: 'zalopay',
        amount_cents: amount,
        currency: inv.data.currency,
        status: 'pending',
        provider_ref: app_trans_id,
        meta: { callback_url },
      })
      .select('id')
      .single();
    if (intent.error) throw intent.error;

    const mac = zpMacCreate(key1, {
      app_id,
      app_trans_id,
      app_user,
      amount,
      app_time,
      embed_data,
      item,
    });

    const payload = {
      app_id,
      app_user,
      app_time,
      amount,
      app_trans_id,
      embed_data,
      item,
      description: `EV Dealer - Thanh toán hóa đơn #${inv_id}`,
      bank_code: 'zalopayapp',
      mac,
    };
    console.log('=== PAYLOAD GỬI ĐI ===');
    console.log(JSON.stringify(payload, null, 2));

    console.log({
      app_id,
      key1,
      createUrl,
      app_time,
      app_trans_id,
      amount,
      embed_data,
      item,
      mac,
      userIP,
    });

    const { data } = await axios.post(createUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (data?.return_code !== 1) {
      console.error('ZaloPay ERROR:', data);
      return { ok: false, app_trans_id, intent_id: intent.data.id, zalopay: data };
    }
    console.log('ZaloPay SUCCESS:', { payload, createUrl, data });
    return { ok: true, app_trans_id, intent_id: intent.data.id, zalopay: data };
  }

  async zpHandleCallback(body: any) {
    const key2 = process.env.ZP_KEY2!;
    const dataStr: string = body?.data ?? '';
    const reqMac: string = body?.mac ?? '';

    if (!dataStr || !reqMac) return { return_code: -1, return_message: 'invalid payload' };
    if (!zpVerifyCallback(dataStr, reqMac, key2)) {
      return { return_code: -1, return_message: 'mac not equal' };
    }

    const data = JSON.parse(dataStr);
    const app_trans_id: string = data.app_trans_id;
    const zp_trans_id = String(data.zp_trans_id);
    const amount = Number(data.amount || 0);
    const inv_id = app_trans_id?.split('_')[1];
    if (!inv_id) return { return_code: -3, return_message: 'invalid app_trans_id' };

    // idempotent theo (provider, provider_txn)
    const exists = await this.db
      .from('ar_payments')
      .select('id')
      .eq('provider', 'zalopay')
      .eq('provider_txn', zp_trans_id)
      .maybeSingle();
    if (exists.data) return { return_code: 2, return_message: 'duplicate' };

    // Ghi payment
    const ins = await this.db
      .from('ar_payments')
      .insert({
        intent_id: null,
        invoice_id: inv_id,
        provider: 'zalopay',
        provider_txn: zp_trans_id,
        amount_cents: amount,
        status: 'succeeded',
        meta: data,
      })
      .select('id')
      .single();
    if (ins.error) return { return_code: 0, return_message: 'db error (insert payment)' };

    // Mark paid invoice
    const upd = await this.db
      .from('billing_invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', inv_id);
    if (upd.error) return { return_code: 0, return_message: 'db error (update invoice)' };

    return { return_code: 1, return_message: 'success' };
  }

  async zpQuery(app_trans_id: string) {
    const app_id = Number(process.env.ZP_APP_ID!);
    const key1 = process.env.ZP_KEY1!;
    const url = process.env.ZP_QUERY_ENDPOINT!;
    const mac = zpMacQuery(key1, app_id, app_trans_id);

    const { data } = await axios.post(
      url,
      { app_id, app_trans_id, mac },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data;
  }

  async zpRefund(zp_trans_id: string, amount: number, description: string, m_refund_id?: string) {
    const app_id = Number(process.env.ZP_APP_ID!);
    const key1 = process.env.ZP_KEY1!;
    const url = process.env.ZP_REFUND_ENDPOINT!;
    const timestamp = nowMs();
    const mrid = m_refund_id ?? `${yymmddVN()}_${app_id}_${timestamp}`;

    const mac = zpMacRefund(key1, { app_id, zp_trans_id, amount, description, timestamp });

    const payload = {
      app_id,
      m_refund_id: mrid,
      zp_trans_id,
      amount,
      timestamp,
      description,
      mac,
    };

    const { data } = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return { request: payload, response: data };
  }
}
