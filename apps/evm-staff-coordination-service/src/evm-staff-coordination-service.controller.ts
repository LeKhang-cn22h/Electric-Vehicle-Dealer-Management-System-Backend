import { Body, Controller, Post } from '@nestjs/common';
import {
  EvmStaffCoordinationService,
  CreateVehicleRequestDto,
} from './evm-staff-coordination-service.service';

@Controller('staff-coordination')
export class EvmStaffCoordinationController {
  constructor(private readonly staffService: EvmStaffCoordinationService) {}

  @Post('create-request')
  async createRequest(@Body() body: CreateVehicleRequestDto) {
    return await this.staffService.handleRequest(body);
  }
}
