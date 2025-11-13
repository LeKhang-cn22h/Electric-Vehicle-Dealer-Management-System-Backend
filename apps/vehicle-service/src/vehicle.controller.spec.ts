import { Test, TestingModule } from '@nestjs/testing';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';

describe('AppController', () => {
  let appController: VehicleController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [VehicleController],
      providers: [VehicleService],
    }).compile();

    appController = app.get<VehicleController>(VehicleController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
