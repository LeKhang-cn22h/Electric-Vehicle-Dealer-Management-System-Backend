import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { CreatePriceDto } from './dto/create-price.dto';
import { Price } from './entity/price.entity';
import { UpdatePriceDto } from './dto/update-price.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { Promotion } from './entity/promotion.entity';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
@Injectable()
export class PricingPromotionService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  /* ---------------- PRICE ---------------- */

  async createPrice(dto: CreatePriceDto): Promise<Price> {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const newPrice: Price = {
      id: uuid(),
      productId: dto.productId,
      basePrice: dto.basePrice,
      discountedPrice: dto.discountedPrice,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await this.supabase
      .schema('sales')
      .from('prices')
      .insert({
        id: newPrice.id,
        product_id: newPrice.productId,
        base_price: newPrice.basePrice,
        discounted_price: newPrice.discountedPrice,
        start_date: newPrice.startDate.toISOString(),
        end_date: newPrice.endDate ? newPrice.endDate.toISOString() : null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    if (error) throw new Error(error.message);

    return newPrice;
  }

  async findAllPrices(): Promise<Price[]> {
    const { data, error } = await this.supabase.schema('sales').from('prices').select('*');

    if (error) throw new Error(error.message);

    return data.map(this.mapPriceRow);
  }

  async findOnePrice(id: string): Promise<Price> {
    const { data, error } = await this.supabase
      .schema('sales')
      .from('prices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Price not found');
    return this.mapPriceRow(data);
  }

  async updatePrice(id: string, dto: UpdatePriceDto): Promise<Price> {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const { data, error } = await this.supabase
      .schema('sales')
      .from('prices')
      .update({
        product_id: dto.productId,
        base_price: dto.basePrice,
        discounted_price: dto.discountedPrice,
        start_date: dto.startDate,
        end_date: dto.endDate,
        updated_at: now.toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return this.mapPriceRow(data);
  }

  async removePrice(id: string): Promise<any> {
    const { count, error } = await this.supabase
      .schema('sales')
      .from('prices')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw new Error(error.message);
    if (count === 0) throw new NotFoundException('Price not found');

    return { message: `Price ${id} deleted successfully` };
  }

  private mapPriceRow(row: any): Price {
    return {
      id: row.id,
      productId: row.product_id,
      basePrice: row.base_price,
      discountedPrice: row.discounted_price,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /* ---------------- PROMOTION ---------------- */

  async createPromotion(dto: CreatePromotionDto): Promise<Promotion> {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const id = uuid();

    const newPromotion = {
      id,
      code: dto.code,
      description: dto.description,
      discount_type: dto.discountType,
      discount_value: dto.discountValue,
      min_order_value: dto.minOrderValue ?? null,
      min_quantity: dto.minQuantity ?? null,
      start_date: new Date(dto.startDate).toISOString(),
      end_date: dto.endDate ? new Date(dto.endDate).toISOString() : null,
      is_active: dto.isActive ?? true,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { error } = await this.supabase.schema('sales').from('promotions').insert(newPromotion);
    if (error) throw new Error(error.message);

    return this.mapPromotionRow(newPromotion);
  }

  async findAllPromotions(): Promise<Promotion[]> {
    const { data, error } = await this.supabase
      .schema('sales')
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map((promotion) => this.mapPromotionRow(promotion));
  }

  async findOnePromotion(id: string): Promise<Promotion> {
    const { data, error } = await this.supabase
      .schema('sales')
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Promotion not found');

    return this.mapPromotionRow(data);
  }

  async updatePromotion(id: string, dto: UpdatePromotionDto): Promise<Promotion> {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const payload = {
      code: dto.code,
      description: dto.description,
      discount_type: dto.discountType,
      discount_value: dto.discountValue,
      min_order_value: dto.minOrderValue,
      min_quantity: dto.minQuantity,
      start_date: dto.startDate,
      end_date: dto.endDate,
      is_active: dto.isActive,
      updated_at: now.toISOString(),
    };

    const { data, error } = await this.supabase
      .schema('sales')
      .from('promotions')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return this.mapPromotionRow(data);
  }

  async removePromotion(id: string) {
    const { count, error } = await this.supabase
      .schema('sales')
      .from('promotions')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw new Error(error.message);
    if (count === 0) throw new NotFoundException('Promotion not found');

    return { message: `Promotion ${id} deleted successfully` };
  }

  private mapPromotionRow(row: any): Promotion {
    return {
      id: row.id,
      code: row.code,
      description: row.description,

      discountType: row.discount_type,
      discountValue: row.discount_value,

      minOrderValue: row.min_order_value,
      minQuantity: row.min_quantity,

      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : null,

      isActive: row.is_active,

      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
