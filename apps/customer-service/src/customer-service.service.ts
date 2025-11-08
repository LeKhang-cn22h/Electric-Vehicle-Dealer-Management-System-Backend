import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomerServiceService {
  [x: string]: any;
  getHello(): string {
    return 'Hello World!';
  }
}
