import { Test, TestingModule } from '@nestjs/testing';
import { EvmStaffCoordinationService } from './evm-staff-coordination.service';

describe('EvmStaffCoordinationService', () => {
  let service: EvmStaffCoordinationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EvmStaffCoordinationService],
    }).compile();

    service = module.get<EvmStaffCoordinationService>(EvmStaffCoordinationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
