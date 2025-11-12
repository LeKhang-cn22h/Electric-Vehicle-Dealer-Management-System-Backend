import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Quotation } from './entity/quotation.entity';
import { v4 as uuid } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateOrderDto } from '../order/dto/create-order.dto';

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

    const quotationId = uuid();
    const now = new Date();

    //Tạo bản ghi báo giá chính
    const { error: quotationError } = await this.supabase
      .schema('sales')
      .from('quotations')
      .insert([
        {
          id: quotationId,
          customer_id: createQuote.customerId,
          created_by: createQuote.createdBy,
          total_amount: totalAmount,
          note: createQuote.note,
          status: 'draft',
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      ]);

    if (quotationError)
      throw new Error(`Supabase insert quotation error: ${quotationError.message}`);

    //Thêm chi tiết sản phẩm
    const itemsData = createQuote.items.map((item) => ({
      id: uuid(),
      quotation_id: quotationId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      created_at: now.toISOString(),
    }));

    const { error: itemsError } = await this.supabase
      .schema('sales')
      .from('quotation_items')
      .insert(itemsData);

    if (itemsError) throw new Error(`Supabase insert items error: ${itemsError.message}`);

    //Trả về object tổng hợp
    return {
      id: quotationId,
      customerId: createQuote.customerId,
      createdBy: createQuote.createdBy,
      items: createQuote.items,
      totalAmount,
      note: createQuote.note,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
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

  async convertToOrder(quotationId: string): Promise<CreateOrderDto> {
    const quotation = await this.findOne(quotationId);
    if (!quotation) throw new NotFoundException('Quotation not found');

    const newOrder: CreateOrderDto = {
      quotationId: quotation.id,
      customerId: quotation.customerId,
      createdBy: quotation.createdBy,
      items: quotation.items,
      totalAmount: quotation.totalAmount,
      note: quotation.note,
      status: 'pending',
    };

    const { error: insertError } = await this.supabase
      .schema('sales')
      .from('orders')
      .insert([
        {
          id: uuid(),
          quotation_id: newOrder.quotationId,
          customer_id: newOrder.customerId,
          created_by: newOrder.createdBy,
          items: newOrder.items,
          total_amount: newOrder.totalAmount,
          note: newOrder.note,
          status: newOrder.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (insertError) throw new Error(`Failed to create order: ${insertError.message}`);

    await this.supabase
      .schema('sales')
      .from('quotations')
      .update({ status: 'converted', updated_at: new Date().toISOString() })
      .eq('id', quotationId);

    return newOrder;
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
