import { Controller, Get } from '@nestjs/common';
import { CustomersService } from './customer.service';
@Controller()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  getHello(): string {
    return this.customersService.getHello();
  }
}
