export class Order {
  id: string;
  quotationId?: string;
  customerId: string;
  createdBy: string;
  items: any[];
  totalAmount: number;
  note?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
