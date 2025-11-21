import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Quotation } from './entity/quotation.entity';
import { v4 as uuid } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';
import { PricingPromotionService } from '../pricing-promotion/pricing-promotion.service';

@Injectable()
export class QuotationService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly pricingPromotionService: PricingPromotionService,
  ) {}

  //Tạo báo giá
  async create(createQuote: CreateQuotationDto): Promise<Quotation> {
    // Tổng tiền sản phẩm
    const subtotal = createQuote.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // Tiền giảm giá từ khuyến mãi
    let discountAmount = 0;
    if (createQuote.promotionCode) {
      const promotion = await this.pricingPromotionService.findOnePromotion(
        createQuote.promotionCode,
      );

      if (promotion) {
        if (promotion.discountType === 'percent') {
          discountAmount = subtotal * promotion.discountValue;
        } else if (promotion.discountType === 'amount') {
          discountAmount = promotion.discountValue;
        }
      }
    }
    const subtotalAfterDiscount = subtotal - discountAmount;

    // Tiền VAT
    let vatAmount = 0;
    if (createQuote.vatRate) vatAmount = subtotalAfterDiscount * createQuote.vatRate;

    // Tổng tiền phải trả
    const totalAmount = subtotalAfterDiscount + vatAmount;

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
          promotion_code: createQuote.promotionCode || null,
          discount_amount: discountAmount,
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
      promotionCode: createQuote.promotionCode || null,
      discountAmount,
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

  async findAllByCreator(id: string): Promise<Quotation[]> {
    //Lấy tất cả báo giá
    const { data: quotations, error: quoteError } = await this.supabase
      .schema('sales')
      .from('quotations')
      .select('*')
      .eq('created_by', id)
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
        promotion_code: updateData.promotionCode || null,
        discount_amount: updateData.discountAmount,
        updated_at: updatedAt.toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Supabase update error: ${error.message}`);

    return data;
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

  //Hàm helper: map dữ liệu từ DB về entity
  private mapRowToQuotation(row: any): Quotation {
    return {
      id: row.id,
      customerId: row.customer_id,
      createdBy: row.created_by,
      items: row.items,
      totalAmount: row.total_amount,
      promotionCode: row.promotion_code,
      discountAmount: row.discount_amount,
      note: row.note,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
