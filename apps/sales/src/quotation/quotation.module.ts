import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';

@Module({
  // imports: [],
  controllers: [QuotationController],
  providers: [QuotationService],
})
export class QuotationModule {}
