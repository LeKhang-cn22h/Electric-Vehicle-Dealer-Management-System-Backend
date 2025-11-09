import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

function createAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL!;
  const srole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return srole ? createClient(url, srole) : null;
}

function createAnon(): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

export class UpdateProfileDto {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

@Injectable()
export class UsersService {
  private admin = createAdmin();
  private sb = createAnon();

  async updateProfile(token: string, dto: UpdateProfileDto) {
    // Verify token and get user
    const { data: userData, error: userError } = await this.sb.auth.getUser(token);

    if (userError || !userData.user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!this.admin) {
      throw new BadRequestException('Cannot update profile: no admin access');
    }

    // Update user metadata
    const { data, error } = await this.admin.auth.admin.updateUserById(userData.user.id, {
      user_metadata: {
        ...userData.user.user_metadata,
        full_name: dto.full_name,
        phone: dto.phone,
        avatar_url: dto.avatar_url,
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      user: data.user,
    };
  }

  async getProfile(token: string) {
    const { data, error } = await this.sb.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token');
    }

    return data.user;
  }
}
