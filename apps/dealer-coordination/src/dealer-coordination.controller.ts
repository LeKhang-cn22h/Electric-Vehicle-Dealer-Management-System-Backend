// dealer-coordination.controller.ts
import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Headers,
  Param,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { DealerCoordinationService } from './dealer-coordination.service';
import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';

// @Controller('dealer-coordination')
// export class DealerCoordinationController {
//   constructor(private readonly dealerService: DealerCoordinationService) {}

//   // ===========================
//   // CREATE REQUEST
//   // ===========================
//   @Post('requests')
//   async createRequest(
//     @Body() body: CreateVehicleRequestDto,
//     @Headers('authorization') auth: string,
//   ) {
//     const result = await this.dealerService.createVehicleRequest(body, auth);

//     return {
//       message: 'Request created successfully',
//       data: result.request,
//     };
//   }

//   // ===========================
//   // GET ALL REQUESTS
//   // ===========================
//   @Get('requests')
//   async getAllRequests(@Query('dealer_name') dealer_name?: string) {
//     if (dealer_name) {
//       const requests = await this.dealerService.getVehicleRequestsByDealerName(dealer_name);
//       return { data: requests };
//     }

//     const requests = await this.dealerService.getAllVehicleRequests();
//     return { data: requests };
//   }
// }
// src/dealer-coordination.controller.ts
@Controller('dealer-coordination')
export class DealerCoordinationController {
  constructor(private readonly dealerCoordinationService: DealerCoordinationService) {}

  @Post('requests')
  async createRequest(
    @Body() body: CreateVehicleRequestDto,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }
    return this.dealerCoordinationService.createVehicleRequest(body, auth);
  }

  @Get('requests')
  async getRequests(@Query('dealer_name') dealer_name?: string) {
    return this.dealerCoordinationService.getVehicleRequestsByDealerName(dealer_name);
  }

  // THÊM: Endpoint mới theo status
  @Get('requests/status/:status')
  async getRequestsByStatus(@Param('status') status: string) {
    return this.dealerCoordinationService.getVehicleRequestsByStatus(status);
  }

  // THÊM: Endpoint update status
  @Put('requests/:id/status')
  async updateRequestStatus(@Param('id') id: number, @Body() body: { status: string }) {
    return this.dealerCoordinationService.updateRequestStatus(id, body.status);
  }
}
