import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Quotation } from './entity/quotation.entity';
import { v4 as uuid } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class QuotationService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  //Tạo báo giá
  async create(createQuote: CreateQuotationDto): Promise<Quotation> {
    const totalAmount = createQuote.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const newQuotation: Quotation = {
      id: uuid(),
      customerId: createQuote.customerId,
      createdBy: createQuote.createdBy,
      items: createQuote.items,
      totalAmount,
      note: createQuote.note,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { error } = await this.supabase
      .schema('sales')
      .from('quotations')
      .insert([
        {
          id: newQuotation.id,
          customer_id: newQuotation.customerId,
          created_by: newQuotation.createdBy,
          items: newQuotation.items,
          total_amount: newQuotation.totalAmount,
          note: newQuotation.note,
          status: newQuotation.status,
          created_at: newQuotation.createdAt.toISOString(),
          updated_at: newQuotation.updatedAt.toISOString(),
        },
      ]);

    if (error) throw new Error(`Supabase insert error: ${error.message}`);

    return newQuotation;
  }

  //Lấy tất cả báo giá
  async findAll(): Promise<Quotation[]> {
    const { data, error } = await this.supabase
      .schema('sales')
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Supabase fetch error: ${error.message}`);

    return data?.map((row) => this.mapRowToQuotation(row)) || [];
  }

  //Lấy báo giá theo ID
  async findOne(id: string): Promise<Quotation> {
    const { data, error } = await this.supabase
      .schema('sales')
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Quotation not found');
    return this.mapRowToQuotation(data);
  }

  //Cập nhật báo giá
  async update(id: string, updateData: Partial<CreateQuotationDto>): Promise<Quotation> {
    const updatedAt = new Date();

    const { data, error } = await this.supabase
      .schema('sales')
      .from('quotations')
      .update({
        ...updateData,
        updated_at: updatedAt.toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Supabase update error: ${error.message}`);
    return this.mapRowToQuotation(data);
  }

  //Xoá báo giá
  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.schema('sales').from('quotations').delete().eq('id', id);
    if (error) throw new Error(`Supabase delete error: ${error.message}`);
  }

  //Hàm helper: map dữ liệu từ DB về entity
  private mapRowToQuotation(row: any): Quotation {
    return {
      id: row.id,
      customerId: row.customer_id,
      createdBy: row.created_by,
      items: row.items,
      totalAmount: row.total_amount,
      note: row.note,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
