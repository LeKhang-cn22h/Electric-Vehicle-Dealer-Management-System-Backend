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
    const now = new Date();
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
    const now = new Date();

    const { data, error } = await this.supabase
      .schema('sales')
      .from('prices')
      .update({
        ...dto,
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
      basePrice: row.basePrice,
      discountedPrice: row.discountedPrice,
      startDate: new Date(row.startDate),
      endDate: new Date(row.endDate),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /* ---------------- PROMOTION ---------------- */

  async createPromotion(dto: CreatePromotionDto): Promise<Promotion> {
    const now = new Date();

    const newPromotion: Promotion = {
      id: uuid(),
      title: dto.title,
      description: dto.description,
      discountPercent: dto.discountPercent,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await this.supabase.schema('sales').from('promotions').insert({
      id: newPromotion.id,
      title: newPromotion.title,
      description: newPromotion.description,
      discount_percent: newPromotion.discountPercent,
      start_date: newPromotion.startDate.toISOString(),
      end_date: newPromotion.endDate.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    if (error) throw new Error(error.message);
    return newPromotion;
  }

  async findAllPromotions(): Promise<Promotion[]> {
    const { data, error } = await this.supabase.schema('sales').from('promotions').select('*');

    if (error) throw new Error(error.message);

    return data.map(this.mapPromotionRow);
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
    const now = new Date();

    const { data, error } = await this.supabase
      .schema('sales')
      .from('promotions')
      .update({
        ...dto,
        updated_at: now.toISOString(),
      })
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
      title: row.title,
      description: row.description,
      discountPercent: row.discount_percent,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
