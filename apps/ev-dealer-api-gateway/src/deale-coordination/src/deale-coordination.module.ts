import { Module } from '@nestjs/common';
import { DealeCoordinationController } from './deale-coordination.controller';
import { DealeCoordinationService } from './deale-coordination.service';

@Module({
  imports: [],
  controllers: [DealeCoordinationController],
  providers: [DealeCoordinationService],
})
export class DealeCoordinationModule {}
