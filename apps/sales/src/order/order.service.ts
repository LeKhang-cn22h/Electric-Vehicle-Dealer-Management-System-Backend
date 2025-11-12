import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { Order } from './entity/order.entity';
import { QuotationService } from '../quotation/quotation.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly quotationService: QuotationService,
  ) {}

  //Tạo đơn hàng từ báo giá
  async createFromQuotation(quotationId: string): Promise<Order> {
    const quotation = await this.quotationService.findOne(quotationId);
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

    const { error } = await this.supabase
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

    if (error) throw new Error(`Supabase insert error: ${error.message}`);

    // Cập nhật trạng thái báo giá
    await this.supabase
      .schema('sales')
      .from('quotations')
      .update({ status: 'converted', updated_at: new Date().toISOString() })
      .eq('id', quotationId);

    return this.mapRowToOrder(newOrder);
  }

  //Lấy tất cả đơn hàng
  async findAll(): Promise<Order[]> {
    const { data, error } = await this.supabase
      .schema('sales')
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Supabase fetch error: ${error.message}`);
    return data?.map((row) => this.mapRowToOrder(row)) || [];
  }

  //Lấy đơn hàng theo ID
  async findOne(id: string): Promise<Order> {
    const { data, error } = await this.supabase
      .schema('sales')
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Order not found');
    return this.mapRowToOrder(data);
  }

  //Cập nhật đơn hàng
  async update(id: string, updateData: Partial<Order>): Promise<Order> {
    const updatedAt = new Date();
    const { data, error } = await this.supabase
      .schema('sales')
      .from('orders')
      .update({ ...updateData, updated_at: updatedAt.toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Supabase update error: ${error.message}`);
    return this.mapRowToOrder(data);
  }

  //Xoá đơn hàng
  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.schema('sales').from('orders').delete().eq('id', id);
    if (error) throw new Error(`Supabase delete error: ${error.message}`);
  }

  //Helper: map dữ liệu
  private mapRowToOrder(row: any): Order {
    return {
      id: row.id,
      quotationId: row.quotation_id,
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
