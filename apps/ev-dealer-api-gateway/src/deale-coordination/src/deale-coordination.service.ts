import { Injectable } from '@nestjs/common';

@Injectable()
export class DealeCoordinationService {
  getHello(): string {
    return 'Hello World!';
  }
}
