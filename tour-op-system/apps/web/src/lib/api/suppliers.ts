import { api } from '../api-client';
import { Supplier, PaginatedResult } from '@/types';

export interface Resource {
  id: string;
  supplierId: string;
  category: string;
  name: string;
  code?: string;
  description?: string;
  basePrice: number;
  currency: string;
  unit: string;
  capacity?: number;
  location?: string;
  isActive: boolean;
}

export interface ResourceTemplate {
  name: string;
  unit: string;
}

export interface SupplierDetail extends Supplier {
  resources: Resource[];
  _count: { bookings: number };
}

export const suppliersApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<PaginatedResult<Supplier>>('/suppliers', params),

  getOne: (id: string) =>
    api.get<SupplierDetail>(`/suppliers/${id}`),

  getStats: () =>
    api.get<{ total: number; preferred: number; byCategory: any[] }>('/suppliers/stats'),

  create: (data: Record<string, any>) =>
    api.post<Supplier>('/suppliers', data),

  update: (id: string, data: Record<string, any>) =>
    api.patch<Supplier>(`/suppliers/${id}`, data),

  remove: (id: string) =>
    api.delete(`/suppliers/${id}`),

  getTemplates: (category: string) =>
    api.get<ResourceTemplate[]>(`/suppliers/resource-templates/${category}`),

  createResource: (supplierId: string, data: Record<string, any>) =>
    api.post<Resource>(`/suppliers/${supplierId}/resources`, data),

  updateResource: (supplierId: string, resourceId: string, data: Record<string, any>) =>
    api.patch<Resource>(`/suppliers/${supplierId}/resources/${resourceId}`, data),

  removeResource: (supplierId: string, resourceId: string) =>
    api.delete(`/suppliers/${supplierId}/resources/${resourceId}`),
};
