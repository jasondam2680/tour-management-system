import { api, apiClient } from '../api-client';

export type TourAuditStatus = 'OPEN' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'CLOSED';
export type AuditLineStatus = 'PENDING' | 'APPROVED' | 'ADJUSTED' | 'REJECTED';
export type AuditSourceType = 'ARRANGEMENT' | 'GUIDE_SETTLEMENT' | 'MANUAL';

export interface TourAuditLine {
  id: string;
  auditId: string;
  sourceType: AuditSourceType;
  sourceId?: string;
  description: string;
  claimedAmount: number;
  auditedAmount?: number;
  currency: string;
  status: AuditLineStatus;
  billUrl?: string;
  notes?: string;
  sortOrder: number;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface TourAudit {
  id: string;
  organizationId: string;
  tourId: string;
  status: TourAuditStatus;
  notes?: string;
  openedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  closedAt?: string;
  lines: TourAuditLine[];
  tour?: { id: string; code: string; title: string };
}

export const AUDIT_STATUS_LABEL: Record<TourAuditStatus, string> = {
  OPEN: 'Đang mở',
  SUBMITTED: 'Đã trình',
  REVIEWED: 'Đã kiểm toán',
  APPROVED: 'Đã duyệt',
  CLOSED: 'Đã khóa sổ',
};
export const AUDIT_STATUS_COLOR: Record<TourAuditStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-amber-100 text-amber-800',
  REVIEWED: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-200 text-gray-700',
};
export const AUDIT_LINE_STATUS_LABEL: Record<AuditLineStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  ADJUSTED: 'Đã điều chỉnh',
  REJECTED: 'Từ chối',
};
export const AUDIT_LINE_STATUS_COLOR: Record<AuditLineStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  APPROVED: 'bg-green-100 text-green-800',
  ADJUSTED: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800',
};
export const AUDIT_SOURCE_LABEL: Record<AuditSourceType, string> = {
  ARRANGEMENT: 'Sắp xếp DV',
  GUIDE_SETTLEMENT: 'Quyết toán HDV',
  MANUAL: 'Thủ công',
};

const clean = (data: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === '' || v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
};

export const auditsApi = {
  open: (tourId: string) => api.post<TourAudit>(`/tours/${tourId}/audit`, {}),
  getByTour: (tourId: string) => api.get<TourAudit>(`/tours/${tourId}/audit`),
  transition: (auditId: string, action: string) =>
    api.post<TourAudit>(`/tour-audits/${auditId}/${action}`, {}),

  createLine: (tourId: string, data: Record<string, any>) =>
    api.post<TourAuditLine>(`/tours/${tourId}/audit/lines`, clean(data)),
  updateLine: (lineId: string, data: Record<string, any>) =>
    api.patch<TourAuditLine>(`/audit-lines/${lineId}`, clean(data)),
  removeLine: (lineId: string) => api.delete(`/audit-lines/${lineId}`),
  reviewLine: (lineId: string, data: { status: AuditLineStatus; auditedAmount?: number; notes?: string }) =>
    api.post<TourAuditLine>(`/audit-lines/${lineId}/review`, clean(data)),
  uploadBill: (lineId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient
      .post(`/audit-lines/${lineId}/bill`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data as TourAuditLine);
  },

  departurePlan: (tourId: string) => api.get<any>(`/tours/${tourId}/departure-plan`),
  settlement: (tourId: string) => api.get<any>(`/tours/${tourId}/settlement`),
};
