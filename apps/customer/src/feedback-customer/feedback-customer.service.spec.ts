import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackCustomerService } from './feedback-customer.service';

describe('FeedbackCustomerService', () => {
  let service: FeedbackCustomerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedbackCustomerService],
    }).compile();

    service = module.get<FeedbackCustomerService>(FeedbackCustomerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
