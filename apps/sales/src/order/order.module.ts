import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { QuotationService } from '../quotation/quotation.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, QuotationService],
})
export class OrderModule {}
