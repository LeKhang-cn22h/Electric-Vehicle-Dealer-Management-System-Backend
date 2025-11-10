import { Body, Controller, Post } from '@nestjs/common';
import { ServiceClients } from '../service-clients';
import { Get } from '@nestjs/common';

@Controller('auth')
export class GatewayAuthController {
  constructor(private readonly c: ServiceClients) {}

  @Get('health')
  health() {
    return this.c.auth().get('/auth/health');
  }

  @Post('signup')
  signup(@Body() b: any) {
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
  @Post('change-password')
  changePassword(@Body() b: any) {
    return this.c.auth().post('/auth/change-password', b);
  }
  @Post('forgot-password')
  forgotPassword(@Body() b: any) {
    return this.c.auth().post('/auth/forgot-password', b);
  }
  @Post('reset-password')
  resetPassword(@Body() b: any) {
    return this.c.auth().post('/auth/reset-password', b);
  }
}
