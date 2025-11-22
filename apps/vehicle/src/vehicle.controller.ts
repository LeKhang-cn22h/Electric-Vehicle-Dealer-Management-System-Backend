import { Controller, Get } from '@nestjs/common';
import { VehicleService } from './vehicle.service';

@Controller()
export class VehicleController {
  constructor(private readonly vehicleNewService: VehicleService) {}

  @Get()
  getHello(): string {
    return this.vehicleNewService.getHello();
  }
}
