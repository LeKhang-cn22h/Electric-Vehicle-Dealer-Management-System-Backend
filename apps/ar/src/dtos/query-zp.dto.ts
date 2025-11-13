import { IsString } from 'class-validator';

export class QueryZpDto {
  @IsString() app_trans_id!: string; // yymmdd_<invoiceId>
}
