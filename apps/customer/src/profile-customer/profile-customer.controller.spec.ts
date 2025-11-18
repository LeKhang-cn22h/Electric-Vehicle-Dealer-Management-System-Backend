import { Test, TestingModule } from '@nestjs/testing';
import { ProfileCustomerController } from './profile-customer.controller';

describe('ProfileCustomerController', () => {
  let controller: ProfileCustomerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileCustomerController],
    }).compile();

    controller = module.get<ProfileCustomerController>(ProfileCustomerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
