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
    if (inv.data.status === '') throw new Error('Invoice is void');
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
    console.log('[VNPay Return] Raw query:', JSON.stringify(query));

    const secret = process.env.VNP_HASHSECRET ?? '';
    console.log('[VNPay Return] Hash secret exists:', !!secret);

    let ok = false;
    try {
      ok = verifyVnpReturn(query, secret);
    } catch (err: any) {
      console.error('[VNPay Return] verifyVnpReturn error:', err);
      return {
        success: false,
        code: 'VERIFY_ERROR',
        message: 'Lỗi khi kiểm tra chữ ký VNPay',
      };
    }

    const code = query['vnp_ResponseCode'];
    const txnRef = query['vnp_TxnRef'];
    const txnNo = query['vnp_TransactionNo'];
    const rawAmount = Number(query['vnp_Amount'] || 0);
    const amountVnd = rawAmount / 100;
    const inv_id = (txnRef || '').toString().split('INV_')[1]?.split('_')[0];

    if (!ok) {
      return {
        success: false,
        code: 'INVALID_SIGNATURE',
        message: 'Chữ ký VNPay không hợp lệ',
      };
    }

    if (!inv_id) {
      return {
        success: false,
        code: 'INVALID_INVOICE_ID',
        message: 'Không tìm thấy mã hóa đơn trong tham số VNPay',
      };
    }
    if (code !== '00') {
      try {
        await this.db.from('ar_payments').insert({
          intent_id: null,
          invoice_id: inv_id,
          provider: 'vnpay',
          provider_txn: String(txnNo),
          amount_cents: Math.round(amountVnd * 100),
          status: 'failed',
          meta: query,
        });

        const intent = await this.db
          .from('ar_payment_intents')
          .select('id')
          .eq('provider_ref', txnRef)
          .maybeSingle();

        if (intent.data?.id) {
          await this.db
            .from('ar_payment_intents')
            .update({ status: 'failed' })
            .eq('id', intent.data.id);
        }
      } catch (err) {
        console.error('[VNPay Return] Error recording failed payment:', err);
      }

      return {
        success: false,
        code,
        invoice_id: inv_id,
        provider_txn: txnNo,
        message: this.getVnpayErrorMessage(code),
      };
    }

    try {
      const existingPayment = await this.db
        .from('ar_payments')
        .select('id')
        .eq('provider', 'vnpay')
        .eq('provider_txn', String(txnNo))
        .maybeSingle();

      if (existingPayment.data) {
        return {
          success: true,
          code,
          invoice_id: inv_id,
          provider_txn: txnNo,
          message: 'Giao dịch đã được xử lý trước đó',
          already_processed: true,
        };
      }

      // Lấy intent nếu có
      const intent = await this.db
        .from('ar_payment_intents')
        .select('id')
        .eq('provider_ref', txnRef)
        .maybeSingle();

      // Insert payment
      const paymentInsert = await this.db
        .from('ar_payments')
        .insert({
          intent_id: intent.data?.id ?? null,
          invoice_id: inv_id,
          provider: 'vnpay',
          provider_txn: String(txnNo),
          amount_cents: Math.round(amountVnd * 100),
          status: 'succeeded',
          meta: query,
        })
        .select('id')
        .single();

      if (paymentInsert.error) {
        console.error('[VNPay Return] Payment insert error:', paymentInsert.error);
        return {
          success: false,
          code: 'DB_INSERT_ERROR',
          message: 'Lỗi khi lưu thông tin thanh toán',
          error: paymentInsert.error.message,
        };
      }

      // Update invoice paid
      const invoiceUpdate = await this.db
        .from('billing_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', inv_id);

      if (invoiceUpdate.error) {
        console.error('[VNPay Return] Invoice update error:', invoiceUpdate.error);
        return {
          success: false,
          code: 'INVOICE_UPDATE_ERROR',
          message: 'Lỗi khi cập nhật trạng thái hóa đơn',
          error: invoiceUpdate.error.message,
        };
      }

      // Update intent nếu có
      if (intent.data?.id) {
        await this.db
          .from('ar_payment_intents')
          .update({ status: 'succeeded' })
          .eq('id', intent.data.id);
      }

      return {
        success: true,
        code,
        invoice_id: inv_id,
        provider_txn: txnNo,
        payment_id: paymentInsert.data.id,
        message: 'Thanh toán thành công',
      };
    } catch (err: any) {
      console.error('[VNPay Return] Fatal error while processing payment:', err);
      return {
        success: false,
        code: 'UNEXPECTED_ERROR',
        message: 'Có lỗi không mong muốn khi xử lý thanh toán',
        error: err?.message,
      };
    }
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
      // Get intent_id if exists
      const intent = await this.db
        .from('ar_payment_intents')
        .select('id')
        .eq('provider_ref', txnRef)
        .maybeSingle();

      // insert payment
      const ins = await this.db
        .from('ar_payments')
        .insert({
          intent_id: intent.data?.id || null,
          invoice_id: inv_id,
          provider: 'vnpay',
          provider_txn: String(txnNo),
          amount_cents: Math.round(amount * 100), // Convert to cents
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

      // Update intent status
      if (intent.data?.id) {
        await this.db
          .from('ar_payment_intents')
          .update({ status: 'succeeded' })
          .eq('id', intent.data.id);
      }

      return { RspCode: '00', Message: 'OK' };
    } else {
      // thanh toán thất bại
      await this.db.from('ar_payments').insert({
        intent_id: null,
        invoice_id: inv_id,
        provider: 'vnpay',
        provider_txn: String(txnNo),
        amount_cents: Math.round(amount * 100),
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
    const vnpQueryUrl = process.env.VNP_API_URL!;

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

  // Helper method to get Vietnamese error messages
  private getVnpayErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán',
      '12': 'Thẻ/Tài khoản bị khóa',
      '13': 'Sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Giao dịch bị hủy',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Tài khoản vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Lỗi không xác định',
    };
    return messages[code] || `Thanh toán thất bại (mã lỗi: ${code})`;
  }
}
