import { Controller, Get, Post, Body } from '@nestjs/common';
import { DealerCoordinationProxyService } from './dealer-coordination.proxy.service';
import { DealerRequest } from './dealer-coordination.types';

@Controller('dealer-coordination')
export class DealerCoordinationController {
  constructor(private readonly proxyService: DealerCoordinationProxyService) {}

  @Get('requests')
  async getAllRequests(): Promise<DealerRequest[]> {
    return this.proxyService.forwardGet<DealerRequest[]>('/requests');
  }

  @Post('requests')
  async createRequest(
    @Body() body: Omit<DealerRequest, 'id' | 'created_at'>,
  ): Promise<DealerRequest> {
    return this.proxyService.forwardPost<DealerRequest>('/requests', body);
  }
}
