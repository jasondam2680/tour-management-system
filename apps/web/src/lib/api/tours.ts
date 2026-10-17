import { api } from '../api-client';
import { PaginatedResult } from '@/types';

export type TourStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TourStats {
  total: number;
  upcoming: number;
  byStatus: Partial<Record<TourStatus, number>>;
  totalRevenue: number;
  totalProfit: number;
}

export interface CreateTourPayload {
  title: string;
  quotationId?: string;
  customerId?: string;
  pax: number;
  paxAdult: number;
  paxChild?: number;
  travelDateFrom: string;
  travelDateTo: string;
  destination?: string;
  sellingPrice?: number;
  currency?: string;
  pickupLocation?: string;
  pickupTime?: string;
  specialRequests?: string;
  notes?: string;
  internalNotes?: string;
}

export interface QueryToursParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const toursApi = {
  getStats: () =>
    api.get<TourStats>('/tours/stats'),

  getAll: (params?: QueryToursParams) =>
    api.get<PaginatedResult<any>>('/tours', params),

  getOne: (id: string) =>
    api.get<any>(`/tours/${id}`),

  create: (data: CreateTourPayload) =>
    api.post<any>('/tours', data),

  update: (id: string, data: Partial<CreateTourPayload>) =>
    api.patch<any>(`/tours/${id}`, data),

  changeStatus: (id: string, status: string, reason?: string) =>
    api.patch<any>(`/tours/${id}/status`, { status, reason }),

  addAssignment: (tourId: string, data: {
    userId: string; role: string; fee?: number; currency?: string; notes?: string;
  }) => api.post(`/tours/${tourId}/assignments`, data),

  removeAssignment: (tourId: string, assignmentId: string) =>
    api.delete(`/tours/${tourId}/assignments/${assignmentId}`),

  addIncident: (tourId: string, data: {
    type: string; severity: string; title: string;
    description: string; location?: string; reportedBy?: string;
  }) => api.post(`/tours/${tourId}/incidents`, data),
};
