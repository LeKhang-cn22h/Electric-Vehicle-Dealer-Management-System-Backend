export class Promotion {
  id: string;
  code: string;
  description?: string;

  discountType: 'percent' | 'amount';
  discountValue: number;

  minOrderValue?: number;
  minQuantity?: number;

  startDate: Date;
  endDate?: Date;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
