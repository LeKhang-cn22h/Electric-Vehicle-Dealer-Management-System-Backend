// import { Controller, Post, Body, Req } from '@nestjs/common';
// import type { Request } from 'express';
// import { DealerAgreementService } from './dealer-agreement.service';
// import { CreateContractRequestDto } from './dto/create-contract-request.dto';

// @Controller('dealer-agreement')
// export class DealerAgreementController {
//   constructor(private readonly dealerAgreementService: DealerAgreementService) {}

//   @Post('contract-request')
//   async createContractRequest(
//     @Req() req: Request,
//     @Body() createDto: CreateContractRequestDto,
//   ): Promise<{ message: string }> {
//     await this.dealerAgreementService.createContractRequest(req, createDto);
//     return { message: 'Yêu cầu hợp đồng đã được gửi thành công' };
//   }
// }
import { Controller, Post, Get, Body, Req, Param, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { DealerAgreementService } from './dealer-agreement.service';
import { CreateContractRequestDto } from './dto/create-contract-request.dto';
@Controller('dealer-agreement')
export class DealerAgreementController {
  constructor(private readonly dealerAgreementService: DealerAgreementService) {}

  @Post('requests')
  async createContractRequest(@Req() req: Request, @Body() dto: CreateContractRequestDto) {
    return this.dealerAgreementService.createContractRequest(req, dto);
  }

  // ✅ Lấy contract request mới nhất của user
  @Get('requests/my-latest')
  async getMyContractRequest(@Req() req: Request) {
    return this.dealerAgreementService.getContractRequestByUser(req);
  }

  // ✅ Lấy tất cả contract requests của user
  @Get('requests/my-requests')
  async getMyContractRequests(@Req() req: Request) {
    return this.dealerAgreementService.getAllContractRequestsByUser(req);
  }

  // ✅ Lấy contract request theo ID (chỉ của user đó)
  @Get('requests/:id')
  async getContractRequestById(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.dealerAgreementService.getContractRequestById(req, id);
  }
}
