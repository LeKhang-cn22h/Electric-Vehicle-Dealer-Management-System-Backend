export interface VehicleAssignment {
  id: string;
  vehicleId: string;
  dealerId: string;
  assignmentDate: string;
  estimatedArrival: string;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
  driverId?: string;
  transportType: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AvailableVehicle {
  vehicleId: string;
  model: string;
  currentLocation: string;
  batteryLevel: number;
  status: 'available' | 'maintenance' | 'reserved';
  estimatedRange: number;
}

export interface TrackingInfo {
  assignmentId: string;
  currentLocation: string;
  status: string;
  estimatedArrival: string;
  lastUpdated: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}
