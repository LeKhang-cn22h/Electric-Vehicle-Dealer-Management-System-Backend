import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { CreateBillDto } from './dtos/create-bill.dto';
import { ListBillsDto } from './dtos/list-bills.dto';
import * as crypto from 'crypto';

@Injectable()
export class BillingService {
  private sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    db: { schema: 'platform' },
  });
  //Tạo hóa đơn mới
  async create(dto: CreateBillDto, idempotencyKey?: string) {
    const invoiceId = crypto.randomUUID();
    let subtotal = 0;
    let tax = 0;

    for (const item of dto.items) {
      const lineSubtotal = Math.ceil(item.qty * item.unit_price_cents);
      subtotal += lineSubtotal;

      const { data: taxData, error: taxError } = await this.sb
        .from('billing_taxes')
        .select('id, rate')
        .eq('code', item.tax_rate_code)
        .eq('active', true)
        .maybeSingle();

      if (taxError || !taxData) throw taxError ?? new Error('Tax not found');

      const lineTax = Math.ceil((lineSubtotal * Number(taxData.rate)) / 100);
      tax += lineTax;

      await this.sb.from('billing_invoice_items').insert({
        invoice_id: invoiceId,
        product_code: item.product_code,
        description: item.description,
        qty: item.qty,
        unit_price_cents: item.unit_price_cents,
        tax_id: taxData.id,
        line_tax_cents: lineTax,
      });
    }

    const total = subtotal + tax;

    const { error: invError } = await this.sb.from('billing_invoices').insert({
      id: invoiceId,
      dealer_id: dto.dealer_id,
      customer_id: dto.customer_id,
      currency: dto.currency,
      subtotal_cents: subtotal,
      tax_cents: tax,
      total_cents: total,
      status: dto.issue_now ? 'issued' : 'draft',
      issued_at: dto.issue_now ? new Date().toISOString() : null,
      meta: dto.meta ?? {},
      created_by: null,
    });

    if (invError) throw invError;

    return { message: 'Created', id: invoiceId };
  }

  //Lấy chi tiết 1 hóa đơn
  async get(id: string) {
    const { data, error } = await this.sb
      .from('billing_invoices')
      .select('*, billing_invoice_items(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }
  //Hủy hóa đơn
  async void(id: string) {
    const { error } = await this.sb
      .from('billing_invoices')
      .update({ status: 'void', voided_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { message: 'Invoice voided' };
  }
  //Đánh dấu đã thanh toán
  async markPaid(id: string) {
    const { error } = await this.sb
      .from('billing_invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { message: 'Marked as paid' };
  }
  //Liệt kê hóa đơn
  async list(query: ListBillsDto) {
    const { data, error } = await this.sb
      .from('billing_invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
}
