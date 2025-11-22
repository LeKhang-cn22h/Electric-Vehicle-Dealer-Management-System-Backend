import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('evm-staff-agreement')
export class GatewayEvmStaffAgreementController {
  constructor(private readonly serviceClients: ServiceClients) {}

  @Get('contract-requests')
  getAllRequests(@Headers('authorization') auth: string) {
    return this.serviceClients.evmStaffAgreement().get('/contract-requests', {
      Authorization: auth,
    });
  }

  @Post('contract-requests')
  createRequest(
    @Body() body: { dealer_name: string; address: string; phone: string; email: string },
    @Headers('authorization') auth: string,
  ) {
    return this.serviceClients.evmStaffAgreement().post('/contract-requests', body, {
      Authorization: auth,
    });
  }

  @Post('contract-requests/:id/approve')
  approveRequest(
    @Param('id') id: string,
    @Body() body: { sales_target: number; order_limit: number },
    @Headers('authorization') auth: string,
  ) {
    return this.serviceClients.evmStaffAgreement().post(`/contract-requests/${id}/approve`, body, {
      Authorization: auth,
    });
  }

  @Post('contract-requests/contracts/:id/accept')
  acceptContract(
    @Param('id') id: string,
    @Body() body: { dealer_id: number },
    @Headers('authorization') auth: string,
  ) {
    return this.serviceClients
      .evmStaffAgreement()
      .post(`/contract-requests/contracts/${id}/accept`, body, {
        Authorization: auth,
      });
  }

  @Post('contract-requests/contracts/:id/reject')
  rejectContract(@Param('id') id: string, @Headers('authorization') auth: string) {
    return this.serviceClients.evmStaffAgreement().post(
      `/contract-requests/contracts/${id}/reject`,
      {},
      {
        Authorization: auth,
      },
    );
  }
}
