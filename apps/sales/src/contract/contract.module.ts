import { Module } from '@nestjs/common';
import { ContractsController } from './contract.controller';
import { ContractsService } from './contract.service';

@Module({
  // imports: [],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractModule {}
