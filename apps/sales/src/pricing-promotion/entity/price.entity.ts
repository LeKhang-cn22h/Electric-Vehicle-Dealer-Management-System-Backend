export class Price {
  id: string;
  productId: string;
  basePrice: number;
  discountedPrice: number;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
