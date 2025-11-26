import * as crypto from 'crypto';
import * as qs from 'qs';

// Hàm sắp xếp và encode (Dùng cho chiều TẠO URL thanh toán)
export function vnpaySortObject(obj: Record<string, any>) {
  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    // encodeURIComponent giữ nguyên các ký tự: A-Z a-z 0-9 - _ . ! ~ * ' ( )
    // VNPay yêu cầu replace %20 thành +
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
  });
  return sorted;
}

// Tạo URL thanh toán (Giữ nguyên logic cũ của bạn vì nó đang chạy ok)
export function makeVnpUrl(vnpBaseUrl: string, params: Record<string, any>, hashSecret: string) {
  const sorted = vnpaySortObject(params);
  const signData = qs.stringify(sorted, { encode: false });
  const vnp_SecureHash = crypto
    .createHmac('sha512', hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  const fullQuery = qs.stringify({ ...sorted, vnp_SecureHash }, { encode: false });
  return `${vnpBaseUrl}?${fullQuery}`;
}

export function buildVnpCreateParams(input: any) {
  // ... (Giữ nguyên code cũ của bạn đoạn này) ...
  // Copy lại đoạn buildVnpCreateParams từ code cũ của bạn vào đây
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
  if (input.ipnUrl) base['vnp_IpnUrl'] = input.ipnUrl;

  return base;
}

// Hàm Verify (Viết lại thủ công để debug chính xác)
export function verifyVnpReturn(query: Record<string, any>, secret: string) {
  let vnp_Params = { ...query };
  const secureHash = vnp_Params['vnp_SecureHash'];

  // Xóa 2 tham số này trước khi ký
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  // Sắp xếp key a-z
  const sortedKeys = Object.keys(vnp_Params).sort();

  // Tự build signData thủ công thay vì dùng qs
  // Để đảm bảo thứ tự và format chính xác tuyệt đối
  const signData = sortedKeys
    .map((key) => {
      // Lấy value (đảm bảo là string)
      const val = String(vnp_Params[key]);
      // Encode đúng chuẩn VNPay
      const encodedVal = encodeURIComponent(val).replace(/%20/g, '+');
      return `${key}=${encodedVal}`;
    })
    .join('&');

  // Tính toán hash
  const signed = crypto
    .createHmac('sha512', secret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  // --- LOG DEBUG QUAN TRỌNG ---
  // Xem log này ở Terminal để so sánh
  if (secureHash !== signed) {
    console.log('--- VNPAY VERIFY FAILURE ---');
    console.log('1. Received Query:', JSON.stringify(query));
    console.log('2. String to Sign:', signData);
    console.log('3. My Hash       :', signed);
    console.log('4. VNP Hash      :', secureHash);
    console.log('5. Secret Length :', secret.length);
    console.log('----------------------------');
  }

  return secureHash === signed;
}
