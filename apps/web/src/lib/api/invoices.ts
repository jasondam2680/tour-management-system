import { api } from '../api-client';

export interface CreateInvoicePayload {
  tourId: string;
  customerId: string;
  totalAmount: number;
  currency: string;
  dueDate?: string;
  notes?: string;
}

export const invoicesApi = {
  /**
   * Gọi API tạo mới Hóa đơn
   */
  create: (data: CreateInvoicePayload) => {
    return api.post('/v1/invoices', data);
  },

  /**
   * Lấy danh sách Hóa đơn theo Tour (chuẩn bị cho bước sau)
   */
  getByTour: (tourId: string) => {
    return api.get(`/v1/invoices?tourId=${tourId}`);
  },
};