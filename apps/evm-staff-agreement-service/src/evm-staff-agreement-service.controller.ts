// import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
// import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';

// @Controller('contract-requests')
// export class ContractRequestController {
//   constructor(private readonly agreementService: EvmStaffAgreementServiceService) {}

//   @Get()
//   async getAllRequests() {
//     return this.agreementService.getContractRequests();
//   }

//   @Post()
//   async createRequest(
//     @Body() body: { dealer_name: string; address: string; phone: string; email: string },
//   ) {
//     return this.agreementService.createContractRequest(body);
//   }

//   @Post('contract-requests/:id/approve')
//   approveRequest(
//     @Param('id') id: string,
//     @Body() body: { sales_target: number; order_limit: number },
//     @Headers('authorization') auth: string,
//   ) {
//     return this.service.approveRequestAndCreateContract(
//       Number(id),
//       body.sales_target,
//       body.order_limit,
//       auth,
//     );
//   }
// }
// evm-staff-agreement.controller.ts
// import {
//   Controller,
//   Post,
//   Get,
//   Param,
//   Body,
//   Headers,
//   BadRequestException,
//   ParseIntPipe,
// } from '@nestjs/common';
// import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';

// @Controller('contract-requests')
// export class EvmStaffAgreementController {
//   constructor(private readonly evmStaffService: EvmStaffAgreementServiceService) {}

//   @Get()
//   async getContractRequests(@Headers('authorization') auth: string) {
//     if (!auth) {
//       throw new BadRequestException('Missing Authorization header');
//     }
//     return this.evmStaffService.getContractRequests();
//   }

//   @Post()
//   async createContractRequest(
//     @Body()
//     body: {
//       dealer_name: string;
//       address: string;
//       phone: string;
//       email: string;
//     },
//     @Headers('authorization') auth: string,
//   ) {
//     if (!auth) {
//       throw new BadRequestException('Missing Authorization header');
//     }
//     return this.evmStaffService.createContractRequest(body);
//   }

//   @Post(':id/approve')
//   async approveRequest(
//     @Param('id', ParseIntPipe) id: number,
//     @Body()
//     body: {
//       sales_target: number;
//       order_limit: number;
//     },
//     @Headers('authorization') auth: string,
//   ) {
//     if (!auth) {
//       throw new BadRequestException('Missing Authorization header');
//     }

//     return this.evmStaffService.approveRequestAndCreateContract(
//       id,
//       body.sales_target,
//       body.order_limit,
//       auth, // ← Truyền token để gọi Gateway
//     );
//   }
// }

// evm-staff-agreement.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';
import { CreateDealerDto } from './DTO/createdealer.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Controller('contract-requests')
export class EvmStaffAgreementController {
  constructor(private readonly evmStaffService: EvmStaffAgreementServiceService) {}

  @Get()
  async getContractRequests(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new BadRequestException('Missing Authorization header');
    }
    return this.evmStaffService.getContractRequests();
  }

  @Post()
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
