'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { bookingsApi, Booking } from '@/lib/api/bookings';
import { suppliersApi } from '@/lib/api/suppliers';

type ProcurementSupplier = {
  id: string;
  name: string;
  code: string;
  category: string;
  city?: string;
  phone?: string;
  isPreferred: boolean;
  isActive: boolean;
  resources?: ProcurementResource[];
};

type ProcurementResource = {
  id: string;
  supplierId: string;
  name: string;
  category: string;
  description?: string;
  basePrice: number;
  currency: string;
  unit: string;
  capacity?: number;
  location?: string;
  isActive: boolean;
};

const CATEGORY_LABEL: Record<string, string> = {
  HOTEL: 'Khách sạn',
  RESORT: 'Resort',
  RESTAURANT: 'Nhà hàng',
  TRANSPORT: 'Vận chuyển',
  BOAT: 'Tàu / thuyền',
  GUIDE: 'Hướng dẫn viên',
  ATTRACTION: 'Điểm tham quan',
  VISA: 'Visa',
  INSURANCE: 'Bảo hiểm',
  OTHER: 'Khác',
};

const CATEGORY_COLOR: Record<string, string> = {
  HOTEL: 'bg-blue-50 text-blue-700',
  RESORT: 'bg-cyan-50 text-cyan-700',
  RESTAURANT: 'bg-orange-50 text-orange-700',
  TRANSPORT: 'bg-violet-50 text-violet-700',
  BOAT: 'bg-sky-50 text-sky-700',
  GUIDE: 'bg-emerald-50 text-emerald-700',
  ATTRACTION: 'bg-amber-50 text-amber-700',
  VISA: 'bg-pink-50 text-pink-700',
  INSURANCE: 'bg-slate-100 text-slate-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

function money(value: number | string, currency: string) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value))} ${currency}`;
}

function ResourceStatus({ resource }: { resource: ProcurementResource }) {
  if (!resource.capacity) {
    return <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Cần kiểm tra tồn</span>;
  }
  return <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Có sức chứa</span>;
}

export default function ProcurementPage() {
  const [suppliers, setSuppliers] = useState<ProcurementSupplier[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [supplierResult, bookingResult] = await Promise.all([
          suppliersApi.getAll({ limit: 200, isActive: true }),
          bookingsApi.getAll({ page: 1, limit: 100 }),
        ]);
        if (!active) return;
        setSuppliers((supplierResult?.data || []) as ProcurementSupplier[]);
        setBookings(bookingResult?.data || []);
      } catch {
        if (active) setError('Không thể tải dữ liệu tài nguyên và mua dịch vụ.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const resources = useMemo(
    () =>
      suppliers.flatMap((supplier) =>
        (supplier.resources || []).map((resource) => ({ ...resource, supplier })),
      ),
    [suppliers],
  );

  const categories = useMemo(
    () => Array.from(new Set(resources.map((resource) => resource.category))).sort(),
    [resources],
  );

  const filteredResources = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesCategory = category === 'ALL' || resource.category === category;
      const matchesSearch =
        !needle ||
        [resource.name, resource.description, resource.location, resource.supplier.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      return matchesCategory && matchesSearch;
    });
  }, [category, resources, search]);

  const pendingBookings = bookings.filter((booking) => booking.status === 'DRAFT' || booking.status === 'PENDING');
  const unpaidBookings = bookings.filter((booking) => booking.paymentStatus !== 'PAID');
  const resourceBookingIds = new Set(
    bookings.flatMap((booking) => (booking.items || []).map((item: any) => item.resourceId).filter(Boolean)),
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Procurement control</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Resource & Procurement Center</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Kho tài nguyên dùng chung, nhà cung cấp ưu tiên và hàng đợi dịch vụ cần hỏi giá hoặc xác nhận.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/suppliers" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
              Quản lý nhà cung cấp →
            </Link>
            <Link href="/dashboard/bookings" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Mở booking →
            </Link>
          </div>
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['Nhà cung cấp hoạt động', suppliers.length, 'bg-blue-500'],
            ['Tài nguyên đang dùng', resources.length, 'bg-emerald-500'],
            ['NCC ưu tiên', suppliers.filter((supplier) => supplier.isPreferred).length, 'bg-violet-500'],
            ['Booking cần xác nhận', pendingBookings.length, 'bg-amber-500'],
            ['Booking chưa thanh toán', unpaidBookings.length, 'bg-rose-500'],
          ].map(([label, value, dot]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{loading ? '—' : value}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Resource catalog</h2>
                  <p className="mt-1 text-xs text-slate-400">Tra cứu dịch vụ theo nhà cung cấp và nhóm nghiệp vụ</p>
                </div>
                <span className="text-xs text-slate-400">{filteredResources.length} tài nguyên</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm dịch vụ, NCC, địa điểm..."
                  className="min-w-[240px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  <option value="ALL">Tất cả nhóm</option>
                  {categories.map((item) => <option key={item} value={item}>{CATEGORY_LABEL[item] || item}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Dịch vụ</th>
                    <th className="px-5 py-3">Nhà cung cấp</th>
                    <th className="px-5 py-3">Nhóm</th>
                    <th className="px-5 py-3">Giá chuẩn</th>
                    <th className="px-5 py-3">Tình trạng</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">Đang tải resource catalog...</td></tr>
                  ) : filteredResources.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">Không tìm thấy tài nguyên phù hợp.</td></tr>
                  ) : filteredResources.map(({ supplier, ...resource }) => (
                    <tr key={resource.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{resource.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{resource.location || resource.description || 'Chưa có mô tả'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/suppliers/${supplier.id}`} className="font-medium text-blue-600 hover:underline">{supplier.name}</Link>
                        <p className="mt-1 text-xs text-slate-400">{supplier.code}{supplier.isPreferred ? ' · Ưu tiên' : ''}</p>
                      </td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${CATEGORY_COLOR[resource.category] || 'bg-slate-100 text-slate-600'}`}>{CATEGORY_LABEL[resource.category] || resource.category}</span></td>
                      <td className="px-5 py-4 font-medium text-slate-700">{money(resource.basePrice, resource.currency)}<span className="ml-1 text-xs font-normal text-slate-400">{resource.unit}</span></td>
                      <td className="px-5 py-4"><ResourceStatus resource={resource} /></td>
                      <td className="px-5 py-4 text-right"><Link href={`/dashboard/suppliers/${supplier.id}`} className="text-xs font-medium text-slate-500 hover:text-blue-600">Chi tiết →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-semibold text-amber-900">Procurement queue</h2><p className="mt-1 text-xs text-amber-700">Booking dịch vụ cần điều hành xử lý</p></div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{pendingBookings.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {pendingBookings.slice(0, 5).map((booking) => (
                  <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="block rounded-xl bg-white/80 p-3 hover:bg-white">
                    <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium text-slate-800">{booking.title}</p><span className="text-xs text-amber-700">{booking.status === 'DRAFT' ? 'Nháp' : 'Chờ xác nhận'}</span></div>
                    <p className="mt-1 text-xs text-slate-500">{booking.code} · {booking.supplier?.name || 'Chưa có NCC'}</p>
                  </Link>
                ))}
                {!pendingBookings.length && <p className="rounded-xl bg-white/70 px-3 py-4 text-center text-sm text-emerald-700">Không có booking tồn đọng.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">Tình trạng tài nguyên</h2>
              <p className="mt-1 text-xs text-slate-400">Tín hiệu nhanh để bổ sung dữ liệu mua dịch vụ</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><span className="text-sm text-slate-600">Có sức chứa</span><span className="font-bold text-emerald-700">{resources.filter((resource) => resource.capacity).length}</span></div>
                <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-3"><span className="text-sm text-amber-800">Chưa khai báo sức chứa</span><span className="font-bold text-amber-700">{resources.filter((resource) => !resource.capacity).length}</span></div>
                <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-3"><span className="text-sm text-blue-800">Đã được dùng trong booking</span><span className="font-bold text-blue-700">{resources.filter((resource) => resourceBookingIds.has(resource.id)).length}</span></div>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-400">Bước nâng cấp tiếp theo có thể bổ sung allotment, thời gian cutoff, ngày blackout và lịch sử giá theo từng resource.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
