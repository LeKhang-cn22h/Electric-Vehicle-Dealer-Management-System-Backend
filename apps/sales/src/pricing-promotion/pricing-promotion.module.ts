import { Module } from '@nestjs/common';
import { PricingPromotionService } from './pricing-promotion.service';
import { PricingPromotionController } from './pricing-promotion.controller';

@Module({
  imports: [],
  controllers: [PricingPromotionController],
  providers: [PricingPromotionService],
  exports: [PricingPromotionService],
})
export class PricingPromotionModule {}
