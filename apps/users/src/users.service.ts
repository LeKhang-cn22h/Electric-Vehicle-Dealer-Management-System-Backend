import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';

const envPath = path.resolve(process.cwd(), 'apps/users/.env');
dotenv.config({ path: envPath });

function createAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL!;
  const srole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return srole ? createClient(url, srole) : null;
}

// function createAnon(): SupabaseClient {
//   const url = process.env.SUPABASE_URL!;
//   const anon = process.env.SUPABASE_ANON_KEY!;
//   return createClient(url, anon);
// }
function createAnon() {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

@Injectable()
export class UsersService {
  private admin = createAdmin();
  private sb = createAnon();

  async updateProfile(token: string, dto: UpdateProfileDto, avatar?: Express.Multer.File) {
    console.log('[UsersService] updateProfile called:', {
      hasAvatar: !!avatar,
      avatarSize: avatar?.size,
      avatarMimetype: avatar?.mimetype,
      dto,
    });

    // Verify token và lấy user info
    const { data: userData, error: userError } = await this.sb.auth.getUser(token);
    if (userError || !userData.user) {
      console.error('[UsersService] Token verification failed:', userError);
      throw new UnauthorizedException('Invalid token');
    }

    const userId = userData.user.id;
    let avatar_url = userData.user.user_metadata.avatar_url || '';

    console.log('[UsersService] User verified:', {
      userId,
      currentAvatar: avatar_url,
    });

    if (!this.admin) {
      throw new BadRequestException('Admin Supabase client not configured');
    }
    if (avatar) {
      console.log('[UsersService] Processing avatar upload...');

      try {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(avatar.mimetype)) {
          throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
        }
        const maxSize = 5 * 1024 * 1024;
        if (avatar.size > maxSize) {
          throw new BadRequestException('File size too large. Maximum size is 5MB.');
        }
        const fileExt = avatar.mimetype.split('/')[1];
        const timestamp = Date.now();
        const fileName = `${userId}_${timestamp}.${fileExt}`;

        console.log('[UsersService] Uploading to bucket: avatars, file:', fileName);
        if (avatar_url && avatar_url.includes('/avatars/')) {
          const urlParts = avatar_url.split('/avatars/');
          if (urlParts[1]) {
            const oldFileName = urlParts[1].split('?')[0];
            console.log('[UsersService] Removing old avatar:', oldFileName);
            try {
              await this.admin.storage.from('avatars').remove([oldFileName]);
            } catch (err) {
              console.warn('[UsersService] Failed to remove old avatar:', err.message);
            }
          }
        }
        const { data: uploadData, error: uploadErr } = await this.admin.storage
          .from('avatars')
          .upload(fileName, avatar.buffer, {
            contentType: avatar.mimetype,
            upsert: true,
            cacheControl: '3600',
          });

        if (uploadErr) {
          console.error('[UsersService] Upload error:', uploadErr);
          throw new BadRequestException('Upload avatar failed: ' + uploadErr.message);
        }

        console.log('[UsersService] Upload successful:', uploadData);
        const { data: urlData } = this.admin.storage.from('avatars').getPublicUrl(fileName);

        avatar_url = urlData.publicUrl;
        console.log('[UsersService] New avatar URL:', avatar_url);
      } catch (error) {
        console.error('[UsersService] Avatar upload failed:', error);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Failed to upload avatar: ' + error.message);
      }
    }
    const { error: updateError } = await this.admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userData.user.user_metadata,
        full_name: dto.full_name || userData.user.user_metadata.full_name,
        phone: dto.phone || userData.user.user_metadata.phone,
        avatar_url,
      },
    });

    if (updateError) {
      throw new BadRequestException('Update profile failed: ' + updateError.message);
    }

    return {
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: {
        full_name: dto.full_name || userData.user.user_metadata.full_name,
        phone: dto.phone || userData.user.user_metadata.phone,
        avatar_url,
      },
    };
  }

  async getProfile(token: string) {
    const { data, error } = await this.sb.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata.full_name,
      phone: data.user.user_metadata.phone,
      avatar_url: data.user.user_metadata.avatar_url,
      created_at: data.user.created_at,
    };
  }
}
