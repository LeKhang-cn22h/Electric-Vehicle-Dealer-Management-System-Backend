// src/dealer-agreement/dealer-agreement.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { DealerAgreementService } from './dealer-agreement.service';
import { CreateContractRequestDto } from './dto/create-contract-request.dto';

@Controller('dealer-agreement')
export class DealerAgreementController {
  constructor(private readonly dealerAgreementService: DealerAgreementService) {}

  @Post('contract-request')
  async createContractRequest(
    @Body() createDto: CreateContractRequestDto,
  ): Promise<{ message: string }> {
    await this.dealerAgreementService.createContractRequest(createDto);
    return { message: 'Yêu cầu hợp đồng đã được gửi thành công' };
  }
}
