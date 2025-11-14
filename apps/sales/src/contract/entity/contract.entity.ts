export class Contract {
  id: string;
  contractNumber: string;
  dealerId: string;
  description?: string;
  contractValue: number;
  startDate: Date;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
