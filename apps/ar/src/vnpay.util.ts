import * as crypto from 'crypto';
import * as qs from 'qs';

// sort + encode giống đúng demo VNPay
export function vnpaySortObject(obj: Record<string, any>) {
  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();

  keys.forEach((key) => {
    // encode value, đổi %20 => +
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
  });

  return sorted;
}

export function vnpaySign(params: Record<string, any>, secret: string) {
  // luôn sort + encode trước khi ký
  const sorted = vnpaySortObject(params);
  const signData = qs.stringify(sorted, { encode: false });

  console.log('VNPAY signData =', signData);

  return crypto.createHmac('sha512', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');
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
  if (input.ipnUrl) base['vnp_IpnUrl'] = input.ipnUrl; // đúng tên param

  return base; // trả về raw
}

export function makeVnpUrl(vnpBaseUrl: string, params: Record<string, any>, hashSecret: string) {
  // sort + encode
  const sorted = vnpaySortObject(params);
  const signData = qs.stringify(sorted, { encode: false });

  const vnp_SecureHash = crypto
    .createHmac('sha512', hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  const fullQuery = qs.stringify(
    {
      ...sorted,
      vnp_SecureHash,
    },
    { encode: false }, // vì value đã encode rồi
  );

  return `${vnpBaseUrl}?${fullQuery}`;
}

// Verify callback/IPN
export function verifyVnpReturn(query: Record<string, any>, secret: string) {
  const receivedHash = (query['vnp_SecureHash'] || '').toString().toLowerCase();
  const toSign = { ...query };
  delete toSign['vnp_SecureHash'];
  delete toSign['vnp_SecureHashType'];

  const sorted = vnpaySortObject(toSign);
  const signData = qs.stringify(sorted, { encode: false });

  const calc = crypto
    .createHmac('sha512', secret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex')
    .toLowerCase();

  return receivedHash === calc;
}
