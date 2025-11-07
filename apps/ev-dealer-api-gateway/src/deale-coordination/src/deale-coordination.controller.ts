import { Controller, Get } from '@nestjs/common';
import { DealeCoordinationService } from './deale-coordination.service';

@Controller()
export class DealeCoordinationController {
  constructor(private readonly dealeCoordinationService: DealeCoordinationService) {}

  @Get()
  getHello(): string {
    return this.dealeCoordinationService.getHello();
  }
}
