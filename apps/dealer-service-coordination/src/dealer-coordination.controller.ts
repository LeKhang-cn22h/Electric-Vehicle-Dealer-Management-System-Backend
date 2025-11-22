// import { Body, Controller, Post } from '@nestjs/common';
// import { DealerCoordinationService } from './dealer-coordination.service';
// import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';

// @Controller('dealer-coordination')
// export class DealerCoordinationController {
//   constructor(private readonly dealerService: DealerCoordinationService) {}

//   @Post('create-request')
//   async createRequest(@Body() body: CreateVehicleRequestDto) {
//     const result = (await this.dealerService.createVehicleRequest(
//       body.dealer_name,
//       body.vehicle_model,
//       body.quantity,
//       body.note || '',
//       body.request_type,
//     )) as { id: string; status: string }; // Thay thế với kiểu thực tế

//     return { message: 'Request created successfully', data: result };
//   }
// }
import { Body, Controller, Post, Get, Query, Param } from '@nestjs/common';
import { DealerCoordinationService } from './dealer-coordination.service';
import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';

@Controller('dealer-coordination')
export class DealerCoordinationController {
  constructor(private readonly dealerService: DealerCoordinationService) {}

  @Post()
  async createRequest(@Body() body: CreateVehicleRequestDto) {
    const vehicles = (body.vehicles || []).map((v: any) => ({
      vehicle_id: v.vehicle_id,
      // ensure the required field `vehicle_model` exists (try common alternatives)
      vehicle_model: v.vehicle_model ?? v.model ?? v.vehicleModel ?? '',
      quantity: v.quantity,
      note: v.note,
    }));

    const result = await this.dealerService.createVehicleRequest(
      body.dealer_id,
      body.dealer_name,
      body.request_type,
      vehicles,
    );

    return {
      message: 'Requests created successfully',
      total: result.length,
      data: result,
    };
  }

  @Get('dealer/:dealer_id')
  async getRequestsByDealerId(@Param('dealer_id') dealer_id: string) {
    const requests = await this.dealerService.getVehicleRequestsByDealerId(dealer_id);
    return {
      message: 'Requests retrieved successfully',
      data: requests,
    };
  }

  @Get('requests')
  async getRequestsByDealerName(@Query('dealer_name') dealer_name?: string) {
    const requests = await this.dealerService.getVehicleRequestsByDealerName(dealer_name);
    return {
      message: 'Requests retrieved successfully',
      data: requests,
    };
  }

  @Get('all')
  async getAllRequests() {
    const requests = await this.dealerService.getAllVehicleRequests();
    return {
      message: 'All requests retrieved successfully',
      data: requests,
    };
  }
}
