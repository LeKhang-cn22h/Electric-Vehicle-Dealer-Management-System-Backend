export class Promotion {
  id: string;
  code: string;
  description?: string;

  discountType: 'percent' | 'amount';
  discountValue: number;

  minOrderValue?: number;
  minQuantity?: number;

  startDate: Date;
  endDate: Date | null;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
