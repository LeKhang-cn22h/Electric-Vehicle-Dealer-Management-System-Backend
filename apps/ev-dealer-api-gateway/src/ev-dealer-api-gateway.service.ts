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
  getCustomer(data: any) {
    // Here you would typically call the customer service to get the customer details
    // For demonstration, we return a mock customer
    return { id: data.id, name: 'Mock Customer', email: '' };
  }
}
