import { Body, Controller, Post } from '@nestjs/common';
import { EvmStaffCoordinationService } from './evm-staff-coordination-service.service';

interface VehicleResponseItemDto {
  request_item_id: string;
  response_status: string;
  response_note?: string;
}

class CreateVehicleResponseDto {
  request_id: string;
  staff_id: string;
  staff_name: string;
  response_status: string;
  response_note?: string;
  items: VehicleResponseItemDto[];
}

@Controller('staff-coordination')
export class EvmStaffCoordinationController {
  constructor(private readonly staffService: EvmStaffCoordinationService) {}

  @Post('create-response')
  async createResponse(@Body() body: CreateVehicleResponseDto) {
    const { request_id, staff_id, staff_name, response_status, response_note, items } = body;
    return await this.staffService.createVehicleResponse(
      request_id,
      staff_id,
      staff_name,
      response_status,
      response_note || null,
      items,
    );
  }
}
