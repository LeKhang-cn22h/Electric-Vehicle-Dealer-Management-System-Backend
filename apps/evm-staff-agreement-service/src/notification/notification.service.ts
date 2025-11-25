// apps/evm-staff-agreement-service/src/notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
    this.initializeSupabase();
  }

  private initializeFirebase() {
    try {
      if (admin.apps.length === 0) {
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

        if (!projectId || !privateKey || !clientEmail) {
          this.logger.warn('⚠️ Firebase credentials not found, FCM notifications disabled');
          return;
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replace(/\\n/g, '\n'),
            clientEmail,
          }),
        });

        this.logger.log('✅ Firebase Admin SDK initialized');
      }
    } catch (error) {
      this.logger.error('❌ Firebase initialization failed:', error);
    }
  }

  private initializeSupabase() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('✅ Supabase initialized');
  }

  /**
   * ✅ GỬI NOTIFICATION TRỰC TIẾP bằng FCM token
   */
  async sendDirectly(fcmToken: string, title: string, body: string, data?: Record<string, any>) {
    try {
      if (admin.apps.length === 0) {
        this.logger.warn('⚠️ Firebase not initialized, skipping notification');
        return { success: false, message: 'Firebase not configured' };
      }

      this.logger.log(`📤 Sending notification to token: ${fcmToken.substring(0, 30)}...`);

      // Convert data to strings (FCM requirement)
      const stringData: Record<string, string> = {};
      if (data) {
        Object.keys(data).forEach((key) => {
          stringData[key] = String(data[key]);
        });
      }

      // Prepare FCM message
      const message: admin.messaging.Message = {
        notification: { title, body },
        data: stringData,
        token: fcmToken,
      };

      this.logger.log(`📤 Sending FCM message...`);

      // Send via Firebase
      const response = await admin.messaging().send(message);

      this.logger.log(`✅ Notification sent! MessageId: ${response}`);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      this.logger.error('❌ Error sending notification:', error);
      this.logger.error('Error code:', error.code);
      this.logger.error('Error message:', error.message);

      return {
        success: false,
        error: error.message,
        errorCode: error.code,
      };
    }
  }
}
