export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SALES' | 'OP' | 'FINANCE' | 'GUIDE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type CustomerType = 'B2B' | 'B2C';
export type SupplierCategory =
  | 'HOTEL' | 'RESORT' | 'RESTAURANT' | 'TRANSPORT'
  | 'BOAT' | 'GUIDE' | 'ATTRACTION' | 'VISA' | 'INSURANCE' | 'OTHER';
export type Currency = 'VND' | 'USD' | 'EUR' | 'CNY' | 'THB' | 'SGD' | 'JPY' | 'KRW' | 'AUD';
export type TourStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BookingStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED';
export type InvoiceType = 'RECEIVABLE' | 'PAYABLE';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Organization {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  organizationId: string;
  lastLoginAt?: string;
  organization: Organization;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Customer {
  id: string;
  code: string;
  type: CustomerType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  country?: string;
  isVip: boolean;
  isActive: boolean;
  totalTours: number;
  totalRevenue: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  category: SupplierCategory;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  rating: number;
  isPreferred: boolean;
  isActive: boolean;
  currency: Currency;
  createdAt: string;
}

export type LeadStatus =
  | 'NEW' | 'CONTACTED' | 'QUALIFIED'
  | 'PROPOSAL_SENT' | 'NEGOTIATING'
  | 'WON' | 'LOST' | 'ABANDONED';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type QuotationStatus =
  | 'DRAFT' | 'SENT' | 'VIEWED' | 'NEGOTIATING'
  | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export interface LeadActivity {
  id: string;
  type: string;
  subject?: string;
  content: string;
  outcome?: string;
  doneAt: string;
}

export interface Lead {
  id: string;
  title: string;
  status: LeadStatus;
  priority: LeadPriority;
  source?: string;
  pax?: number;
  travelDateFrom?: string;
  travelDateTo?: string;
  destination?: string;
  budget?: number;
  currency: Currency;
  estimatedValue?: number;
  followUpAt?: string;
  notes?: string;
  tags: string[];
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  createdAt: string;
  customer?: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'companyName' | 'type'>;
  assignedTo?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  activities?: LeadActivity[];
  _count?: { activities: number; quotations: number };
}

export interface QuotationItem {
  id: string;
  day?: number;
  sortOrder: number;
  category: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  buyingPrice: number;
  markup: number;
  totalSelling: number;
  totalCost: number;
  currency: Currency;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  isOptional: boolean;
  isIncluded: boolean;
}

export interface Quotation {
  id: string;
  code: string;
  title: string;
  status: QuotationStatus;
  version: number;
  pax: number;
  paxAdult: number;
  paxChild: number;
  travelDateFrom?: string;
  travelDateTo?: string;
  duration?: number;
  destination?: string;
  tourType?: string;
  subtotal: number;
  discountAmount: number;
  discountPct: number;
  taxAmount: number;
  taxPct: number;
  totalAmount: number;
  totalCost: number;
  profitAmount: number;
  profitMargin: number;
  currency: Currency;
  validUntil?: string;
  notes?: string;
  internalNotes?: string;
  sentAt?: string;
  createdAt: string;
  customer?: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'companyName' | 'type'>;
  items?: QuotationItem[];
  _count?: { items: number };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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