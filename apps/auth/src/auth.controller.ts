import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }
  // authService: any;
  // constructor(private readonly svc: AuthService) {}

  // @Get('health')
  // health() {
  //   return { ok: true };
  // }

  // @Post('signup')
  // async signup(@Body() body: any) {
  //   return this.authService.signUp(body);
  // }
  // @Post('signup-admin') signupAdmin(
  //   @Body() b: { email: string; password: string; fullName?: string },
  // ) {
  //   return this.svc.signupAdmin(b);
  // }
  // @Post('login') login(@Body() b: { email: string; password: string }) {
  //   return this.svc.login(b);
  // }
  // @Post('me') me(@Body('access_token') t: string) {
  //   return this.svc.me(t);
  // }
  // @Post('refresh') refresh(@Body('refresh_token') rt: string) {
  //   return this.svc.refresh(rt);
  // }
  // @Post('resend-confirm') resend(@Body('email') email: string) {
  //   return this.svc.resend(email);
  // }
}
