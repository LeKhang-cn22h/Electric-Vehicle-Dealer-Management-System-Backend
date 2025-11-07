import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DealerCoordinationController } from './deale-coordination.controller';
import { DealerCoordinationProxyService } from './dealer-coordination.proxy.service';

@Module({
  imports: [HttpModule],
  controllers: [DealerCoordinationController],
  providers: [DealerCoordinationProxyService],
})
export class DealerCoordinationModule {}
