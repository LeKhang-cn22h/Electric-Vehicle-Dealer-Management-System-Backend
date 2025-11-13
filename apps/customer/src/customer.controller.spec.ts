import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customer.controller';
import { CustomersService } from './customer.service';

describe('CustomersController', () => {
  let customersController: CustomersController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [CustomersService],
    }).compile();

    customersController = app.get<CustomersController>(CustomersController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(customersController.findAll()).toBe('Hello World!');
    });
  });
});
