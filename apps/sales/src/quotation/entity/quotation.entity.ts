export class Quotation {
  id: string;
  customerId: string;
  createdBy: string;
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
  totalAmount: number;
  note?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
