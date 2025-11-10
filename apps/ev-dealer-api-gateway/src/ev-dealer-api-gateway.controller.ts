import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EvDealerApiGatewayService } from './ev-dealer-api-gateway.service';

@Controller()
export class EvDealerApiGatewayController {
  constructor(private readonly evDealerApiGatewayService: EvDealerApiGatewayService) {}

  // TCP message pattern
  @MessagePattern({ cmd: 'get_hello' })
  getHello(): string {
    return this.evDealerApiGatewayService.getHello();
  }
  @MessagePattern({ cmd: 'get_product' })
  getProduct(data: any) {
    return this.evDealerApiGatewayService.getProduct(data);
  }
  @MessagePattern({ cmd: 'get_customer' })
  getCustomer(data: any) {
    return this.evDealerApiGatewayService.getCustomer(data);
  }
}
