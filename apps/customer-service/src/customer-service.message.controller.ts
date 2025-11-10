import { Controller, Get } from '@nestjs/common';
import { CustomerServiceService } from './customer-service.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class CustomerServiceController {
  constructor(private readonly customerServiceService: CustomerServiceService) {}

  @MessagePattern({ cmd: 'get_hello' })
  getHello(): string {
    return this.customerServiceService.getHello();
  }
  @MessagePattern({ cmd: 'get_customer_by_id' })
  findOneCustomer(id: number) {
    return this.customerServiceService.findOne(id);
  }
}
