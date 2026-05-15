'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toursApi, QueryToursParams, TourStats } from '@/lib/api/tours';

type TourStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_LABEL: Record<TourStatus, string> = {
  PLANNING:    'Đang lên kế hoạch',
  CONFIRMED:   'Đã xác nhận',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED:   'Hoàn thành',
  CANCELLED:   'Đã huỷ',
};

const STATUS_COLOR: Record<TourStatus, string> = {
  PLANNING:    'bg-yellow-100 text-yellow-800',
  CONFIRMED:   'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED:   'bg-gray-100 text-gray-700',
  CANCELLED:   'bg-red-100 text-red-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ' + currency;
}

function getCustomerName(customer?: any) {
  if (!customer) return '—';
  return customer.type === 'B2B'
    ? (customer.companyName ?? '—')
    : [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—';
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [stats, setStats] = useState<TourStats | null>(null);
  const [meta, setMeta]   = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<QueryToursParams>({ page: 1, limit: 20 });

  const load = useCallback(async (q: QueryToursParams) => {
    setLoading(true);
    try {
      const [result, statsResult] = await Promise.all([
        toursApi.getAll(q),
        toursApi.getStats(),
      ]);
      setTours((result as any).data);
      setMeta((result as any).meta);
      setStats(statsResult as TourStats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(query); }, [query, load]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Tours</h1>
          <p className="text-sm text-gray-500 mt-1">Các đoàn / tour đang chạy và lên kế hoạch</p>
        </div>
        <Link href="/dashboard/tours/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Tạo Tour mới
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Tổng tours"     value={stats.total} />
          <StatCard label="Sắp khởi hành" value={stats.upcoming} color="text-blue-600" />
          <StatCard label="Đang diễn ra"  value={stats.byStatus?.IN_PROGRESS ?? 0} color="text-green-600" />
          <StatCard label="Doanh thu"      value={formatMoney(stats.totalRevenue, 'USD')} sub="tours đã hoàn thành" />
          <StatCard label="Lợi nhuận"      value={formatMoney(stats.totalProfit, 'USD')} color="text-emerald-600" />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Tìm tour, mã, điểm đến..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value || undefined, page: 1 }))}>
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(STATUS_LABEL) as TourStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-gray-500">{meta.total} tours</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Đang tải...</div>
        ) : tours.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Chưa có tour nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mã / Tên tour</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Khách hàng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày đi</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Khách</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Giá bán</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bookings</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tours.map((tour) => (
                <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{tour.title}</div>
                    <div className="text-xs text-gray-400">{tour.code}</div>
                    {tour.destination && <div className="text-xs text-gray-400">📍 {tour.destination}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{getCustomerName(tour.customer)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{formatDate(tour.travelDateFrom)}</div>
                    <div className="text-xs text-gray-400">→ {formatDate(tour.travelDateTo)}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{tour.pax} khách</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{formatMoney(tour.sellingPrice, tour.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[tour.status as TourStatus]}`}>
                      {STATUS_LABEL[tour.status as TourStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{tour._count?.bookings ?? 0} booking</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/tours/${tour.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                      Chi tiết →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) - 1 }))}
            disabled={meta.page <= 1}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">← Trước</button>
          <span className="text-sm text-gray-600">Trang {meta.page} / {meta.totalPages}</span>
          <button onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}
            disabled={meta.page >= meta.totalPages}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">Tiếp →</button>
        </div>
      )}
    </div>
  );
}
