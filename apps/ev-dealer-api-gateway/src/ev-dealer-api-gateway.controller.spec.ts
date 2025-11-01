import { Test, TestingModule } from '@nestjs/testing';
import { EvDealerApiGatewayController } from './ev-dealer-api-gateway.controller';
import { EvDealerApiGatewayService } from './ev-dealer-api-gateway.service';

describe('EvDealerApiGatewayController', () => {
  let evDealerApiGatewayController: EvDealerApiGatewayController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EvDealerApiGatewayController],
      providers: [EvDealerApiGatewayService],
    }).compile();

    evDealerApiGatewayController = app.get<EvDealerApiGatewayController>(EvDealerApiGatewayController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(evDealerApiGatewayController.getHello()).toBe('Hello World!');
    });
  });
});
