import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { Order } from './entity/order.entity';
import { QuotationService } from '../quotation/quotation.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Quotation } from '../quotation/entity/quotation.entity';
import { PricingPromotionService } from '../pricing-promotion/pricing-promotion.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class OrderService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly pricingPromotionService: PricingPromotionService,
    private readonly amqpConnection: AmqpConnection,
  ) {}
  async getVehicleId(id: number) {
    const response = await this.amqpConnection.request<{ vehicle: any }>({
      exchange: 'order_vehicle',
      routingKey: 'order.vehicle',
      payload: { id },
      timeout: 160000,
    });
    return response;
  }

  //Tạo đơn hàng từ báo giá
  async createFromQuotation(dto: CreateOrderDto): Promise<any> {
    try {
      // code tạo order

      // Nếu có quotation → override dữ liệu, nếu không → dùng dữ liệu từ dto
      const newOrder = {
        quotationId: dto.quotationId,
        createdBy: dto.createdBy,
        totalAmount: dto.paymentAmount,
        status: 'pending',

        // Payment
        paymentMethod: dto.paymentMethod,
        paymentStatus: dto.paymentStatus,
        paymentAmount: dto.paymentAmount,

        bank: dto.bank,
        term: dto.term,
        downPayment: dto.downPayment,
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
            created_by: newOrder.createdBy,
            total_amount: newOrder.totalAmount,
            status: newOrder.status,

            payment_method: newOrder.paymentMethod,
            payment_status: newOrder.paymentStatus,
            payment_amount: newOrder.paymentAmount,

            bank: newOrder.bank,
            term: newOrder.term,
            down_payment: newOrder.downPayment,

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
    } catch (e) {
      console.error('Create Order Error:', e);
      throw e;
    }
  }

  //Lấy tất cả đơn hàng
  async findAll(filters: any = {}): Promise<any> {
    try {
      // 1. Lấy danh sách orders
      const query = this.supabase
        .schema('sales')
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.role !== 'dealer_manager') {
        query.eq('created_by', filters.id);
      }

      const { data: orders, error: orderError } = await query;
      if (orderError) throw new Error(orderError.message);

      if (!orders.length) return [];

      // 2. Lấy danh sách tất cả quotation_id
      const quotationIds = orders.map((o) => o.quotation_id).filter(Boolean);

      // 3. Lấy tất cả quotations theo ID
      const { data: quotations, error: qError } = await this.supabase
        .schema('sales')
        .from('quotations')
        .select('*')
        .in('id', quotationIds);

      if (qError) throw new Error(qError.message);

      // 4. Map quotations theo ID cho nhanh
      const quotationMap = Object.fromEntries(quotations.map((q) => [q.id, q]));

      // 5. Lấy items của tất cả quotation
      const { data: items, error: itemsError } = await this.supabase
        .schema('sales')
        .from('quotation_items')
        .select('*')
        .in('quotation_id', quotationIds);

      if (itemsError) throw new Error(itemsError.message);

      // Gom items theo quotation
      const itemsByQuotation = items.reduce(
        (acc, item) => {
          if (!acc[item.quotation_id]) acc[item.quotation_id] = [];
          acc[item.quotation_id].push(item);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      // 6. Lấy thông tin customer
      const customerIds = quotations.map((q) => q.customer_id);
      const { data: customers } = await this.supabase
        .schema('customer')
        .from('customers')
        .select('*')
        .in('id', customerIds);

      const customerMap = Object.fromEntries(customers!.map((c) => [c.id, c]));

      // 7. Trả về: order + full quotation detail
      return orders.map((order) => {
        const quote = quotationMap[order.quotation_id];

        return {
          ...order,
          quotation: quote
            ? {
                ...quote,
                items: itemsByQuotation[quote.id] || [],
                customer: customerMap[quote.customer_id] || null,
              }
            : null,
        };
      });
    } catch (err: any) {
      console.error('Error in findAllOrders:', err);
      if (err?.message) console.error('Message:', err.message);
      if (err?.code) console.error('Code:', err.code);
      if (err?.details) console.error('Details:', err.details);
      throw err; // Hoặc throw new Error(err.message || 'Unknown error')
    }
  }

  //Lấy đơn hàng theo ID
  async findOne(id: string): Promise<any> {
    try {
      // 1. Lấy order
      const { data: order, error: orderError } = await this.supabase
        .schema('sales')
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError || !order) throw new NotFoundException('Order not found');

      // 2. Lấy quotation liên quan
      const { data: quotation, error: qError } = await this.supabase
        .schema('sales')
        .from('quotations')
        .select('*')
        .eq('id', order.quotation_id)
        .single();

      if (qError) throw new Error(qError.message);

      // 3. Lấy items của quotation
      const { data: items, error: itemsError } = await this.supabase
        .schema('sales')
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', order.quotation_id);

      if (itemsError) throw new Error(itemsError.message);

      // 4. Lấy thông tin customer
      const { data: customer, error: cError } = await this.supabase
        .schema('customer')
        .from('customers')
        .select('*')
        .eq('id', quotation.customer_id)
        .single();

      if (cError) throw new Error(cError.message);
      const vehicle = await Promise.all(
        items.map(async (item) => await this.getVehicleId(item.product_id)),
      );
      const promotions = await Promise.all(
        quotation.promotion_code.map(
          async (promo_id) => await this.pricingPromotionService.findOnePromotion(promo_id),
        ),
      );
      // 5. Trả về
      return {
        ...order,
        quotation: quotation,
        promotions: promotions,
        items: items || [],
        vehicles: vehicle || [],
        customer: customer || null,
      };
    } catch (err: any) {
      console.error('Error in findOneOrder:', err);
      throw err;
    }
  }

  //Cập nhật đơn hàng
  async update(id: string, updateData: Partial<Order>): Promise<any> {
    try {
      const updatedAt = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
      );

      let payload: any = {};
      if (updateData.status !== undefined) payload.status = updateData.status;
      if (updateData.paymentMethod !== undefined) payload.payment_method = updateData.paymentMethod;
      if (updateData.paymentStatus !== undefined) payload.payment_status = updateData.paymentStatus;
      if (updateData.downPayment !== undefined) payload.down_payment = updateData.downPayment;

      const { data, error } = await this.supabase
        .schema('sales')
        .from('orders')
        .update({ ...payload, updated_at: updatedAt.toISOString() })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(`Supabase update error: ${error.message}`);
      return this.mapRowToOrder(data);
    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm trong báo giá:', error);
      console.error('Error response:', error.response?.data); // Thêm dòng này
    }
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
      createdBy: row.created_by,

      totalAmount: row.total_amount,

      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      paymentAmount: row.payment_amount,

      bank: row.bank,
      term: row.term,
      downPayment: row.down_payment,

      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
