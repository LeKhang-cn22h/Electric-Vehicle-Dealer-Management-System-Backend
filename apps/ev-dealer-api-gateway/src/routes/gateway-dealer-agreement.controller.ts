import { Controller, Post, Get, Body, Headers, Param, ParseIntPipe } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('dealer-agreement')
export class GatewayDealerAgreementController {
  constructor(private readonly c: ServiceClients) {}

  @Post('contract-request')
  createContractRequest(@Body() body: any, @Headers('authorization') auth: string) {
    return this.c.dealerAgreement().post('/dealer-agreement/contract-request', body, {
      Authorization: auth,
    });
  }
  @Get('requests/my-latest')
  getMyContractRequest(@Headers('authorization') auth: string) {
    return this.c.dealerAgreement().get('/dealer-agreement/requests/my-latest', {
      Authorization: auth,
    });
  }

  // ✅ THÊM: Lấy tất cả contract requests của user
  @Get('requests/my-requests')
  getMyContractRequests(@Headers('authorization') auth: string) {
    return this.c.dealerAgreement().get('/dealer-agreement/requests/my-requests', {
      Authorization: auth,
    });
  }

  // ✅ THÊM: Lấy contract request theo ID (chỉ của user đó)
  @Get('requests/:id')
  getContractRequestById(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') auth: string,
  ) {
    return this.c.dealerAgreement().get(`/dealer-agreement/requests/${id}`, {
      Authorization: auth,
    });
  }

  // ✅ THÊM: Kiểm tra trạng thái contract request (endpoint đơn giản)
  @Get('check-status')
  checkContractStatus(@Headers('authorization') auth: string) {
    return this.c.dealerAgreement().get('/dealer-agreement/requests/my-latest', {
      Authorization: auth,
    });
  }
}
