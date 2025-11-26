import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { DealerCoordinationService } from './dealer-coordination.service';
import { CreateVehicleRequestDto } from '../../dealer-coordination/src/dto/create-vehicle-request.dto';

@Controller('dealer-coordination')
export class DealerCoordinationController {
  constructor(private readonly dealerService: DealerCoordinationService) {}

  // ===========================
  // CREATE REQUEST (NEW DTO)
  // ===========================
  @Post('requests')
  async createRequest(@Body() body: CreateVehicleRequestDto) {
    const result = await this.dealerService.createVehicleRequest(body);

    return {
      message: 'Request created successfully',
      data: result.request,
    };
  }

  // ===========================
  // GET ALL REQUESTS
  // ===========================
  @Get('requests')
  async getAllRequests(@Query('dealer_name') dealer_name?: string) {
    if (dealer_name) {
      const requests = await this.dealerService.getVehicleRequestsByDealerName(dealer_name);
      return { data: requests };
    }

    const requests = await this.dealerService.getAllVehicleRequests();
    return { data: requests };
  }
}
