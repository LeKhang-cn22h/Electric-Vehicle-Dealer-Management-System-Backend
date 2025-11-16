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
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

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
    //Lấy tất cả báo giá
    const { data: quotations, error: quoteError } = await this.supabase
      .schema('sales')
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (quoteError) throw new Error(`Supabase fetch error: ${quoteError.message}`);

    if (!quotations?.length) return [];

    //Lấy tất cả items (chỉ những items thuộc các quotation hiện có)
    const quotationIds = quotations.map((q) => q.id);
    const { data: items, error: itemsError } = await this.supabase
      .schema('sales')
      .from('quotation_items')
      .select('*')
      .in('quotation_id', quotationIds);

    if (itemsError) throw new Error(`Failed to fetch quotation items: ${itemsError.message}`);

    //Gom nhóm items theo quotation_id
    const itemsByQuotation = items.reduce(
      (acc, item) => {
        if (!acc[item.quotation_id]) acc[item.quotation_id] = [];
        acc[item.quotation_id].push(item);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    //Trả về danh sách Quotation (gộp items tương ứng)
    return quotations.map((row) =>
      this.mapRowToQuotation({
        ...row,
        items: itemsByQuotation[row.id] || [],
      }),
    );
  }

  //Lấy báo giá theo ID
  async findOne(id: string): Promise<Quotation> {
    //Lấy thông tin báo giá
    const { data: quotation, error: quoteError } = await this.supabase
      .schema('sales')
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (quoteError || !quotation) {
      throw new NotFoundException('Quotation not found');
    }

    //Lấy các dòng sản phẩm trong báo giá
    const { data: items, error: itemsError } = await this.supabase
      .schema('sales')
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', id);

    if (itemsError) {
      throw new Error(`Failed to fetch quotation items: ${itemsError.message}`);
    }

    //Gộp items vào data và gọi hàm mapRowToQuotation
    return this.mapRowToQuotation({
      ...quotation,
      items, // thêm field items vào object quotation
    });
  }

  //Cập nhật báo giá
  async update(id: string, updateData: Partial<Quotation>): Promise<Quotation> {
    const updatedAt = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );

    //Nếu có items mới, cập nhật lại bảng quotation_items
    if (updateData.items && updateData.items.length > 0) {
      // Xóa toàn bộ items cũ
      const { error: delError } = await this.supabase
        .schema('sales')
        .from('quotation_items')
        .delete()
        .eq('quotation_id', id);

      if (delError) throw new Error(`Failed to delete old items: ${delError.message}`);

      // Thêm lại items mới
      const { error: insertError } = await this.supabase
        .schema('sales')
        .from('quotation_items')
        .insert(
          updateData.items.map((item) => ({
            id: uuid(),
            quotation_id: id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            created_at: new Date(
              new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
            ).toISOString(),
          })),
        );

      if (insertError) throw new Error(`Failed to insert new items: ${insertError.message}`);
    }

    //Cập nhật thông tin báo giá chính (trừ items)
    const { data, error } = await this.supabase
      .schema('sales')
      .from('quotations')
      .update({
        note: updateData.note,
        status: updateData.status,
        total_amount: updateData.totalAmount,
        updated_at: updatedAt.toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Supabase update error: ${error.message}`);

    //Lấy lại bản ghi sau khi cập nhật (gồm items)
    const quotation = await this.findOne(id);

    return quotation;
  }

  //Xoá báo giá
  async remove(id: string): Promise<void> {
    //Xóa toàn bộ items thuộc báo giá này
    const { error: delItemsError } = await this.supabase
      .schema('sales')
      .from('quotation_items')
      .delete()
      .eq('quotation_id', id);

    if (delItemsError) {
      throw new Error(`Failed to delete quotation items: ${delItemsError.message}`);
    }

    //Xóa báo giá chính
    const { error: delQuoteError } = await this.supabase
      .schema('sales')
      .from('quotations')
      .delete()
      .eq('id', id);

    if (delQuoteError) {
      throw new Error(`Supabase delete quotation error: ${delQuoteError.message}`);
    }
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
          created_at: new Date(
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
          ).toISOString(),
          updated_at: new Date(
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
          ).toISOString(),
        },
      ]);

    if (insertError) throw new Error(`Failed to create order: ${insertError.message}`);

    await this.supabase
      .schema('sales')
      .from('quotations')
      .update({
        status: 'converted',
        updated_at: new Date(
          new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
        ).toISOString(),
      })
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
