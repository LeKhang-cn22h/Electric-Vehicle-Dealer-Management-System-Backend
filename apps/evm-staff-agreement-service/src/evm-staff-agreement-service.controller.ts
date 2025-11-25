// apps/evm-staff-agreement-service/src/evm-staff-agreement.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';

@Controller()
export class EvmStaffAgreementController {
  private readonly logger = new Logger(EvmStaffAgreementController.name);

  constructor(private readonly evmStaffService: EvmStaffAgreementServiceService) {}

  @Get('contract-requests')
  async getContractRequests(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new BadRequestException('Missing Authorization header');
    }
    return this.evmStaffService.getContractRequests();
  }

  /**
   * ✅ TẠO CONTRACT REQUEST với FCM token
   */
  @Post('contract-requests')
  async createContractRequest(
    @Body()
    body: {
      dealer_name: string;
      address: string;
      phone: string;
      email: string;
      user_id?: string;
      fcm_token?: string;
      device_info?: any;
    },
    @Headers('authorization') auth: string,
  ) {
    this.logger.log('📥 Creating contract request');
    this.logger.log('User ID:', body.user_id);
    this.logger.log('FCM Token:', body.fcm_token?.substring(0, 30) + '...');

    if (!auth) {
      throw new BadRequestException('Missing Authorization header');
    }

    return this.evmStaffService.createContractRequest(body);
  }

  /**
   * ✅ APPROVE CONTRACT - Tạo dealer và gửi FCM notification
   */
  @Post('contract-requests/:id/approve-and-create-dealer')
  async approveAndCreateDealer(@Param('id') id: string, @Headers('authorization') auth: string) {
    this.logger.log('=== APPROVE CONTRACT REQUEST ===');
    this.logger.log(`Contract ID: ${id}`);
    this.logger.log(`Auth header: ${auth ? 'EXISTS' : 'MISSING'}`);

    if (!auth) {
      throw new HttpException('Missing Authorization header', HttpStatus.BAD_REQUEST);
    }

    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new HttpException('Invalid contract request ID', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.evmStaffService.createDealerAndContract(numericId, auth);

      this.logger.log('✅ Contract approved successfully');
      return result;
    } catch (error) {
      this.logger.error('❌ Error approving contract:', error);
      throw new HttpException(
        error.message || 'Failed to approve contract',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
