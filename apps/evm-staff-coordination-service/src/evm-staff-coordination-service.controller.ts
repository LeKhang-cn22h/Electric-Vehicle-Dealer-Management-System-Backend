// src/evm-staff-coordination-service.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { EvmStaffCoordinationService } from './evm-staff-coordination-service.service';
import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';
import { ProcessVehicleRequestDto } from './dto/process-vehicle-request.dto';

@Controller('vehicle-requests')
export class EvmStaffCoordinationServiceController {
  constructor(private readonly coordinationService: EvmStaffCoordinationService) {}

  // Dealer gửi yêu cầu
  @Post()
  async createRequest(
    @Body() createDto: CreateVehicleRequestDto,
    @Headers('user-id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.coordinationService.createVehicleRequest(createDto, userId);
  }

  // Các method khác giữ nguyên...
  @Get()
  async getRequests(
    @Query('status') status?: string,
    @Query('dealer_name') dealer_name?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.coordinationService.getVehicleRequests({
      status,
      dealer_name,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }

  @Get('user/:userId')
  async getRequestsByUserId(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.coordinationService.getVehicleRequestsByUserId(userId, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }

  @Get('search/email')
  async searchByEmail(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email query parameter is required');
    }
    return this.coordinationService.searchVehicleRequestsByEmail(email);
  }

  @Get(':id')
  async getRequestById(@Param('id') id: number) {
    return this.coordinationService.getVehicleRequestById(Number(id));
  }

  @Put(':id/process')
  async processRequest(@Param('id') id: number, @Body() processDto: ProcessVehicleRequestDto) {
    processDto.id = Number(id);
    return this.coordinationService.processVehicleRequest(processDto);
  }

  @Put(':id')
  async updateRequest(
    @Param('id') id: number,
    @Body() updateDto: Partial<CreateVehicleRequestDto>,
  ) {
    return this.coordinationService.updateVehicleRequest(Number(id), updateDto);
  }

  @Delete(':id')
  async deleteRequest(@Param('id') id: number) {
    return this.coordinationService.deleteVehicleRequest(Number(id));
  }

  @Get('stats/summary')
  async getStats() {
    return this.coordinationService.getRequestStats();
  }

  @Get('health/check')
  async healthCheck() {
    return this.coordinationService.healthCheck();
  }
}
