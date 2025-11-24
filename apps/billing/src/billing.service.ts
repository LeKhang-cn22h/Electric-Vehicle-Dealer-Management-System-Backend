import { Injectable, NotFoundException } from '@nestjs/common';
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
    const now = new Date().toISOString();

    // Insert trước 1 invoice rỗng (để thỏa FK)
    const { error: invInsertError } = await this.sb.from('billing_invoices').insert({
      id: invoiceId,
      dealer_id: dto.dealer_id,
      customer_id: dto.customer_id,
      currency: dto.currency,
      subtotal_cents: 0,
      tax_cents: 0,
      total_cents: 0,
      status: dto.issue_now ? 'issued' : 'draft',
      issued_at: dto.issue_now ? now : null,
      meta: dto.meta ?? {},
      created_by: null,
    });

    if (invInsertError) {
      console.error('[Billing] Insert invoice error:', invInsertError);
      throw invInsertError;
    }

    // Tính toán + insert items
    let subtotal = 0;
    let tax = 0;

    try {
      for (const item of dto.items) {
        const lineSubtotal = Math.ceil(item.qty * item.unit_price_cents);
        subtotal += lineSubtotal;

        const { data: taxData, error: taxError } = await this.sb
          .from('billing_taxes')
          .select('id, rate')
          .eq('code', item.tax_rate_code)
          .eq('active', true)
          .maybeSingle();

        if (taxError || !taxData) {
          throw taxError ?? new Error('Tax not found');
        }

        const lineTax = Math.ceil((lineSubtotal * Number(taxData.rate)) / 100);
        tax += lineTax;

        const { error: itemError } = await this.sb.from('billing_invoice_items').insert({
          invoice_id: invoiceId,
          product_code: item.product_code,
          description: item.description,
          qty: item.qty,
          unit_price_cents: item.unit_price_cents,
          tax_id: taxData.id,
          line_tax_cents: lineTax,
        });

        if (itemError) {
          console.error('[Billing] Insert invoice item error:', itemError);
          throw itemError;
        }
      }
    } catch (e) {
      // Nếu lỗi khi tạo item → rollback invoice
      await this.sb.from('billing_invoices').delete().eq('id', invoiceId);
      throw e;
    }

    const total = subtotal + tax;

    // Update lại invoice với subtotal/tax/total chính xác
    const { error: invUpdateError } = await this.sb
      .from('billing_invoices')
      .update({
        subtotal_cents: subtotal,
        tax_cents: tax,
        total_cents: total,
        updated_at: now,
      })
      .eq('id', invoiceId);

    if (invUpdateError) {
      console.error('[Billing] Update invoice totals error:', invUpdateError);
      throw invUpdateError;
    }

    return { message: 'Created', id: invoiceId };
  }
  //Lấy chi tiết 1 hóa đơn
  async get(id: string) {
    const { data, error } = await this.sb
      .from('billing_invoices')
      .select('*, billing_invoice_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error && (error as any).code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      throw new NotFoundException('Invoice not found');
    }

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
