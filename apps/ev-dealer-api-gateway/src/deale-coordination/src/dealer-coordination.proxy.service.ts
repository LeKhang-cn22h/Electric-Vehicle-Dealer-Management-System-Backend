import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DealerCoordinationProxyService {
  private readonly baseUrl = process.env.DEALER_COORDINATION_URL || 'http://localhost:4001';

  constructor(private readonly httpService: HttpService) {}

  async forwardGet<T>(path: string): Promise<T> {
    const response: AxiosResponse<T> = await firstValueFrom(
      this.httpService.get<T>(`${this.baseUrl}${path}`),
    );
    return response.data;
  }

  async forwardPost<T>(path: string, body: any): Promise<T> {
    const response: AxiosResponse<T> = await firstValueFrom(
      this.httpService.post<T>(`${this.baseUrl}${path}`, body),
    );
    return response.data;
  }
}
