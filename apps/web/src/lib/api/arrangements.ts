import { api, apiClient } from '../api-client';

export type ServiceType =
  | 'ATTRACTION' | 'HOTEL' | 'MEAL' | 'TRANSPORT' | 'FLIGHT'
  | 'INSURANCE' | 'VISA' | 'GUIDE_SERVICE' | 'SHOPPING' | 'OTHER';
export type ArrangementPayBy = 'GUIDE_SELF' | 'COMPANY_TOPUP' | 'COMPANY_DIRECT';
export type ArrangementStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED';

export interface ServiceArrangement {
  id: string;
  tourId: string;
  serviceType: ServiceType;
  supplierId?: string;
  resourceId?: string;
  serviceDate?: string;
  description?: string;
  quantity?: number;
  unitPrice: number;
  currency: string;
  totalAmount: number;
  payBy: ArrangementPayBy;
  status: ArrangementStatus;
  notes?: string;
  sortOrder: number;
  supplier?: { id: string; name: string };
  resource?: { id: string; name: string };
}

export interface TourGuest {
  id: string;
  tourId: string;
  fullName: string;
  gender?: string;
  nationality?: string;
  passportNo?: string;
  birthDate?: string;
  birthPlace?: string;
  issueDate?: string;
  issuePlace?: string;
  expiryDate?: string;
  issueAuthority?: string;
  roomType?: string;
  phone?: string;
  notes?: string;
  sortOrder: number;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  ATTRACTION: '🎟️ Vé tham quan',
  HOTEL: '🏨 Khách sạn',
  MEAL: '🍽️ Bữa ăn',
  TRANSPORT: '🚌 Xe',
  FLIGHT: '✈️ Vé máy bay',
  INSURANCE: '🛡️ Bảo hiểm',
  VISA: '🛂 Visa',
  GUIDE_SERVICE: '🧭 HDV',
  SHOPPING: '🛍️ Mua sắm',
  OTHER: '📦 Khác',
};

export const SERVICE_TYPE_ORDER: ServiceType[] = [
  'FLIGHT', 'HOTEL', 'MEAL', 'ATTRACTION', 'TRANSPORT',
  'VISA', 'INSURANCE', 'GUIDE_SERVICE', 'SHOPPING', 'OTHER',
];

export const PAY_BY_LABEL: Record<ArrangementPayBy, string> = {
  GUIDE_SELF: 'HDV tự TT',
  COMPANY_TOPUP: 'Cty topup',
  COMPANY_DIRECT: 'Cty trả trực tiếp',
};

export const ARR_STATUS_LABEL: Record<ArrangementStatus, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã huỷ',
};

export const ARR_STATUS_COLOR: Record<ArrangementStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const clean = <T extends Record<string, any>>(data: T): T => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = v === '' ? undefined : v;
  }
  return out as T;
};

export const arrangementsApi = {
  // ---- Services ----
  list: (tourId: string, params?: { serviceType?: string; status?: string }) =>
    api.get<ServiceArrangement[]>(`/tours/${tourId}/services`, params),

  create: (tourId: string, data: Record<string, any>) =>
    api.post<ServiceArrangement>(`/tours/${tourId}/services`, clean(data)),

  getOne: (id: string) =>
    api.get<ServiceArrangement>(`/service-arrangements/${id}`),

  update: (id: string, data: Record<string, any>) =>
    api.patch<ServiceArrangement>(`/service-arrangements/${id}`, clean(data)),

  remove: (id: string) =>
    api.delete(`/service-arrangements/${id}`),

  confirm: (id: string) =>
    api.post<ServiceArrangement>(`/service-arrangements/${id}/confirm`),

  cancel: (id: string) =>
    api.post<ServiceArrangement>(`/service-arrangements/${id}/cancel`),

  markPaid: (id: string) =>
    api.post<ServiceArrangement>(`/service-arrangements/${id}/mark-paid`),

  createPayment: (id: string, data: Record<string, any> = {}) =>
    api.post<any>(`/service-arrangements/${id}/create-payment`, clean(data)),

  // ---- Guests ----
  listGuests: (tourId: string) =>
    api.get<TourGuest[]>(`/tours/${tourId}/guests`),

  createGuest: (tourId: string, data: Record<string, any>) =>
    api.post<TourGuest>(`/tours/${tourId}/guests`, clean(data)),

  updateGuest: (id: string, data: Record<string, any>) =>
    api.patch<TourGuest>(`/tour-guests/${id}`, clean(data)),

  removeGuest: (id: string) =>
    api.delete(`/tour-guests/${id}`),

  importGuests: (tourId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient
      .post(`/tours/${tourId}/guests/import`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data as ImportResult);
  },
};
