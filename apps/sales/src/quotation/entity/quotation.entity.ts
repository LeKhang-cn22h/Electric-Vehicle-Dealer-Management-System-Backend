import { QuotationItem } from './quotation-item.entity';

export class Quotation {
  id: string;
  customerId: string;
  createdBy: string;
  items: QuotationItem[];
  totalAmount: number;
  promotionCode?: string | null;
  discountAmount: number;
  note?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
