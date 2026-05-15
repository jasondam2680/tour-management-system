import { api } from '../api-client';
import { Customer, Currency, PaginatedResult } from '@/types';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED';
export type InvoiceType   = 'RECEIVABLE' | 'PAYABLE';

export interface Receipt {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  method: string;
  reference?: string;
  notes?: string;
  receivedAt: string;
}

export interface Invoice {
  id: string;
  code: string;
  type: InvoiceType;
  status: PaymentStatus;
  subtotal: number;
  taxPct: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  dueDate?: string;
  notes?: string;
  issuedAt: string;
  createdAt: string;
  customer?: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'companyName' | 'type'>;
  tour?: { id: string; code: string; title: string };
  receipts?: Receipt[];
}

export interface FinanceOverview {
  ar: {
    totalAmount: number; totalPaid: number;   totalDue: number;
    countTotal: number;  countPaid: number;
    countUnpaid: number; countOverdue: number;
  };
  ap: {
    totalCost: number; totalPaid: number; totalDue: number;
    countTotal: number; countPaid: number; countUnpaid: number;
  };
  recentInvoices:  Invoice[];
  overdueInvoices: Invoice[];
  monthlyAR: { month: string; revenue: number; collected: number }[];
}

export interface QueryInvoiceParams {
  search?: string;
  type?: InvoiceType;
  status?: PaymentStatus;
  customerId?: string;
  tourId?: string;
  overdue?: 'true';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const financeApi = {
  getOverview: () =>
    api.get<FinanceOverview>('/finance/overview'),

  getInvoices: (params?: QueryInvoiceParams) =>
    api.get<PaginatedResult<Invoice>>('/finance/invoices', params),

  getInvoice: (id: string) =>
    api.get<Invoice>(`/finance/invoices/${id}`),

  createInvoice: (data: {
    type: InvoiceType; customerId: string; tourId?: string;
    subtotal?: number; taxPct?: number; currency?: string;
    dueDate?: string; notes?: string;
  }) => api.post<Invoice>('/finance/invoices', data),

  addReceipt: (invoiceId: string, data: {
    amount: number; currency: string; exchangeRate?: number;
    method: string; reference?: string; notes?: string;
  }) => api.post<Invoice>(`/finance/invoices/${invoiceId}/receipts`, data),

  getAP: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResult<any>>('/finance/ap', params),
};
