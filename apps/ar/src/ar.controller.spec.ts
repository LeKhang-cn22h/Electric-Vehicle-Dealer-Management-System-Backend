import { Test, TestingModule } from '@nestjs/testing';
import { ArController } from './ar.controller';
import { ArService } from './ar.service';

describe('ArController', () => {
  let arController: ArController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ArController],
      providers: [ArService],
    }).compile();

    arController = app.get<ArController>(ArController);
  });
});
