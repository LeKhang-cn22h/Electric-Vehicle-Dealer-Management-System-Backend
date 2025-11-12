import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';

type Headers = Record<string, string | undefined>;

interface ServiceClient {
  get: <T = any>(path: string, headers?: Headers) => Promise<T>;
  post: <T = any>(path: string, body: any, headers?: Headers) => Promise<T>;
  put: <T = any>(path: string, body: any, headers?: Headers) => Promise<T>;
  patch: <T = any>(path: string, body: any, headers?: Headers) => Promise<T>;
  delete: <T = any>(path: string, headers?: Headers) => Promise<T>;
  rawRequest: (config: {
    method: string;
    url: string;
    headers: any;
    data?: any;
  }) => Promise<AxiosResponse>;
}

@Injectable()
export class ServiceClients {
  constructor(private readonly http: HttpService) {}

  private base(url: string): ServiceClient {
    return {
      get: <T = any>(p: string, h?: Headers) =>
        this.http.axiosRef
          .get<T>(url + p, {
            headers: this.cleanHeaders(h),
          })
          .then((r: AxiosResponse<T>) => r.data),

      post: <T = any>(p: string, b: any, h?: Headers) =>
        this.http.axiosRef
          .post<T>(url + p, b, {
            headers: this.cleanHeaders(h),
          })
          .then((r: AxiosResponse<T>) => r.data),

      put: <T = any>(p: string, b: any, h?: Headers) =>
        this.http.axiosRef
          .put<T>(url + p, b, {
            headers: this.cleanHeaders(h),
          })
          .then((r: AxiosResponse<T>) => r.data),

      patch: <T = any>(p: string, b: any, h?: Headers) =>
        this.http.axiosRef
          .patch<T>(url + p, b, {
            headers: this.cleanHeaders(h),
          })
          .then((r: AxiosResponse<T>) => r.data),

      delete: <T = any>(p: string, h?: Headers) =>
        this.http.axiosRef
          .delete<T>(url + p, {
            headers: this.cleanHeaders(h),
          })
          .then((r: AxiosResponse<T>) => r.data),

      rawRequest: (config) => {
        console.log('[ServiceClients] Raw request:', {
          method: config.method,
          url: url + config.url,
          hasData: !!config.data,
          headers: Object.keys(config.headers || {}),
        });

        return this.http.axiosRef.request({
          ...config,
          url: url + config.url,
          headers: config.headers,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
      },
    };
  }

  private cleanHeaders(headers?: Headers): Record<string, string> {
    if (!headers) return {};

    const cleaned: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        const normalizedKey = key.toLowerCase();
        cleaned[normalizedKey] = value;
      }
    }

    return cleaned;
  }

  //docker
  // auth(): ServiceClient {
  //   const url = process.env.AUTH_SERVICE_URL || 'http://auth:4100';
  //   return this.base(url);
  // }

  // users(): ServiceClient {
  //   const url = process.env.USERS_SERVICE_URL || 'http://users:4200';
  //   return this.base(url);
  // }

  auth(): ServiceClient {
    const url = process.env.AUTH_URL || 'http://localhost:4100';
    return this.base(url);
  }
  users(): ServiceClient {
    const url = process.env.USERS_SERVICE_URL || 'http://localhost:4200';
    return this.base(url);
  }

  evmCoordination(): ServiceClient {
    const url = process.env.EVM_COORDINATION_SERVICE_URL || 'http://localhost:3002';
    return this.base(url);
  }

  dealerCoordination(): ServiceClient {
    const url = process.env.DEALER_COORDINATION_SERVICE_URL || 'http://localhost:3001';
    return this.base(url);
  }
  billing(): ServiceClient {
    const url = process.env.BILLING_SERVICE_URL || 'http://localhost:4300';
    return this.base(url);
  }
  vehicle(): ServiceClient {
    const url = process.env.VEHICLE_SERVICE_URL || 'http://localhost:4001';
    return this.base(url);
  }

  customer(): ServiceClient {
    const url = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:4400';
    return this.base(url);
  }
}
