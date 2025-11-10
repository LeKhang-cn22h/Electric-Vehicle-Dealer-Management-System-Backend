import { Module } from '@nestjs/common';
import { CustomerServiceController } from './customer-service.message.controller';
import { CustomerServiceService } from './customer-service.service';

@Module({
  imports: [],
  controllers: [CustomerServiceController],
  providers: [CustomerServiceService],
})
export class CustomerServiceModule {}
