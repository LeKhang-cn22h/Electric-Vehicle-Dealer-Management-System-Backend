export class Order {
  id: string;
  quotationId?: string;
  createdBy: string;

  totalAmount: number;

  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  paymentAmount: number;

  bank: string;
  term: number;
  downPayment: number;

  status: 'pending' | 'confirmed' | 'delivering' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  invoiceId?: string | null;
}
