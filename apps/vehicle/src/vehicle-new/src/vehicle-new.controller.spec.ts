import { Test, TestingModule } from '@nestjs/testing';
import { vehicleNewController } from './vehicle-new.controller';
import { vehicleNewService } from './vehicle-new.service';

describe('vehicleNewController', () => {
  let controller: vehicleNewController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [vehicleNewController],
      providers: [vehicleNewService],
    }).compile();

    controller = app.get<vehicleNewController>(vehicleNewController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(controller.findAll()).toBe('Hello World!');
    });
  });
});
