import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { PricingPromotionModule } from '../pricing-promotion/pricing-promotion.module';

@Module({
  imports: [PricingPromotionModule],
  controllers: [QuotationController],
  providers: [QuotationService],
  exports: [QuotationService],
})
export class QuotationModule {}
