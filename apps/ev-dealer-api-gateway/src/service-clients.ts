// import { Injectable } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';

// type H = Record<string, string | undefined>;

// @Injectable()
// export class ServiceClients {
//   constructor(private http: HttpService) {}
//   private base(url: string) {
//     return {
//       get: (p: string, h?: H) =>
//         this.http.axiosRef.get(url + p, { headers: h }).then((r) => r.data),
//       post: (p: string, b: any, h?: H) =>
//         this.http.axiosRef.post(url + p, b, { headers: h }).then((r) => r.data),
//       put: (p: string, b: any, h?: H) =>
//         this.http.axiosRef.put(url + p, b, { headers: h }).then((r) => r.data),
//       del: (p: string, h?: H) =>
//         this.http.axiosRef.delete(url + p, { headers: h }).then((r) => r.data),
//     };
//   }
//   auth() {
//     return this.base(process.env.AUTH_URL!);
//   }
// }
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
      get: <T = any>(path: string, headers?: Headers): Promise<T> =>
        this.http.axiosRef.get<T>(url + path, { headers }).then((r: AxiosResponse<T>) => r.data),

      post: <T = any>(path: string, body: any, headers?: Headers): Promise<T> =>
        this.http.axiosRef
          .post<T>(url + path, body, { headers })
          .then((r: AxiosResponse<T>) => r.data),

      put: <T = any>(path: string, body: any, headers?: Headers): Promise<T> =>
        this.http.axiosRef
          .put<T>(url + path, body, { headers })
          .then((r: AxiosResponse<T>) => r.data),

      patch: <T = any>(path: string, body: any, headers?: Headers): Promise<T> =>
        this.http.axiosRef
          .patch<T>(url + path, body, { headers })
          .then((r: AxiosResponse<T>) => r.data),

      delete: <T = any>(path: string, headers?: Headers): Promise<T> =>
        this.http.axiosRef.delete<T>(url + path, { headers }).then((r: AxiosResponse<T>) => r.data),
    };
  }

  evmCoordination(): ServiceClient {
    const evmUrl = process.env.EVM_COORDINATION_SERVICE_URL || 'http://localhost:3002';
    return this.base(evmUrl);
  }

  dealerCoordination(): ServiceClient {
    const dealerUrl = process.env.DEALER_COORDINATION_SERVICE_URL || 'http://localhost:3001';
    return this.base(dealerUrl);
  }
}
