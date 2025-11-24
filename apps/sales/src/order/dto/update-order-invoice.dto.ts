import { IsUUID } from 'class-validator';

export class UpdateOrderInvoiceDto {
  @IsUUID()
  invoiceId: string;
}
