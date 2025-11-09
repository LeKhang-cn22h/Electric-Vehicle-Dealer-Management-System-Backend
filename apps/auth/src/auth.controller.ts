import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { BadRequestException } from '@nestjs/common';
import { ChangePasswordDto } from './dtos/change-password.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return { status: 'ok', ts: new Date().toISOString() };
  }

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('me')
  me(@Body('accessToken') token: string) {
    return this.authService.me(token);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') rt: string) {
    return this.authService.refresh(rt);
  }

  @Post('resend-confirm')
  resend(@Body('email') email: string) {
    return this.authService.resend(email);
  }
  @Post('change-password')
  async changePassword(@Body('token') token: string, @Body() body: ChangePasswordDto) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Current password and new password are required');
    }
    return this.authService.changePassword(token, body);
  }
}
