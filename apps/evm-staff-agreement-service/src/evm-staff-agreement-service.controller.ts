import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';

@Controller('contract-requests')
export class ContractRequestController {
  constructor(private readonly agreementService: EvmStaffAgreementServiceService) {}

  @Get()
  async getAllRequests() {
    return this.agreementService.getContractRequests();
  }

  @Post()
  async createRequest(
    @Body() body: { dealer_name: string; address: string; phone: string; email: string },
  ) {
    return this.agreementService.createContractRequest(body);
  }
  @Post(':id/approve')
  async approveRequest(
    @Param('id') id: number,
    @Body() body: { sales_target: number; order_limit: number },
  ) {
    const result = await this.agreementService.approveRequestAndCreateContract(
      id,
      body.sales_target,
      body.order_limit,
    );
    return result;
  }

  @Post('/contracts/:id/accept')
  async acceptContract(@Param('id', ParseIntPipe) id: number, @Body() body: { dealer_id: number }) {
    const { dealer_id } = body;
    return this.agreementService.acceptContract(id, dealer_id);
  }

  @Post('/contracts/:id/reject')
  async rejectContract(@Param('id') id: number) {
    return this.agreementService.rejectContract(id);
  }
}
