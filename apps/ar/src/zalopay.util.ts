import * as crypto from 'crypto';

export const nowMs = () => Date.now();

// yymmdd theo GMT+7 như tài liệu yêu cầu
export function yymmddVN(date = new Date()): string {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const yy = (vn.getUTCFullYear() % 100).toString().padStart(2, '0');
  const mm = (vn.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = vn.getUTCDate().toString().padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function zpMacCreate(
  key1: string,
  p: {
    app_id: number;
    app_trans_id: string;
    app_user: string;
    amount: number;
    app_time: number;
    embed_data: string;
    item: string;
  },
) {
  // KHÔNG có dấu | ở cuối
  const raw = `${p.app_id}|${p.app_trans_id}|${p.app_user}|${p.amount}|${p.app_time}|${p.embed_data}|${p.item}`;
  return crypto.createHmac('sha256', key1).update(raw).digest('hex');
}
// Verify callback = HMAC_SHA256(key2, data)
export function zpVerifyCallback(dataStr: string, mac: string, key2: string) {
  const calc = crypto.createHmac('sha256', key2).update(dataStr).digest('hex');
  return calc === mac;
}

// Query mac = HMAC_SHA256(key1, app_id|app_trans_id|key1)
export function zpMacQuery(key1: string, app_id: number, app_trans_id: string) {
  const raw = `${app_id}|${app_trans_id}|${key1}`;
  return crypto.createHmac('sha256', key1).update(raw).digest('hex');
}

// Refund mac (no fee) = HMAC_SHA256(key1, app_id|zp_trans_id|amount|description|timestamp)
export function zpMacRefund(
  key1: string,
  p: {
    app_id: number;
    zp_trans_id: string;
    amount: number;
    description: string;
    timestamp: number;
  },
) {
  const raw = `${p.app_id}|${p.zp_trans_id}|${p.amount}|${p.description}|${p.timestamp}`;
  return crypto.createHmac('sha256', key1).update(raw).digest('hex');
}
