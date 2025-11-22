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
    },
    @Headers('authorization') auth: string,
  ) {
    if (!auth) {
      throw new BadRequestException('Missing Authorization header');
    }
    return this.evmStaffService.createContractRequest(body);
  }

  // @Post(':id/approve')
  // async approveRequest(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Headers('authorization') auth: string,
  // ) {
  //   if (!auth) {
  //     throw new BadRequestException('Missing Authorization header');
  //   }

  //   // KHÔNG CẦN body nữa, chỉ cần ID và token
  //   return this.evmStaffService.approveRequestAndCreateDealer(id, auth);
  // }
  //tạo mới v2
  @Post(':id/approve-and-create-dealer')
  async approveAndCreateDealer(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ): Promise<CreateDealerDto> {
    if (!auth) {
      throw new HttpException('Missing Authorization header', HttpStatus.BAD_REQUEST);
    }

    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new HttpException('Invalid contract request ID', HttpStatus.BAD_REQUEST);
    }

    // Gọi service, trả về CreateDealerDto (hoặc bạn có thể trả về kết quả khác)
    const createDealerDto = await this.evmStaffService.createDealerAndContract(numericId, auth);

    return createDealerDto;
  }
}
