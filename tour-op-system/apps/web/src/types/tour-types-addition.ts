// ── THÊM VÀO CUỐI FILE apps/web/src/types/index.ts ──
// Copy và paste phần này vào cuối file types/index.ts hiện có

export type TourStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BookingStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED';
export type InvoiceType = 'RECEIVABLE' | 'PAYABLE';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TourAssignment {
  id: string;
  role: string;
  fee?: number;
  currency: Currency;
  notes?: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'role'>;
}

export interface TourIncident {
  id: string;
  type: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location?: string;
  occurredAt: string;
  resolvedAt?: string;
  reportedBy?: string;
}

export interface Tour {
  id: string;
  code: string;
  title: string;
  status: TourStatus;
  pax: number;
  paxAdult: number;
  paxChild: number;
  travelDateFrom: string;
  travelDateTo: string;
  destination?: string;
  sellingPrice: number;
  totalCost: number;
  profitAmount: number;
  profitMargin: number;
  currency: Currency;
  pickupLocation?: string;
  pickupTime?: string;
  specialRequests?: string;
  notes?: string;
  internalNotes?: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'companyName' | 'type'>;
  quotation?: { id: string; code: string; title: string; totalAmount: number; currency: Currency };
  assignments?: TourAssignment[];
  bookings?: any[];
  incidents?: TourIncident[];
  _count?: { bookings: number; invoices: number };
}

export interface TourStats {
  total: number;
  upcoming: number;
  byStatus: Partial<Record<TourStatus, number>>;
  totalRevenue: number;
  totalProfit: number;
}
