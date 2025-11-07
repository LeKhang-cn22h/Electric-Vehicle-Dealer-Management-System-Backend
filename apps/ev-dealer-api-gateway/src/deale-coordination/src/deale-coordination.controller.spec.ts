import { Test, TestingModule } from '@nestjs/testing';
import { DealeCoordinationController } from './deale-coordination.controller';
import { DealeCoordinationService } from './deale-coordination.service';

describe('DealeCoordinationController', () => {
  let dealeCoordinationController: DealeCoordinationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DealeCoordinationController],
      providers: [DealeCoordinationService],
    }).compile();

    dealeCoordinationController = app.get<DealeCoordinationController>(DealeCoordinationController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(dealeCoordinationController.getHello()).toBe('Hello World!');
    });
  });
});
