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
}

@Injectable()
export class ServiceClients {
  constructor(private readonly http: HttpService) {}

  private base(url: string): ServiceClient {
    return {
      get: <T = any>(p: string, h?: Headers) =>
        this.http.axiosRef.get<T>(url + p, { headers: h }).then((r: AxiosResponse<T>) => r.data),
      post: <T = any>(p: string, b: any, h?: Headers) =>
        this.http.axiosRef
          .post<T>(url + p, b, { headers: h })
          .then((r: AxiosResponse<T>) => r.data),
      put: <T = any>(p: string, b: any, h?: Headers) =>
        this.http.axiosRef.put<T>(url + p, b, { headers: h }).then((r: AxiosResponse<T>) => r.data),
      patch: <T = any>(p: string, b: any, h?: Headers) =>
        this.http.axiosRef
          .patch<T>(url + p, b, { headers: h })
          .then((r: AxiosResponse<T>) => r.data),
      delete: <T = any>(p: string, h?: Headers) =>
        this.http.axiosRef.delete<T>(url + p, { headers: h }).then((r: AxiosResponse<T>) => r.data),
    };
  }

  auth(): ServiceClient {
    const url = process.env.AUTH_URL || 'http://localhost:4100';
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
}
