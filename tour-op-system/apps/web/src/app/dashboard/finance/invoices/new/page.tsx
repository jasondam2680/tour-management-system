'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { financeApi } from '@/lib/api/finance';

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    type:'RECEIVABLE', customerId:'', tourId:searchParams.get('tourId')??'',
    subtotal:0, taxPct:0, currency:'USD', dueDate:'', notes:'',
  });

  const taxAmount   = (Number(form.subtotal) * Number(form.taxPct)) / 100;
  const totalAmount = Number(form.subtotal) + taxAmount;

  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) {
    const {name,value} = e.target;
    setForm((f) => ({...f, [name]: name==='subtotal'||name==='taxPct' ? Number(value) : value}));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId) { setError('Vui lòng nhập ID khách hàng'); return; }
    if (!form.subtotal)   { setError('Vui lòng nhập số tiền');      return; }
    setLoading(true); setError('');
    try {
      const inv = await financeApi.createInvoice({
        ...form,
        tourId:  form.tourId  || undefined,
        dueDate: form.dueDate || undefined,
      } as any);
      router.push(`/dashboard/finance/invoices/${(inv as any).id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← Quay lại</button>
        <h1 className="text-2xl font-bold text-gray-900">Tạo hoá đơn mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Thông tin hoá đơn</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại hoá đơn <span className="text-red-500">*</span></label>
              <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
                <option value="RECEIVABLE">💙 Thu tiền khách (AR)</option>
                <option value="PAYABLE">🟠 Trả NCC (AP)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tệ</label>
              <select name="currency" value={form.currency} onChange={handleChange} className={inputCls}>
                {['USD','VND','EUR','THB','CNY'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Khách hàng <span className="text-red-500">*</span></label>
            <input name="customerId" value={form.customerId} onChange={handleChange}
              placeholder="Paste ID từ trang Customers" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Tour (nếu có)</label>
            <input name="tourId" value={form.tourId} onChange={handleChange}
              placeholder="Paste ID từ trang Tours" className={inputCls} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Số tiền</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal <span className="text-red-500">*</span></label>
              <input type="number" name="subtotal" min={0} value={form.subtotal} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thuế (%)</label>
              <input type="number" name="taxPct" min={0} max={100} step={0.1} value={form.taxPct} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{new Intl.NumberFormat('vi-VN').format(Number(form.subtotal))} {form.currency}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Thuế ({form.taxPct}%)</span>
              <span>{new Intl.NumberFormat('vi-VN').format(Math.round(taxAmount))} {form.currency}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Tổng cộng</span>
              <span className="text-blue-600">{new Intl.NumberFormat('vi-VN').format(Math.round(totalAmount))} {form.currency}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hạn thanh toán</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={inputCls} />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Huỷ</button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
            {loading ? 'Đang tạo...' : 'Tạo hoá đơn'}
          </button>
        </div>
      </form>
    </div>
  );
}
