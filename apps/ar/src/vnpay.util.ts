import * as crypto from 'crypto';
import * as qs from 'qs';

export function vnpaySortObject(obj: Record<string, any>) {
  const sorted: Record<string, any> = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      sorted[k] = obj[k];
    });
  return sorted;
}

export function vnpaySign(params: Record<string, any>, secret: string) {
  const sorted = vnpaySortObject(params);
  const signData = qs.stringify(sorted, { encode: true });
  return crypto.createHmac('sha512', secret).update(signData, 'utf-8').digest('hex');
}

export function buildVnpCreateParams(input: {
  tmnCode: string;
  amountVnd: number; // VND
  orderId: string;
  orderInfo: string;
  returnUrl: string;
  ipnUrl?: string;
  locale?: 'vn' | 'en';
  bankCode?: string;
  clientIp: string;
}) {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = now.getFullYear();
  const M = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  const vnp_CreateDate = `${y}${M}${d}${h}${m}${s}`;

  const base: Record<string, any> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: input.tmnCode,
    vnp_Amount: Math.round(input.amountVnd * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: input.orderId,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: 'other',
    vnp_Locale: input.locale ?? 'vn',
    vnp_ReturnUrl: input.returnUrl,
    vnp_IpAddr: input.clientIp,
    vnp_CreateDate,
  };
  if (input.bankCode) base['vnp_BankCode'] = input.bankCode;
  if (input.ipnUrl) base['vnp_Url'] = input.ipnUrl;

  return vnpaySortObject(base);
}

export function makeVnpUrl(vnpBaseUrl: string, params: Record<string, any>, hashSecret: string) {
  const vnp_SecureHash = vnpaySign(params, hashSecret);
  const fullQuery = qs.stringify({ ...params, vnp_SecureHash }, { encode: true });
  return `${vnpBaseUrl}?${fullQuery}`;
}

// Verify callback/IPN
export function verifyVnpReturn(query: Record<string, any>, secret: string) {
  const receivedHash = (query['vnp_SecureHash'] || '').toString().toLowerCase();
  const toSign = { ...query };
  delete toSign['vnp_SecureHash'];
  delete toSign['vnp_SecureHashType'];
  const calc = vnpaySign(toSign, secret).toLowerCase();
  return receivedHash === calc;
}
