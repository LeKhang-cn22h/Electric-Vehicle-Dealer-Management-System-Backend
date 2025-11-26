import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DealerAgreementService } from './dealer-agreement.service';
import { CreateContractRequestDto } from './dto/create-contract-request.dto';

@Controller('dealer-agreement')
export class DealerAgreementController {
  constructor(private readonly dealerAgreementService: DealerAgreementService) {}

  @Post('contract-request')
  async createContractRequest(
    @Req() req: Request,
    @Body() createDto: CreateContractRequestDto,
  ): Promise<{ message: string }> {
    await this.dealerAgreementService.createContractRequest(req, createDto);
    return { message: 'Yêu cầu hợp đồng đã được gửi thành công' };
  }
}
// import { Controller, Post, Body, Req, Get } from '@nestjs/common';
// import type { Request } from 'express';
// import { DealerAgreementService } from './dealer-agreement.service';
// import { CreateContractRequestDto } from './dto/create-contract-request.dto';

// @Controller('dealer-agreement')
// export class DealerAgreementController {
//   constructor(private readonly dealerAgreementService: DealerAgreementService) {}

//   /** Gửi yêu cầu hợp đồng */
//   @Post('contract-request')
//   async createContractRequest(
//     @Req() req: Request,
//     @Body() createDto: CreateContractRequestDto,
//   ): Promise<{ message: string }> {
//     await this.dealerAgreementService.createContractRequest(req, createDto);
//     return { message: 'Yêu cầu hợp đồng đã được gửi thành công' };
//   }

//   /** Lấy lịch sử request */
//   @Get('history')
//   async getHistory(@Req() req: Request) {
//     return this.dealerAgreementService.getHistory(req);
//   }
// }
