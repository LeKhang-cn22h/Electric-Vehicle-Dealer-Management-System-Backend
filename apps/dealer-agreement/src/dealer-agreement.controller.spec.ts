// src/dealer-agreement/dealer-agreement.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DealerAgreementController } from './dealer-agreement.controller';
import { DealerAgreementService } from './dealer-agreement.service';

describe('DealerAgreementController', () => {
  let controller: DealerAgreementController;
  let service: DealerAgreementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DealerAgreementController],
      providers: [
        {
          provide: DealerAgreementService,
          useValue: {
            createContractRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DealerAgreementController>(DealerAgreementController);
    service = module.get<DealerAgreementService>(DealerAgreementService);
  });

  describe('createContractRequest', () => {
    it('should call service and return success message', async () => {
      const dto = {
        dealer_name: 'Test Dealer',
        address: '123 Street',
        phone: '0123456789',
        email: 'test@dealer.com',
      };

      // mock service method
      (service.createContractRequest as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.createContractRequest(dto);

      expect(service.createContractRequest).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Yêu cầu hợp đồng đã được gửi thành công' });
    });
  });
});
