import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  email: string;
  password: string;
  role?: 'admin' | 'evm_staff' | 'dealer_manager' | 'dealer_staff' | 'customer';
  username?: string;
  full_name?: string;
  phone?: string;
  dealer_id?: string;
}
