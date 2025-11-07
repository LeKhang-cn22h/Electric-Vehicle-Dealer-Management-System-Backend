import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
  Patch,
} from '@nestjs/common';
import type { Request } from 'express'; // Sửa: thêm 'type'
import { EvmCoordinationService } from './evm-staff-coordination.service'; // Sửa: import đúng service
import type { AvailableVehiclesQueryDto } from './dto/available-vehicles-query.dto'; // Sửa: thêm 'type'

@Controller('api/evm-coordination')
export class EvmCoordinationController {
  constructor(private readonly evmCoordinationService: EvmCoordinationService) {}

  // Gateway: GET /api/evm-coordination/vehicles/available
  @Get('vehicles/available')
  async getAvailableVehicles(
    @Query() query: AvailableVehiclesQueryDto,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    return this.evmCoordinationService.getAvailableVehicles(
      query.location,
      Number(query.minRange), // Convert string to number
      headers,
    );
  }

  // Các endpoints khác giữ nguyên...
  @Get('dealers/:dealerId/vehicle-assignments')
  async getVehicleAssignments(
    @Param('dealerId') dealerId: string,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    return this.evmCoordinationService.getVehicleAssignments(dealerId, headers);
  }

  @Post('vehicle-assignments')
  @HttpCode(HttpStatus.CREATED)
  async assignVehicleToDealer(
    @Body() assignmentData: any,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    return this.evmCoordinationService.assignVehicleToDealer(assignmentData, headers);
  }

  @Put('vehicle-assignments/:assignmentId')
  async updateVehicleAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() updateData: any,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    return this.evmCoordinationService.updateVehicleAssignment(assignmentId, updateData, headers);
  }

  @Delete('vehicle-assignments/:assignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelVehicleAssignment(
    @Param('assignmentId') assignmentId: string,
    @Headers() headers: Record<string, string>,
  ): Promise<void> {
    // Thêm return type
    return this.evmCoordinationService.cancelVehicleAssignment(assignmentId, headers);
  }

  @Get('vehicle-assignments/:assignmentId/tracking')
  async getVehicleTracking(
    @Param('assignmentId') assignmentId: string,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    return this.evmCoordinationService.getVehicleTracking(assignmentId, headers);
  }

  @Post('vehicle-assignments/:assignmentId/confirm-delivery')
  async confirmVehicleDelivery(
    @Param('assignmentId') assignmentId: string,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    return this.evmCoordinationService.confirmVehicleDelivery(assignmentId, headers);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    // Bỏ 'async' vì không có await
    return {
      status: 'ok',
      service: 'evm-coordination-gateway',
      timestamp: new Date().toISOString(),
    };
  }

  // Các wildcard routes...
  @Get('*')
  async forwardGetRequest(
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    const path = req.url.replace('/api/evm-coordination', '');
    return this.evmCoordinationService.forwardRequest('GET', path, null, headers);
  }

  @Post('*')
  async forwardPostRequest(
    @Req() req: Request,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    const path = req.url.replace('/api/evm-coordination', '');
    return this.evmCoordinationService.forwardRequest('POST', path, body, headers);
  }

  @Put('*')
  async forwardPutRequest(
    @Req() req: Request,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    const path = req.url.replace('/api/evm-coordination', '');
    return this.evmCoordinationService.forwardRequest('PUT', path, body, headers);
  }

  @Patch('*')
  async forwardPatchRequest(
    @Req() req: Request,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    const path = req.url.replace('/api/evm-coordination', '');
    return this.evmCoordinationService.forwardRequest('PATCH', path, body, headers);
  }

  @Delete('*')
  async forwardDeleteRequest(
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    // Thêm return type
    const path = req.url.replace('/api/evm-coordination', '');
    return this.evmCoordinationService.forwardRequest('DELETE', path, null, headers);
  }
}
