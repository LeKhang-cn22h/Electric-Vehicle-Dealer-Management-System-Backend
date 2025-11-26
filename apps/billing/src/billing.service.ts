import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    await this.ensureInstallmentSchedule(id);
    return this.getInvoiceWithInstallments(id);
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

  async payInstallment(invoiceId: string, sequence: number) {
    console.log('[DEBUG] invoiceId:', invoiceId);
    console.log('[DEBUG] sequence:', sequence);

    const { data: installment, error: findError } = await this.sb
      .from('ar_installment_schedules')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('installment_no', sequence)
      .maybeSingle();

    console.log('[DEBUG] installment:', installment);
    console.log('[DEBUG] findError:', findError);

    if (findError) {
      throw new BadRequestException('Lỗi khi tìm kỳ trả góp');
    }

    if (!installment) {
      throw new NotFoundException('Không tìm thấy kỳ trả góp');
    }

    if (installment.status === 'paid') {
      return {
        ok: true,
        alreadyPaid: true,
      };
    }

    //  Cập nhật kỳ này thành paid
    const { error: updateError } = await this.sb
      .from('ar_installment_schedules')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', installment.id);

    if (updateError) {
      throw new BadRequestException('Không cập nhật được trạng thái kỳ trả góp');
    }

    // Kiểm tra tất cả các kỳ của invoice này đã paid chưa
    const { data: all, error: allError } = await this.sb
      .from('ar_installment_schedules')
      .select('status')
      .eq('invoice_id', invoiceId);

    if (allError) {
      throw new BadRequestException('Không load được danh sách kỳ trả góp');
    }

    const allPaid = all?.length && all.every((x) => x.status === 'paid');

    if (allPaid) {
      // Nếu tất cả kỳ đã paid → update invoice thành paid
      const { error: invError } = await this.sb
        .from('billing_invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);

      if (invError) {
        throw new BadRequestException('Không cập nhật được trạng thái hóa đơn');
      }
    }

    return {
      ok: true,
      installment_no: sequence,
      invoice_id: invoiceId,
      allPaid: !!allPaid,
    };
  }

  // Tạo lịch trả góp nếu chưa có cho invoice này
  // billing.service.ts

  async ensureInstallmentSchedule(invoiceId: string) {
    // Nếu đã có schedule thì thôi
    const { data: existing, error: existingError } = await this.sb
      .from('ar_installment_schedules')
      .select('id')
      .eq('invoice_id', invoiceId);

    if (existingError) {
      console.error('[ensureInstallmentSchedule] existingError =', existingError);
      throw new BadRequestException('Lỗi khi kiểm tra lịch trả góp');
    }

    if (existing && existing.length > 0) {
      return;
    }

    // 2Lấy invoice để quyết định có phải trả góp không
    const { data: invoice, error: invError } = await this.sb
      .from('billing_invoices')
      .select('id, total_cents, meta, issued_at')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invError) {
      console.error('[ensureInstallmentSchedule] invError =', invError);
      throw new BadRequestException('Lỗi khi lấy thông tin hóa đơn để tạo lịch trả góp');
    }

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    const meta: any = invoice.meta || {};

    const isInstallment = meta.payment_method === 'installment' || meta.is_installment === true;
    if (!isInstallment) {
      return;
    }

    const term = Number(meta.term || meta.installmentTerm || 0);
    if (!term || term <= 0) {
      throw new BadRequestException('Hóa đơn không có kỳ hạn trả góp hợp lệ');
    }

    const totalCents = Number(invoice.total_cents || 0);
    const downPaymentVnd = Number(meta.downPayment || 0);
    const downPaymentCents = Math.round(downPaymentVnd * 100);

    const loanCents = totalCents - downPaymentCents;
    if (loanCents <= 0) {
      throw new BadRequestException('Giá trị vay không hợp lệ');
    }

    const baseAmountCents = Math.floor(loanCents / term);
    const remainder = loanCents - baseAmountCents * term;

    const issueDateStr = invoice.issued_at as string;
    const start = issueDateStr ? new Date(issueDateStr) : new Date();

    const rows: {
      invoice_id: string;
      installment_no: number;
      due_date: string;
      amount_cents: number;
      status: string;
    }[] = [];

    for (let i = 1; i <= term; i++) {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i);

      const amountCents = baseAmountCents + (i === term ? remainder : 0);

      rows.push({
        invoice_id: invoiceId,
        installment_no: i,
        due_date: due.toISOString().substring(0, 10),
        amount_cents: amountCents,
        status: 'pending',
      });
    }

    const { error: insertError } = await this.sb.from('ar_installment_schedules').insert(rows);

    if (insertError) {
      console.error('[ensureInstallmentSchedule] insertError =', insertError);
      throw new BadRequestException('Không tạo được lịch trả góp');
    }
  }

  // khi get invoice, join luôn installments
  async getInvoiceWithInstallments(id: string) {
    const { data, error } = await this.sb
      .from('billing_invoices')
      .select('*, billing_invoice_items(*), ar_installment_schedules(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    return data;
  }
}
