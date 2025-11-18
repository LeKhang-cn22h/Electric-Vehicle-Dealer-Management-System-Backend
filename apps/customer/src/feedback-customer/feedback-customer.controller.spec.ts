import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackCustomerController } from './feedback-customer.controller';

describe('FeedbackCustomerController', () => {
  let controller: FeedbackCustomerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackCustomerController],
    }).compile();

    controller = module.get<FeedbackCustomerController>(FeedbackCustomerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
