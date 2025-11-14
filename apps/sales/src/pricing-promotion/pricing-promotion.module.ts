import { Module } from '@nestjs/common';
import { PromotionService } from './pricing-promotion.service';
import { PromotionController } from './pricing-promotion.controller';

@Module({
  imports: [],
  controllers: [PromotionController],
  providers: [PromotionService],
})
export class PromotionModule {}
