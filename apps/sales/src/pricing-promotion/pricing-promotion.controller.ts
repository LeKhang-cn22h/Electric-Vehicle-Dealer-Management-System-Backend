import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { PricingPromotionService } from './pricing-promotion.service';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Controller('pricing-promotion')
export class PricingPromotionController {
  constructor(private readonly service: PricingPromotionService) {}

  // PRICE
  @Post('price')
  createPrice(@Body() dto: CreatePriceDto) {
    return this.service.createPrice(dto);
  }

  @Get('price')
  findAllPrices() {
    return this.service.findAllPrices();
  }

  @Get('price/:id')
  findOnePrice(@Param('id') id: string) {
    return this.service.findOnePrice(id);
  }

  @Patch('price/:id')
  updatePrice(@Param('id') id: string, @Body() dto: UpdatePriceDto) {
    return this.service.updatePrice(id, dto);
  }

  @Delete('price/:id')
  removePrice(@Param('id') id: string) {
    return this.service.removePrice(id);
  }

  /** PROMOTION */
  @Post('promotion')
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.service.createPromotion(dto);
  }

  @Patch('promotion/:id')
  updatePromotion(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.service.updatePromotion(id, dto);
  }

  @Delete('promotion/:id')
  removePromotion(@Param('id') id: string) {
    return this.service.removePromotion(id);
  }
}
