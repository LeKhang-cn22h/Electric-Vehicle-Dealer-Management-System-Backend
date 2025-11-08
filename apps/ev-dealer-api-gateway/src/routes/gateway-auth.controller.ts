import { Body, Controller, Post } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('auth')
export class GatewayAuthController {
  constructor(private c: ServiceClients) {}
  @Post('signup') signup(@Body() b: any) {
    return this.c.auth().post('/auth/signup', b);
  }
  @Post('signup-admin') signupAdmin(@Body() b: any) {
    return this.c.auth().post('/auth/signup-admin', b);
  }
  @Post('login') login(@Body() b: any) {
    return this.c.auth().post('/auth/login', b);
  }
  @Post('me') me(@Body() b: any) {
    return this.c.auth().post('/auth/me', b);
  }
  @Post('refresh') refresh(@Body() b: any) {
    return this.c.auth().post('/auth/refresh', b);
  }
  @Post('resend-confirm') resend(@Body() b: any) {
    return this.c.auth().post('/auth/resend-confirm', b);
  }
}
