import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { ChangePasswordDto } from './dtos/change-password.dto';

function createAnon(): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}
function createAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL!;
  const srole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return srole ? createClient(url, srole) : null;
}
type SignupDto = {
  email: string;
  password: string;
  role?: 'customer' | 'dealer_staff' | 'dealer_manager' | 'evm_staff' | 'admin';
  username?: string;
  phone?: string;
  full_name?: string;
  dealer_id?: string;
};
@Injectable()
export class AuthService {
  private sb = createAnon();
  private admin = createAdmin();

  async health() {
    return { ok: true };
  }

  private readonly logger = new Logger(AuthService.name);
  constructor(private readonly supabase: SupabaseService) {}

  async signup(dto: SignupDto) {
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const metadata: Record<string, string> = {};

    if (
      dto.role &&
      ['admin', 'evm_staff', 'dealer_manager', 'dealer_staff', 'customer'].includes(dto.role)
    ) {
      metadata.role = dto.role;
    }

    if (dto.username) metadata.username = dto.username;
    if (dto.phone) metadata.phone = dto.phone;
    if (dto.full_name) metadata.full_name = dto.full_name;
    metadata.dealer_id = dto.dealer_id || '';

    const { error, data } = await this.supabase.client.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: { data: metadata },
    });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async signupAdmin(dto: { email: string; password: string; fullName?: string }) {
    if (!this.admin) throw new BadRequestException('No SERVICE_ROLE_KEY on server');
    const { data, error } = await this.admin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { full_name: dto.fullName ?? '' },
    });
    if (error) throw new BadRequestException(error.message);
    return { user: data.user, requires_confirm: false };
  }

  async login(dto: { email: string; password: string }) {
    const { data, error } = await this.sb.auth.signInWithPassword(dto);
    if (error) throw new BadRequestException(error.message);
    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: data.session?.user,
    };
  }

  async me(token: string) {
    const { data: userData, error: tokenError } = await this.sb.auth.getUser(token);
    if (tokenError || !userData.user) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    if (this.admin) {
      const { data: fullUser, error: adminError } = await this.admin.auth.admin.getUserById(
        userData.user.id,
      );
      if (adminError) {
        throw new BadRequestException(adminError.message);
      }
      return fullUser.user;
    }
    return userData.user;
  }

  async refresh(refresh_token: string) {
    const { data, error } = await this.sb.auth.refreshSession({
      refresh_token,
    });
    if (error) throw new BadRequestException(error.message);
    return data.session;
  }

  async resend(email: string) {
    const { data, error } = await this.sb.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw new BadRequestException(error.message);
    return { sent: true, data };
  }

  async changePassword(token: string, dto: ChangePasswordDto) {
    const { data: userData, error: userError } = await this.sb.auth.getUser(token);
    if (userError || !userData.user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await this.sb.auth.signInWithPassword({
      email: userData.user.email!,
      password: dto.currentPassword,
    });

    if (signInError) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    // Update password using admin client
    if (!this.admin) {
      throw new BadRequestException('Cannot change password: no admin access');
    }

    const { error: updateError } = await this.admin.auth.admin.updateUserById(userData.user.id, {
      password: dto.newPassword,
    });

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    return {
      success: true,
      message: 'Đổi mật khẩu thành công',
    };
  }

  async forgotPassword(email: string) {
    const { error } = await this.sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL}/auth/reset-password`,
    });
    if (error) throw new BadRequestException(error.message);
    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(accessToken: string, newPassword: string) {
    if (!this.admin) throw new BadRequestException('No SERVICE_ROLE_KEY on server');
    if (!accessToken) throw new BadRequestException('Missing access token');
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    const parts = accessToken.split('.');
    if (parts.length !== 3) throw new BadRequestException('Malformed token');

    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid token payload');
    }

    const userId: string | undefined = payload?.sub;
    const exp: number | undefined = payload?.exp;
    const iss: string | undefined = payload?.iss;
    this.logger.debug({ iss, sub: userId, exp });

    if (!userId) throw new BadRequestException('Token missing subject');
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof exp === 'number' && exp < nowSec) {
      throw new UnauthorizedException('Reset link has expired');
    }
    const expectedIssuerPrefix = `${process.env.SUPABASE_URL?.replace(/\/+$/, '')}/auth/v1`;
    if (iss && expectedIssuerPrefix && !iss.startsWith(expectedIssuerPrefix)) {
      throw new UnauthorizedException('Token does not belong to this project');
    }
    const { error: updateError } = await this.admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) throw new BadRequestException(updateError.message);

    return { success: true, message: 'Password reset successfully', userId };
  }
}
