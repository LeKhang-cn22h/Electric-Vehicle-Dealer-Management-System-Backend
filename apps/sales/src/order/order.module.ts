import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { QuotationModule } from '../quotation/quotation.module';

@Module({
  imports: [QuotationModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
