'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toursApi } from '@/lib/api/tours';

export default function NewTourPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    title: '', quotationId: '', pax: 1, paxAdult: 1, paxChild: 0,
    travelDateFrom: '', travelDateTo: '', destination: '',
    sellingPrice: 0, currency: 'USD', pickupLocation: '',
    pickupTime: '', specialRequests: '', notes: '', internalNotes: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.title || !form.travelDateFrom || !form.travelDateTo) {
      setError('Vui lòng điền đầy đủ: Tên tour, ngày đi, ngày về');
      return;
    }
    setLoading(true);
    try {
      const tour = await toursApi.create({
        ...form,
        pax: Number(form.pax), paxAdult: Number(form.paxAdult), paxChild: Number(form.paxChild),
        sellingPrice: Number(form.sellingPrice),
        quotationId: form.quotationId || undefined,
      });
      router.push(`/dashboard/tours/${(tour as any).id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Có lỗi xảy ra, thử lại.');
    } finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tạo Tour mới</h1>
        <p className="text-sm text-gray-500 mt-1">Điền thông tin để tạo đoàn / tour mới</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Thông tin cơ bản</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên tour <span className="text-red-500">*</span></label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="VD: Đoàn Hội An - Đà Nẵng 5N4Đ" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã báo giá (nếu tạo từ quotation)</label>
            <input name="quotationId" value={form.quotationId} onChange={handleChange} placeholder="ID báo giá (để trống nếu tạo mới)" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến</label>
            <input name="destination" value={form.destination} onChange={handleChange} placeholder="VD: Hội An, Đà Nẵng" className={inputCls} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Ngày đi & Số khách</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khởi hành <span className="text-red-500">*</span></label>
              <input type="date" name="travelDateFrom" value={form.travelDateFrom} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc <span className="text-red-500">*</span></label>
              <input type="date" name="travelDateTo" value={form.travelDateTo} onChange={handleChange} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tổng khách</label>
              <input type="number" name="pax" min={1} value={form.pax} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người lớn</label>
              <input type="number" name="paxAdult" min={0} value={form.paxAdult} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trẻ em</label>
              <input type="number" name="paxChild" min={0} value={form.paxChild} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Tài chính</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (tổng)</label>
              <input type="number" name="sellingPrice" min={0} value={form.sellingPrice} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tệ</label>
              <select name="currency" value={form.currency} onChange={handleChange} className={inputCls}>
                {['USD', 'VND', 'EUR', 'CNY', 'THB', 'SGD'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Vận chuyển & Ghi chú</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đón</label>
              <input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} placeholder="VD: Sân bay Nội Bài" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đón</label>
              <input name="pickupTime" value={form.pickupTime} onChange={handleChange} placeholder="VD: 06:00" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu đặc biệt</label>
            <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={2} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú nội bộ</label>
            <textarea name="internalNotes" value={form.internalNotes} onChange={handleChange} rows={2} className={inputCls} />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Huỷ</button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
            {loading ? 'Đang tạo...' : 'Tạo Tour'}
          </button>
        </div>
      </form>
    </div>
  );
}
