import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Quotation } from './entity/quotation.entity';
import { v4 as uuid } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';
import { PricingPromotionService } from '../pricing-promotion/pricing-promotion.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationItemDto } from './dto/quotation-item.dto';

@Injectable()
export class QuotationService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly pricingPromotionService: PricingPromotionService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async getCustomerById(id: number) {
    const response = await this.amqpConnection.request<{ customer: any }>({
      exchange: 'customer_quotaion',
      routingKey: 'quotaion.customer',
      payload: { id },
      timeout: 160000,
    });
    return response;
  }

  async getVehicleId(id: number) {
    const response = await this.amqpConnection.request<{ vehicle: any }>({
      exchange: 'quotation_vehicle',
      routingKey: 'quotaion.vehicle',
      payload: { id },
      timeout: 160000,
    });
    return response;
  }

  //Tạo báo giá
  async create(createQuote: CreateQuotationDto): Promise<any> {
    try {
      console.log('createQuote', createQuote);

      // Tổng tiền sản phẩm
      const subtotal = createQuote.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Tiền giảm giá từ khuyến mãi
      let discountAmount = 0;
      if (createQuote.promotionCode && createQuote.promotionCode.length > 0) {
        // Lấy toàn bộ promotions theo code
        const promotions = await Promise.all(
          createQuote.promotionCode.map((code) =>
            this.pricingPromotionService.findOnePromotion(code),
          ),
        );

        // Tính tổng discount
        for (const promo of promotions) {
          if (!promo) continue;

          if (promo.discountType === 'percent') {
            discountAmount += subtotal * (promo.discountValue / 100);
          } else if (promo.discountType === 'amount') {
            discountAmount += promo.discountValue;
          }
        }
      }
      const subtotalAfterDiscount = Math.max(subtotal - discountAmount, 0);

      // Tiền VAT
      let vatAmount = 0;
      if (createQuote.vatRate) vatAmount = subtotal * createQuote.vatRate;

      // Tổng tiền phải trả
      const totalAmount = subtotalAfterDiscount + vatAmount;
      console.log('totalAmount', totalAmount);
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
            vat: createQuote.vatRate,
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
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
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
    } catch (error) {
      console.error('Lỗi khi tạo báo giá:', error);
      console.error('Error response:', error.response?.data); // Thêm dòng này
    }
  }

  //Lấy tất cả báo giá
  async findAll(): Promise<Quotation[]> {
    // Lấy tất cả báo giá
    const { data: quotations, error: quoteError } = await this.supabase
      .schema('sales')
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (quoteError) throw new Error(`Supabase fetch error: ${quoteError.message}`);

    if (!quotations?.length) return [];

    // Lấy tất cả items theo quotation_id
    const quotationIds = quotations.map((q) => q.id);

    const { data: items, error: itemsError } = await this.supabase
      .schema('sales')
      .from('quotation_items')
      .select('*')
      .in('quotation_id', quotationIds);

    if (itemsError) throw new Error(`Failed to fetch quotation items: ${itemsError.message}`);

    // Gom nhóm items theo quotation_id
    const itemsByQuotation = items.reduce(
      (acc, item) => {
        if (!acc[item.quotation_id]) acc[item.quotation_id] = [];
        acc[item.quotation_id].push(item);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Lấy thông tin customer cho từng quotation
    const quotationsWithCustomer = await Promise.all(
      quotations.map(async (quote) => ({
        ...quote,
        customer: await this.getCustomerById(quote.customer_id),
      })),
    );

    // Map final response
    const res = quotationsWithCustomer.map((row) =>
      this.mapRowToQuotation({
        ...row,
        items: itemsByQuotation[row.id] || [],
        customer: row.customer,
      }),
    );

    return res;
  }

  //Lấy báo giá theo ID
  async findOne(id: string): Promise<any> {
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

    const customer = await this.getCustomerById(quotation.customer_id);

    const vehicle = await Promise.all(
      items.map(async (item) => await this.getVehicleId(item.product_id)),
    );
    console.log('vehicle', vehicle);
    const promotions = await Promise.all(
      quotation.promotion_code.map(
        async (promo_id) => await this.pricingPromotionService.findOnePromotion(promo_id),
      ),
    );
    console.log('promotions', promotions);
    const quotationDetail = this.mapRowToQuotation({
      ...quotation,
      items: items, // thêm field items vào object quotation
      customer: customer,
      promotions: promotions,
      vehicle: vehicle,
    });
    console.log('quotationDetail', quotationDetail);
    //Gộp items vào data và gọi hàm mapRowToQuotation
    return quotationDetail;
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
    const quotationsWithCustomer = await Promise.all(
      quotations.map(async (quote) => ({
        ...quote,
        customer: await this.getCustomerById(quote.customer_id),
      })),
    );
    console.log('quotationsWithCustomer', quotationsWithCustomer);
    const res = quotationsWithCustomer.map((row) =>
      this.mapRowToQuotation({
        ...row,
        items: itemsByQuotation[row.id] || [],
        customer: row.customer,
      }),
    );
    console.log('res', res);
    //Trả về danh sách Quotation (gộp items tương ứng)
    return res;
  }

  //Cập nhật báo giá
  async update(id: string, updateData: Partial<UpdateQuotationDto>): Promise<Quotation> {
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
      updateData.items.map(async (item) => await this.createQuoteItems(id, item));
    }

    let payload: any = {};

    if (updateData.customerId !== undefined) payload.customer_id = updateData.customerId;
    if (updateData.createdBy !== undefined) payload.created_by = updateData.createdBy;
    if (updateData.vatRate !== undefined) payload.vat = updateData.vatRate;
    if (updateData.note !== undefined) payload.note = updateData.note;

    //Cập nhật thông tin báo giá chính (trừ items)
    const { data, error } = await this.supabase
      .schema('sales')
      .from('quotations')
      .update({ ...payload, updated_at: updatedAt.toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Supabase update error: ${error.message}`);

    return data;
  }

  async createQuoteItems(quotation_id: string, dto: QuotationItemDto) {
    try {
      const payload = {
        id: uuid(),
        quotation_id,
        product_id: dto.id,
        quantity: dto.quantity,
        unit_price: dto.price,
        created_at: new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })),
      };
      const { error } = await this.supabase.schema('sales').from('quotation_items').insert(payload);
      return { message: 'Tạo sản phẩm báo giá thành công' };
    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm trong báo giá:', error);
      console.error('Error response:', error.response?.data); // Thêm dòng này
    }
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
  private mapRowToQuotation(row: any) {
    return {
      id: row.id,
      customerId: row.customer_id,
      customer: row.customer || null,
      vehicles: row.vehicle || null,
      promotions: row.promotions || null,
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
