import { api } from '../api-client';
import type { Itinerary, ItineraryVersion, PaginatedResult } from '@/types';

export interface CreateItineraryPayload {
  title: string;
  overview?: string;
  notes?: string;
  days?: {
    dayNumber: number;
    title?: string;
    description?: string;
    meals?: string[];
    accommodation?: string;
    activities?: {
      sortOrder: number;
      time?: string;
      title: string;
      description?: string;
      location?: string;
      duration?: number;
      notes?: string;
    }[];
  }[];
}

export interface CreateVersionPayload {
  title?: string;
  overview?: string;
  notes?: string;
  days?: {
    dayNumber: number;
    title?: string;
    description?: string;
    meals?: string[];
    accommodation?: string;
    activities?: {
      sortOrder: number;
      time?: string;
      title: string;
      description?: string;
      location?: string;
      duration?: number;
      notes?: string;
    }[];
  }[];
}

export const itinerariesApi = {
  getAll: (params: { search?: string; page?: number; limit?: number }) =>
    api.get<{ data: Itinerary[]; meta: any }>('/itineraries', params),

  getOne: (id: string) =>
    api.get<Itinerary>(`/itineraries/${id}`),

  create: (data: CreateItineraryPayload) =>
    api.post<Itinerary>('/itineraries', data),

  update: (id: string, data: { title?: string }) =>
    api.patch<Itinerary>(`/itineraries/${id}`, data),

  remove: (id: string) =>
    api.delete(`/itineraries/${id}`),

  createVersion: (itineraryId: string, data: CreateVersionPayload) =>
    api.post<ItineraryVersion>(`/itineraries/${itineraryId}/versions`, data),

  getVersions: (itineraryId: string) =>
    api.get<ItineraryVersion[]>(`/itineraries/${itineraryId}/versions`),

  getVersion: (itineraryId: string, versionId: string) =>
    api.get<ItineraryVersion>(`/itineraries/${itineraryId}/versions/${versionId}`),

  activateVersion: (itineraryId: string, versionId: string) =>
    api.post<Itinerary>(`/itineraries/${itineraryId}/versions/${versionId}/activate`),
};
