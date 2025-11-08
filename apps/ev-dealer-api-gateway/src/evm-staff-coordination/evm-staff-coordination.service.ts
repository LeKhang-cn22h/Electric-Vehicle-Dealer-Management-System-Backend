import { Injectable } from '@nestjs/common';
import { ServiceClients } from '../service-clients';
import {
  VehicleAssignment,
  AvailableVehicle,
  TrackingInfo,
  // ApiResponse, // Xóa vì không sử dụng
} from './interfaces/evm-coordination.interface';

@Injectable()
export class EvmCoordinationService {
  constructor(private readonly serviceClients: ServiceClients) {}

  // Gateway method: Forward request to EVM Coordination Service với generic type
  private async forwardToEvmService<T = any>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    const client = this.serviceClients.evmCoordination();
    const forwardHeaders = this.filterHeaders(headers);

    // SỬA: Thêm type assertion
    const methodType = method as string;

    switch (methodType) {
      case 'get':
        return client.get<T>(path, forwardHeaders);
      case 'post':
        return client.post<T>(path, data, forwardHeaders);
      case 'put':
        return client.put<T>(path, data, forwardHeaders);
      case 'patch':
        return client.patch<T>(path, data, forwardHeaders);
      case 'delete':
        return client.delete<T>(path, forwardHeaders);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  // Filter headers to forward - SỬA: xử lý undefined
  private filterHeaders(headers?: Record<string, string>): Record<string, string> {
    const filtered: Record<string, string> = {};
    const allowedHeaders = [
      'authorization',
      'content-type',
      'accept',
      'x-request-id',
      'x-correlation-id',
      'user-agent',
    ];

    // Nếu headers là undefined, trả về object rỗng
    if (!headers) {
      return filtered;
    }

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase()) && value) {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  // Specific service methods với type safety
  async getVehicleAssignments(
    dealerId: string,
    headers?: Record<string, string>,
  ): Promise<VehicleAssignment[]> {
    return this.forwardToEvmService<VehicleAssignment[]>(
      'get',
      `/dealers/${dealerId}/vehicle-assignments`,
      null,
      headers,
    );
  }

  async assignVehicleToDealer(
    assignmentData: any,
    headers?: Record<string, string>,
  ): Promise<VehicleAssignment> {
    return this.forwardToEvmService<VehicleAssignment>(
      'post',
      '/vehicle-assignments',
      assignmentData,
      headers,
    );
  }

  async updateVehicleAssignment(
    assignmentId: string,
    updateData: any,
    headers?: Record<string, string>,
  ): Promise<VehicleAssignment> {
    return this.forwardToEvmService<VehicleAssignment>(
      'put',
      `/vehicle-assignments/${assignmentId}`,
      updateData,
      headers,
    );
  }

  async cancelVehicleAssignment(
    assignmentId: string,
    headers?: Record<string, string>,
  ): Promise<void> {
    return this.forwardToEvmService<void>(
      'delete',
      `/vehicle-assignments/${assignmentId}`,
      null,
      headers,
    );
  }

  async getAvailableVehicles(
    location: string,
    minRange: number,
    headers?: Record<string, string>,
  ): Promise<AvailableVehicle[]> {
    // SỬA: encode URI component để tránh lỗi URL
    const encodedLocation = encodeURIComponent(location);
    return this.forwardToEvmService<AvailableVehicle[]>(
      'get',
      `/vehicles/available?location=${encodedLocation}&minRange=${minRange}`,
      null,
      headers,
    );
  }

  async getVehicleTracking(
    assignmentId: string,
    headers?: Record<string, string>,
  ): Promise<TrackingInfo> {
    return this.forwardToEvmService<TrackingInfo>(
      'get',
      `/vehicle-assignments/${assignmentId}/tracking`,
      null,
      headers,
    );
  }

  async confirmVehicleDelivery(
    assignmentId: string,
    headers?: Record<string, string>,
  ): Promise<VehicleAssignment> {
    return this.forwardToEvmService<VehicleAssignment>(
      'post',
      `/vehicle-assignments/${assignmentId}/confirm-delivery`,
      {},
      headers,
    );
  }

  // Generic forward method for any request - SỬA: thêm PATCH
  async forwardRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', // THÊM PATCH
    path: string,
    body: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    const lowerMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete'; // THÊM patch
    return this.forwardToEvmService<T>(lowerMethod, path, body, headers);
  }
}
