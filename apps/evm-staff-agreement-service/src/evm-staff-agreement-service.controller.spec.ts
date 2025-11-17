import { Test, TestingModule } from '@nestjs/testing';
import { ContractRequestController } from './evm-staff-agreement-service.controller';
import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';

describe('EvmStaffAgreementServiceController', () => {
  let controller: ContractRequestController;
  let service: EvmStaffAgreementServiceService;

  // Mock data giả lập
  const mockContractRequests = [
    {
      id: 1,
      dealer_name: 'Dealer 1',
      address: 'Address 1',
      phone: '123456789',
      email: 'dealer1@example.com',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const mockEvmStaffAgreementService = {
    getContractRequests: jest.fn().mockResolvedValue(mockContractRequests),
    createContractRequest: jest
      .fn()
      .mockImplementation((payload) => Promise.resolve({ id: 2, ...payload })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractRequestController],
      providers: [
        {
          provide: EvmStaffAgreementServiceService,
          useValue: mockEvmStaffAgreementService,
        },
      ],
    }).compile();

    controller = module.get<ContractRequestController>(ContractRequestController);
    service = module.get<EvmStaffAgreementServiceService>(EvmStaffAgreementServiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getContractRequests', () => {
    it('should return an array of contract requests', async () => {
      const result = await controller.getAllRequests();
      expect(result).toEqual(mockContractRequests);
      expect(service.getContractRequests).toHaveBeenCalled();
    });
  });

  describe('createContractRequest', () => {
    it('should create and return a contract request', async () => {
      const dto = {
        dealer_name: 'Dealer 2',
        address: 'Address 2',
        phone: '987654321',
        email: 'dealer2@example.com',
      };

      const result = await controller.createRequest(dto);
      expect(result).toEqual({ id: 2, ...dto });
      expect(service.createContractRequest).toHaveBeenCalledWith(dto);
    });
  });
});
