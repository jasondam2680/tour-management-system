import { api } from '../api-client';
import { PaginatedResult } from '@/types';

export type GuideStatus = 'ACTIVE' | 'INACTIVE';
export type GuideAdvanceStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'SETTLED' | 'CANCELLED';
export type GuideSettlementStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface Guide {
  id: string;
  code: string;
  fullName: string;
  phone?: string;
  idCard?: string;
  licenseNo?: string;
  languages: string[];
  bankName?: string;
  bankAccount?: string;
  accountName?: string;
  defaultDailyRate?: number;
  status: GuideStatus;
  notes?: string;
  createdAt: string;
  _count?: { assignments: number; advances: number; settlements: number };
}

export interface GuideAssignment {
  id: string;
  guideId: string;
  tourId: string;
  role: string;
  startAt?: string;
  endAt?: string;
  days?: number;
  dailyRate?: number;
  fee?: number;
  currency: string;
  notes?: string;
  tour?: { id: string; code: string; title: string; travelDateFrom?: string; travelDateTo?: string };
}

export interface GuideAdvance {
  id: string;
  code: string;
  guideId: string;
  tourId?: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountBase: number;
  method: string;
  advanceDate: string;
  bankAccount?: string;
  notes?: string;
  status: GuideAdvanceStatus;
  settledAt?: string;
  guide?: { id: string; code: string; fullName: string };
  tour?: { id: string; code: string; title: string };
}

export interface GuideSettlementLine {
  id: string;
  description: string;
  amount: number;
  notes?: string;
  sortOrder: number;
}

export interface GuideSettlement {
  id: string;
  code: string;
  guideId: string;
  tourId?: string;
  days: number;
  dailyRate: number;
  perDiem: number;
  tipAmount: number;
  otherIncome: number;
  totalExpenses: number;
  advanceDeduction: number;
  pitRate: number;
  pitTax: number;
  netPayable: number;
  currency: string;
  status: GuideSettlementStatus;
  preparedBy?: string;
  approvedBy?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  guide?: {
    id: string; code: string; fullName: string; phone?: string; idCard?: string;
    licenseNo?: string; bankAccount?: string; bankName?: string; accountName?: string;
  };
  tour?: {
    id: string; code: string; title: string; pax?: number;
    travelDateFrom?: string; travelDateTo?: string; destination?: string;
  };
  lines?: GuideSettlementLine[];
  organization?: {
    id: string; name: string; address?: string; phone?: string; taxCode?: string; email?: string;
  };
}

const clean = <T extends Record<string, any>>(data: T): T => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = v === '' ? undefined : v;
  }
  return out as T;
};

export const guidesApi = {
  // ---- Guides ----
  getAll: (params?: Record<string, any>) =>
    api.get<PaginatedResult<Guide>>('/guides', params),

  getOne: (id: string) =>
    api.get<Guide & {
      assignments: GuideAssignment[];
      advances: GuideAdvance[];
      settlements: GuideSettlement[];
    }>(`/guides/${id}`),

  create: (data: Record<string, any>) =>
    api.post<Guide>('/guides', clean(data)),

  update: (id: string, data: Record<string, any>) =>
    api.patch<Guide>(`/guides/${id}`, clean(data)),

  remove: (id: string) =>
    api.delete(`/guides/${id}`),

  // ---- Assignments ----
  getAssignments: (guideId: string) =>
    api.get<GuideAssignment[]>(`/guides/${guideId}/assignments`),

  createAssignment: (guideId: string, data: Record<string, any>) =>
    api.post<GuideAssignment>(`/guides/${guideId}/assignments`, clean(data)),

  updateAssignment: (guideId: string, assignmentId: string, data: Record<string, any>) =>
    api.patch<GuideAssignment>(`/guides/${guideId}/assignments/${assignmentId}`, clean(data)),

  removeAssignment: (guideId: string, assignmentId: string) =>
    api.delete(`/guides/${guideId}/assignments/${assignmentId}`),

  // ---- Advances ----
  getAdvances: (guideId: string, status?: string) =>
    api.get<GuideAdvance[]>(`/guides/${guideId}/advances`, status ? { status } : undefined),

  getAllAdvances: (params?: Record<string, any>) =>
    api.get<GuideAdvance[]>('/guide-advances', params),

  getAdvance: (id: string) =>
    api.get<GuideAdvance>(`/guide-advances/${id}`),

  createAdvance: (guideId: string, data: Record<string, any>) =>
    api.post<GuideAdvance>(`/guides/${guideId}/advances`, clean(data)),

  updateAdvance: (id: string, data: Record<string, any>) =>
    api.patch<GuideAdvance>(`/guide-advances/${id}`, clean(data)),

  approveAdvance: (id: string) =>
    api.post<GuideAdvance>(`/guide-advances/${id}/approve`),

  markAdvancePaid: (id: string) =>
    api.post<GuideAdvance>(`/guide-advances/${id}/mark-paid`),

  cancelAdvance: (id: string) =>
    api.post<GuideAdvance>(`/guide-advances/${id}/cancel`),

  removeAdvance: (id: string) =>
    api.delete(`/guide-advances/${id}`),

  // ---- Settlements ----
  getSettlements: (params?: Record<string, any>) =>
    api.get<GuideSettlement[]>('/guide-settlements', params),

  getSettlement: (id: string) =>
    api.get<GuideSettlement>(`/guide-settlements/${id}`),

  createSettlement: (data: Record<string, any>) =>
    api.post<GuideSettlement>('/guide-settlements', clean(data)),

  updateSettlement: (id: string, data: Record<string, any>) =>
    api.patch<GuideSettlement>(`/guide-settlements/${id}`, clean(data)),

  submitSettlement: (id: string) =>
    api.post<GuideSettlement>(`/guide-settlements/${id}/submit`),

  approveSettlement: (id: string) =>
    api.post<GuideSettlement>(`/guide-settlements/${id}/approve`),

  markSettlementPaid: (id: string) =>
    api.post<GuideSettlement>(`/guide-settlements/${id}/mark-paid`),

  cancelSettlement: (id: string) =>
    api.post<GuideSettlement>(`/guide-settlements/${id}/cancel`),

  removeSettlement: (id: string) =>
    api.delete(`/guide-settlements/${id}`),

  addLine: (id: string, data: Record<string, any>) =>
    api.post<GuideSettlementLine>(`/guide-settlements/${id}/lines`, clean(data)),

  updateLine: (id: string, lineId: string, data: Record<string, any>) =>
    api.patch<GuideSettlementLine>(`/guide-settlements/${id}/lines/${lineId}`, clean(data)),

  removeLine: (id: string, lineId: string) =>
    api.delete(`/guide-settlements/${id}/lines/${lineId}`),
};
