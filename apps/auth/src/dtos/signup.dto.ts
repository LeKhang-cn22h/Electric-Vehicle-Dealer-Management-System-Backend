import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsEmail() email!: string;
  @MinLength(6) password!: string;

  @IsIn(['admin', 'evm_staff', 'dealer_manager', 'dealer_staff', 'customer'])
  role!: 'admin' | 'evm_staff' | 'dealer_manager' | 'dealer_staff' | 'customer';

  @IsOptional() @IsString() username?: string;
  @IsOptional() @IsString() full_name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() dealer_id?: string;
}
