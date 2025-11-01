import { Injectable } from '@nestjs/common';

@Injectable()
export class EvDealerApiGatewayService {
  getHello(): string {
    return 'Hello World!';
  }
}
