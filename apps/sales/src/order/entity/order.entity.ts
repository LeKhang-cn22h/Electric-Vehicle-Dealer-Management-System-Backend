export class Order {
  id: string;
  quotationId?: string;
  customerId: string;
  createdBy: string;

  items: any[];
  totalAmount: number;
  promotionCode?: string | null;
  discountAmount: number;
  note?: string;

  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  paymentAmount: number;

  status: 'pending' | 'confirmed' | 'delivering' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
