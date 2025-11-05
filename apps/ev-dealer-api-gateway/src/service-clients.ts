import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

type H = Record<string, string | undefined>;

@Injectable()
export class ServiceClients {
  constructor(private http: HttpService) {}
  private base(url: string) {
    return {
      get: (p: string, h?: H) =>
        this.http.axiosRef.get(url + p, { headers: h }).then((r) => r.data),
      post: (p: string, b: any, h?: H) =>
        this.http.axiosRef.post(url + p, b, { headers: h }).then((r) => r.data),
      put: (p: string, b: any, h?: H) =>
        this.http.axiosRef.put(url + p, b, { headers: h }).then((r) => r.data),
      del: (p: string, h?: H) =>
        this.http.axiosRef.delete(url + p, { headers: h }).then((r) => r.data),
    };
  }
  auth() {
    return this.base(process.env.AUTH_URL!);
  }
}
