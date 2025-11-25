// // apps/ev-dealer-api-gateway/src/routes/gateway-evm-staff-agreement-service.controller.ts
// import { Controller, Get, Post, Body, Param, Headers, BadRequestException } from '@nestjs/common';
// import { ServiceClients } from '../service-clients';

// @Controller('evm-staff-agreement')
// export class GatewayEvmStaffAgreementController {
//   constructor(private readonly serviceClients: ServiceClients) {}

//   @Get('contract-requests')
//   getAllRequests(@Headers('authorization') auth: string) {
//     return this.serviceClients.evmStaffAgreement().get('/contract-requests', {
//       authorization: auth, // ← Sửa từ Authorization thành authorization (lowercase)
//     });
//   }

//   @Post('contract-requests')
//   createRequest(
//     @Body() body: { dealer_name: string; address: string; phone: string; email: string },
//     @Headers('authorization') auth: string,
//   ) {
//     return this.serviceClients.evmStaffAgreement().post('/contract-requests', body, {
//       authorization: auth, // ← Sửa từ Authorization thành authorization
//     });
//   }

//   @Post('contract-requests/:id/approve')
//   async approveRequest(
//     @Param('id') id: string,
//     @Headers('authorization') auth: string,
//     @Body() body: any,
//   ) {
//     console.log('===== approveRequest called =====');
//     console.log('Authorization header:', auth);
//     console.log('Contract request ID:', id);
//     console.log('Request body:', body);

//     if (!auth) {
//       throw new BadRequestException('Missing Authorization header');
//     }

//     const numericId = Number(id);
//     if (isNaN(numericId)) {
//       throw new BadRequestException('Invalid contract request ID');
//     }

//     // Gọi service evmStaffAgreement
//     return this.serviceClients.evmStaffAgreement().post(
//       `/contract-requests/${numericId}/approve-and-create-dealer`,
//       {},
//       {
//         authorization: auth,
//       },
//     );
//   }
// }
// apps/ev-dealer-api-gateway/src/routes/gateway-evm-staff-agreement.controller.ts
import { Controller, Get, Post, Body, Param, Headers, BadRequestException } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('evm-staff-agreement')
export class GatewayEvmStaffAgreementController {
  constructor(private readonly serviceClients: ServiceClients) {}

  // GET /evm-staff-agreement/contract-requests
  @Get('contract-requests')
  getAllRequests(@Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.serviceClients.evmStaffAgreement().get('/contract-requests', {
      authorization: auth,
    });
  }

  // POST /evm-staff-agreement/contract-requests
  @Post('contract-requests')
  createRequest(
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
    if (!auth) throw new BadRequestException('Missing Authorization header');

    return this.serviceClients.evmStaffAgreement().post('/contract-requests', body, {
      authorization: auth,
    });
  }

  // POST /evm-staff-agreement/contract-requests/:id/approve-and-create-dealer
  @Post('contract-requests/:id/approve-and-create-dealer')
  approveAndCreateDealer(@Param('id') id: string, @Headers('authorization') auth: string) {
    if (!auth) throw new BadRequestException('Missing Authorization header');

    const numericId = Number(id);
    if (isNaN(numericId)) throw new BadRequestException('Invalid contract request ID');

    return this.serviceClients.evmStaffAgreement().post(
      `/contract-requests/${numericId}/approve-and-create-dealer`,
      {},
      {
        authorization: auth,
      },
    );
  }
}
