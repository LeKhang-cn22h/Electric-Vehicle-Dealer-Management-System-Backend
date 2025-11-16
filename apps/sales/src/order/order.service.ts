import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { Order } from './entity/order.entity';
import { QuotationService } from '../quotation/quotation.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Quotation } from '../quotation/entity/quotation.entity';

@Injectable()
export class OrderService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly quotationService: QuotationService,
  ) {}

  //Tạo đơn hàng từ báo giá
  async createFromQuotation(dto: CreateOrderDto): Promise<Order> {
    // Nếu người dùng gửi quotationId → lấy thông tin báo giá
    let quotation;
    if (dto.quotationId) {
      quotation = await this.quotationService.findOne(dto.quotationId);
      if (!quotation) throw new NotFoundException('Quotation not found');
    }

    // Nếu có quotation → override dữ liệu, nếu không → dùng dữ liệu từ dto
    const newOrder = {
      quotationId: quotation ? quotation.id : dto.quotationId,
      customerId: quotation ? quotation.customerId : dto.customerId,
      createdBy: quotation ? quotation.createdBy : dto.createdBy,
      items: quotation ? quotation.items : dto.items,
      totalAmount: quotation ? quotation.totalAmount : dto.totalAmount,
      promotionCode: quotation.promotionCode,
      discountAmount: quotation.discountAmount,
      note: dto.note || (quotation ? quotation.note : null),
      status: 'pending',

      // Payment
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentStatus,
      paymentAmount: dto.paymentAmount,
    };

    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    // Insert vào Supabase
    const { data: insertedOrder, error } = await this.supabase
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
          promotion_code: newOrder.promotionCode,
          discount_amount: newOrder.discountAmount,
          note: newOrder.note,
          status: newOrder.status,

          payment_method: newOrder.paymentMethod,
          payment_status: newOrder.paymentStatus,
          payment_amount: newOrder.paymentAmount,

          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      ])
      .select('*')
      .single();

    if (error) throw new Error(`Supabase insert error: ${error.message}`);

    // Nếu tạo từ báo giá → cập nhật trạng thái báo giá
    if (dto.quotationId) {
      await this.supabase
        .schema('sales')
        .from('quotations')
        .update({
          status: 'converted',
          updated_at: now.toISOString(),
        })
        .eq('id', dto.quotationId);
    }

    return this.mapRowToOrder(insertedOrder);
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
    const updatedAt = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );
    const { data, error } = await this.supabase
      .schema('sales')
      .from('orders')
      .update({
        quotation_id: updateData.quotationId,
        customer_id: updateData.customerId,
        created_by: updateData.createdBy,
        items: updateData.items,
        total_amount: updateData.totalAmount,
        promotion_code: updateData.promotionCode,
        discount_amount: updateData.discountAmount,
        note: updateData.note,
        status: updateData.status,

        payment_method: updateData.paymentMethod,
        payment_status: updateData.paymentStatus,
        payment_amount: updateData.paymentAmount,

        updated_at: updatedAt.toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Supabase update error: ${error.message}`);
    return this.mapRowToOrder(data);
  }

  //Xoá đơn hàng
  async remove(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .schema('sales')
      .from('orders')
      .delete()
      .eq('id', id)
      .select('*'); // trả về bản ghi đã xóa

    if (error) throw new Error(`Supabase delete error: ${error.message}`);
    if (!data || data.length === 0) {
      throw new NotFoundException(`Không tìm thấy đơn hàng có id = ${id}`);
    }

    return { message: `Xóa thành công đơn hàng ${id}` };
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
      promotionCode: row.promotion_code,
      discountAmount: row.discount_amount,
      note: row.note,

      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus,
      paymentAmount: row.paymentAmount,

      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
