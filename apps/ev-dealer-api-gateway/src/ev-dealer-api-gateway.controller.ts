import { Controller, Get } from '@nestjs/common';
import { EvDealerApiGatewayService } from './ev-dealer-api-gateway.service';

@Controller()
export class EvDealerApiGatewayController {
  constructor(
    private readonly evDealerApiGatewayService: EvDealerApiGatewayService,
  ) {}

  @Get()
  getHello(): string {
    return this.evDealerApiGatewayService.getHello();
  }
}
