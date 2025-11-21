import { IsString, IsNotEmpty } from 'class-validator';

export class ReplyFeedbackDto {
  @IsString()
  @IsNotEmpty()
  reply: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
