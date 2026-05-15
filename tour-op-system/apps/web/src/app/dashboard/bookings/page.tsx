'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { bookingsApi, Booking, BookingStatus, BookingStats } from '@/lib/api/bookings';

const STATUS_LABEL: Record<BookingStatus, string> = {
  DRAFT:'Nháp', PENDING:'Chờ xác nhận', CONFIRMED:'Đã xác nhận', COMPLETED:'Hoàn thành', CANCELLED:'Đã huỷ',
};
const STATUS_COLOR: Record<BookingStatus, string> = {
  DRAFT:'bg-gray-100 text-gray-600', PENDING:'bg-yellow-100 text-yellow-700',
  CONFIRMED:'bg-blue-100 text-blue-700', COMPLETED:'bg-green-100 text-green-700', CANCELLED:'bg-red-100 text-red-700',
};
const PAYMENT_COLOR: Record<string, string> = {
  UNPAID:'text-red-600', PARTIAL:'text-yellow-600', PAID:'text-green-600', OVERDUE:'text-red-700 font-bold',
};
const CATEGORY_ICON: Record<string, string> = {
  HOTEL:'🏨', RESORT:'🏖️', RESTAURANT:'🍽️', TRANSPORT:'🚌',
  BOAT:'⛵', GUIDE:'🧭', ATTRACTION:'🎡', VISA:'📋', INSURANCE:'🛡️', OTHER:'📦',
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;
}
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric'});
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats]       = useState<BookingStats | null>(null);
  const [meta, setMeta]         = useState({total:0,page:1,totalPages:1});
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState<Record<string,any>>({page:1,limit:20});

  const load = useCallback(async (q: Record<string,any>) => {
    setLoading(true);
    try {
      const [result, statsResult] = await Promise.all([bookingsApi.getAll(q), bookingsApi.getStats()]);
      setBookings(result.data); setMeta(result.meta); setStats(statsResult);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(query); }, [query, load]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings dịch vụ</h1>
          <p className="text-sm text-gray-500 mt-1">Lệnh đặt dịch vụ từ nhà cung cấp cho các tour</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {label:'Tổng bookings', value:stats.total, color:''},
            {label:'Chờ xác nhận', value:stats.byStatus?.PENDING??0, color:'text-yellow-600'},
            {label:'Đã xác nhận',  value:stats.byStatus?.CONFIRMED??0, color:'text-blue-600'},
            {label:'Công nợ NCC',  value:formatMoney(stats.totalUnpaid,'VND'), color:'text-red-600'},
          ].map(({label,value,color}) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`text-2xl font-bold mt-1 ${color||'text-gray-900'}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Tìm booking, mã..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setQuery((q) => ({...q, search:e.target.value||undefined, page:1}))} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setQuery((q) => ({...q, status:e.target.value||undefined, page:1}))}>
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <span className="ml-auto text-sm text-gray-500">{meta.total} bookings</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Đang tải...</div>
        : !bookings.length ? <div className="p-12 text-center text-gray-400">Chưa có booking nào. Tạo từ trang chi tiết Tour.</div>
        : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Booking','Tour','Nhà cung cấp','Ngày DV','Chi phí','Thanh toán','Trạng thái',''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{CATEGORY_ICON[b.category]} {b.title}</div>
                    <div className="text-xs text-gray-400 font-mono">{b.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    {b.tour ? <Link href={`/dashboard/tours/${b.tour.id}`} className="text-blue-600 hover:underline text-xs">{b.tour.code}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{b.supplier?.name??'—'}</div>
                    {b.supplier?.phone && <div className="text-xs text-gray-400">{b.supplier.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {b.serviceDate ? new Date(b.serviceDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(b.totalCost, b.currency)}</td>
                  <td className="px-4 py-3">
                    <div className={`text-xs font-medium ${PAYMENT_COLOR[b.paymentStatus]}`}>{b.paymentStatus}</div>
                    {b.amountDue > 0 && <div className="text-xs text-gray-400">Còn: {formatMoney(b.amountDue, b.currency)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/bookings/${b.id}`} className="text-blue-600 hover:underline text-xs font-medium">Chi tiết →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setQuery((q) => ({...q, page:q.page-1}))} disabled={meta.page<=1}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">← Trước</button>
          <span className="text-sm text-gray-600">Trang {meta.page} / {meta.totalPages}</span>
          <button onClick={() => setQuery((q) => ({...q, page:q.page+1}))} disabled={meta.page>=meta.totalPages}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">Tiếp →</button>
        </div>
      )}
    </div>
  );
}
