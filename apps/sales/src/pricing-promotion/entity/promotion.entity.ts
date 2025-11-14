export class Promotion {
  id: string;
  title: string;
  description?: string;
  discountPercent: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
