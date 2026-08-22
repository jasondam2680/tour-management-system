import { api } from '../api-client';
import { PaginatedResult } from '@/types';

export type BookingStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED';

export interface BookingItem {
  id: string;
  name: string;
  description?: string;
  date?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  notes?: string;
}

export interface BookingInquiry {
  id: string;
  subject: string;
  content: string;
  sentAt: string;
  replyAt?: string;
  quotedPrice?: number;
  currency: string;
  notes?: string;
  isSelected: boolean;
  supplier?: { id: string; name: string; category: string };
}

export interface Booking {
  id: string;
  code: string;
  tourId: string;
  supplierId: string;
  category: string;
  title: string;
  status: BookingStatus;
  serviceDate?: string;
  checkIn?: string;
  checkOut?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: string;
  amountPaid: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
  paymentDeadline?: string;
  confirmationNo?: string;
  notes?: string;
  internalNotes?: string;
  sentAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  tour?: { id: string; code: string; title: string; status: string };
  supplier?: { id: string; name: string; category: string; phone?: string };
  items?: BookingItem[];
  payments?: any[];
  inquiries?: BookingInquiry[];
}

export interface BookingStats {
  total: number;
  byStatus: Partial<Record<BookingStatus, number>>;
  totalUnpaid: number;
}

export interface CreateBookingPayload {
  tourId: string;
  supplierId: string;
  category: string;
  title: string;
  serviceDate?: string;
  checkIn?: string;
  checkOut?: string;
  quantity?: number;
  unitCost?: number;
  currency?: string;
  paymentDeadline?: string;
  notes?: string;
  internalNotes?: string;
  items?: {
    name: string;
    quantity?: number;
    unitCost: number;
    unit?: string;
    date?: string;
    notes?: string;
  }[];
}

export const bookingsApi = {
  getStats: () =>
    api.get<BookingStats>('/bookings/stats'),

  getAll: (params?: Record<string, any>) =>
    api.get<PaginatedResult<Booking>>('/bookings', params),

  getOne: (id: string) =>
    api.get<Booking>(`/bookings/${id}`),

  create: (data: CreateBookingPayload) =>
    api.post<Booking>('/bookings', data),

  update: (id: string, data: Partial<CreateBookingPayload>) =>
    api.patch<Booking>(`/bookings/${id}`, data),

  changeStatus: (id: string, status: string, confirmationNo?: string) =>
    api.patch<Booking>(`/bookings/${id}/status`, { status, confirmationNo }),

  addPayment: (id: string, data: {
    amount: number; currency: string; method: string;
    reference?: string; notes?: string; dueDate?: string;
  }) => api.post(`/bookings/${id}/payments`, data),

  createInquiry: (id: string, data: {
    supplierId: string;
    subject: string;
    content: string;
    quotedPrice?: number;
    currency?: string;
    notes?: string;
  }) => api.post<BookingInquiry>(`/bookings/${id}/inquiries`, data),

  getInquiries: (id: string) => api.get<BookingInquiry[]>(`/bookings/${id}/inquiries`),
};
