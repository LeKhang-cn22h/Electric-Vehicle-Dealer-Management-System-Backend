import { Test, TestingModule } from '@nestjs/testing';
import { CommissionController } from './commission.controller';
import { CommissionService } from './commission.service';

describe('CommissionController', () => {
  let commissionController: CommissionController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CommissionController],
      providers: [CommissionService],
    }).compile();

    commissionController = app.get<CommissionController>(CommissionController);
  });
});
