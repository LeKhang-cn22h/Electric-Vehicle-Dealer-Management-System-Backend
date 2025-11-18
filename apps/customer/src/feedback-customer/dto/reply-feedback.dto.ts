import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class ReplyFeedbackDto {
  @IsNumber()
  @IsNotEmpty()
  admin_id: number;

  @IsString()
  @IsNotEmpty()
  admin_reply: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
