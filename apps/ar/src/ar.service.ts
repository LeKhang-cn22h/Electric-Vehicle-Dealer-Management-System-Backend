import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { buildVnpCreateParams, makeVnpUrl, verifyVnpReturn } from './vnpay.util';
import * as crypto from 'crypto';

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    db: { schema: 'platform' },
  });
}

@Injectable()
export class ArService {
  private db = sb();
  //Tạo giao dịch VNPay + trả URL thanh toán
  async createVnpayPayment(inv_id: string, req: any, locale?: 'vn' | 'en', bankCode?: string) {
    const inv = await this.db
      .from('billing_invoices')
      .select('id,total_cents,currency,status')
      .eq('id', inv_id)
      .single();

    if (inv.error) throw inv.error;
    if (inv.data.status === 'void') throw new Error('Invoice is void');
    if (inv.data.status === 'paid') return { alreadyPaid: true };

    const tmnCode = process.env.VNP_TMNCODE!;
    const secret = process.env.VNP_HASHSECRET!;
    const vnpUrl = process.env.VNP_URL!;
    const returnUrl = process.env.VNP_RETURN_URL!;

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    const amountVnd = Math.round(inv.data.total_cents / 100);

    const orderId = `INV_${inv_id}_${Date.now()}`;

    const intent = await this.db
      .from('ar_payment_intents')
      .insert({
        invoice_id: inv_id,
        provider: 'vnpay',
        amount_cents: inv.data.total_cents,
        currency: inv.data.currency,
        status: 'pending',
        provider_ref: orderId,
        meta: {},
      })
      .select('id')
      .single();
    if (intent.error) throw intent.error;

    const params = buildVnpCreateParams({
      tmnCode,
      amountVnd,
      orderId,
      orderInfo: `Payment for invoice ${inv_id}`,
      returnUrl,
      clientIp: ip,
      locale,
      bankCode,
    });

    const payUrl = makeVnpUrl(vnpUrl, params, secret);
    return { payUrl, intent_id: intent.data.id, txnRef: orderId };
  }

  // VNPay Return (browser)
  async handleVnpReturn(query: Record<string, any>) {
    const secret = process.env.VNP_HASHSECRET!;
    const ok = verifyVnpReturn(query, secret);
    const code = query['vnp_ResponseCode'];
    const txnRef = query['vnp_TxnRef'];
    const txnNo = query['vnp_TransactionNo'];
    const inv_id = (txnRef || '').toString().split('INV_')[1]?.split('_')[0];

    if (!ok) return { success: false, message: 'Invalid signature' };
    return {
      success: code === '00',
      code,
      invoice_id: inv_id,
      provider_txn: txnNo,
    };
  }

  //  VNPay IPN (server)
  async handleVnpIpn(payload: Record<string, any>) {
    const secret = process.env.VNP_HASHSECRET!;
    const ok = verifyVnpReturn(payload, secret);
    if (!ok) return { RspCode: '97', Message: 'Invalid signature' };

    const code = payload['vnp_ResponseCode'];
    const txnRef = payload['vnp_TxnRef'];
    const txnNo = payload['vnp_TransactionNo'];
    const amount = Number(payload['vnp_Amount'] || 0) / 100; // chuyển về VND
    const inv_id = (txnRef || '').toString().split('INV_')[1]?.split('_')[0];

    if (!inv_id) return { RspCode: '99', Message: 'Invalid invoice' };

    // idempotent: nếu payment đã tồn tại -> OK
    const exists = await this.db
      .from('ar_payments')
      .select('id')
      .eq('provider', 'vnpay')
      .eq('provider_txn', txnNo)
      .maybeSingle();
    if (exists.data) return { RspCode: '00', Message: 'OK' };

    if (code === '00') {
      // insert payment
      const ins = await this.db
        .from('ar_payments')
        .insert({
          intent_id: null,
          invoice_id: inv_id,
          provider: 'vnpay',
          provider_txn: String(txnNo),
          amount_cents: Math.round(amount),
          status: 'succeeded',
          meta: payload,
        })
        .select('id')
        .single();
      if (ins.error) return { RspCode: '99', Message: 'DB error' };

      // mark invoice paid
      const upd = await this.db
        .from('billing_invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', inv_id);
      if (upd.error) return { RspCode: '99', Message: 'DB error' };

      return { RspCode: '00', Message: 'OK' };
    } else {
      // thanh toán thất bại
      await this.db.from('ar_payments').insert({
        intent_id: null,
        invoice_id: inv_id,
        provider: 'vnpay',
        provider_txn: String(txnNo),
        amount_cents: Math.round(amount),
        status: 'failed',
        meta: payload,
      });
      return { RspCode: '00', Message: 'OK' };
    }
  }

  //Gửi request query trạng thái giao dịch lên VNPay
  async queryPayment(txnRef: string) {
    const secret = process.env.VNP_HASHSECRET!;
    const tmnCode = process.env.VNP_TMNCODE!;
    const vnpQueryUrl = process.env.VNP_QUERY_URL!;

    const params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: tmnCode,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: 'Query Transaction',
      vnp_TransactionDate: '',
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: new Date()
        .toISOString()
        .replace(/[-:TZ]/g, '')
        .slice(0, 14),
    };

    const signData = Object.keys(params)
      .sort()
      .map((k) => k + '=' + params[k])
      .join('&');

    params['vnp_SecureHash'] = crypto.createHmac('sha512', secret).update(signData).digest('hex');

    const queryUrl = `${vnpQueryUrl}?${signData}&vnp_SecureHash=${params['vnp_SecureHash']}`;

    const res = await fetch(queryUrl);
    return res.json();
  }

  async refundPayment(txnRef: string, amount: number, description: string) {
    return { message: 'VNPay refund chưa hỗ trợ ở môi trường Sandbox' };
  }

  async queryRefund(m_refund_id: string, timestamp: string) {
    return { message: 'VNPay QueryRefund chưa hỗ trợ Sandbox' };
  }
}
