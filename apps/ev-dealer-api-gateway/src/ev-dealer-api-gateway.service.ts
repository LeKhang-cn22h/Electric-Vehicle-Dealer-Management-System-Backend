import { Injectable } from '@nestjs/common';

@Injectable()
export class EvDealerApiGatewayService {
  getHello(): string {
    return 'Hello World!';
  }
  getProduct(data: any) {
    // Here you would typically call the product service to get the product details
    // For demonstration, we return a mock product
    return { id: data.id, name: 'Mock Product', description: 'This is a mock product.' };
  }
}
