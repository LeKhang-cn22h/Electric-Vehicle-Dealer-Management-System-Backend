import axios from 'axios';

export class NiFiClient {
  private baseUrl = process.env.NIFI_API_URL || 'http://localhost:8080/api';

  async sendEvent(flow: string, payload: any) {
    try {
      await axios.post(`${this.baseUrl}/${flow}`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(`[NiFi] Event sent to flow "${flow}"`);
    } catch (err) {
      // FIX: Sử dụng type guard
      if (err instanceof Error) {
        console.error('[NiFi] Failed to send event:', err.message);
      } else {
        console.error('[NiFi] Failed to send event:', 'Unknown error occurred');
      }
    }
  }
}
