import { Body, Controller, Post } from '@nestjs/common';
import { DealerCoordinationService } from './dealer-coordination.service';
import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';

@Controller('requests')
export class DealerCoordinationController {
  constructor(private readonly dealerService: DealerCoordinationService) {}

  @Post('create-request')
  async createRequest(@Body() body: CreateVehicleRequestDto) {
    const result = (await this.dealerService.createVehicleRequest(
      body.dealer_id,
      body.vehicle_id,
      body.quantity,
      body.note || '',
      body.request_type,
    )) as { id: string; status: string }; // Thay thế với kiểu thực tế

    return { message: 'Request created successfully', data: result };
  }
}
