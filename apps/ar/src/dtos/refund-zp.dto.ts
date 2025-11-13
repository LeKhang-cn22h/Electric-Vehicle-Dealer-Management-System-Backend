import { IsNumber, IsOptional, IsString } from 'class-validator';

export class RefundZpDto {
  @IsString() zp_trans_id!: string; // từ callback hoặc query
  @IsNumber() amount!: number; // VND (long)
  @IsString() description!: string; // lý do hoàn tiền
  @IsOptional() @IsString() m_refund_id?: string; // nếu không gửi, svc sẽ tự gen yymmdd_appid_xxx
}
