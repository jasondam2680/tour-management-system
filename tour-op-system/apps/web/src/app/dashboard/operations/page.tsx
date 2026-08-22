'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { bookingsApi, Booking } from '@/lib/api/bookings';
import { toursApi, TourStatus } from '@/lib/api/tours';

type OperationsTour = {
  id: string;
  code: string;
  title: string;
  status: TourStatus;
  pax: number;
  travelDateFrom: string;
  travelDateTo: string;
  destination?: string;
  pickupLocation?: string;
  pickupTime?: string;
  assignments?: {
    id: string;
    role: string;
    user?: { firstName: string; lastName: string; role: string };
  }[];
  customer?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  _count?: { bookings: number; invoices: number };
};

const STATUS_LABELS: Record<TourStatus, string> = {
  PLANNING: 'Đang lập kế hoạch',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang vận hành',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const STATUS_STYLES: Record<TourStatus, string> = {
  PLANNING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateRange(from: string, to: string) {
  const start = formatDate(from);
  const end = formatDate(to);
  return start === end ? start : `${start} – ${end}`;
}

function customerName(customer?: OperationsTour['customer']) {
  if (!customer) return 'Chưa gắn khách hàng';
  return customer.companyName || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Khách lẻ';
}

function assignmentLabel(tour: OperationsTour) {
  if (!tour.assignments?.length) return 'Chưa phân công';
  return tour.assignments
    .map((assignment) => {
      const name = assignment.user
        ? `${assignment.user.firstName} ${assignment.user.lastName}`.trim()
        : 'Nhân sự';
      return `${assignment.role}: ${name}`;
    })
    .join(' · ');
}

export default function OperationsPage() {
  const [period, setPeriod] = useState(14);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tours, setTours] = useState<OperationsTour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const from = startOfDay(new Date());
      const to = new Date(from);
      to.setDate(to.getDate() + period);

      try {
        const [tourResult, bookingResult] = await Promise.all([
          toursApi.getAll({
            dateFrom: from.toISOString(),
            dateTo: to.toISOString(),
            limit: 100,
          }),
          bookingsApi.getAll({ page: 1, limit: 100 }),
        ]);
        if (!active) return;
        setTours((tourResult?.data || []) as OperationsTour[]);
        setBookings(bookingResult?.data || []);
      } catch {
        if (active) setError('Không thể tải dữ liệu điều hành. Vui lòng thử lại.');
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [period, refreshKey]);

  const today = startOfDay(new Date());
  const upcomingTours = useMemo(
    () => tours.filter((tour) => tour.status !== 'CANCELLED' && tour.status !== 'COMPLETED'),
    [tours],
  );
  const todayTours = useMemo(
    () => upcomingTours.filter((tour) => startOfDay(new Date(tour.travelDateFrom)).getTime() === today.getTime()),
    [today, upcomingTours],
  );
  const unassignedTours = useMemo(
    () => upcomingTours.filter((tour) => !tour.assignments?.length),
    [upcomingTours],
  );
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'DRAFT' || booking.status === 'PENDING'),
    [bookings],
  );
  const unpaidBookings = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'OVERDUE'),
    [bookings],
  );
  const periodBookings = useMemo(() => {
    const from = startOfDay(new Date());
    const to = new Date(from);
    to.setDate(to.getDate() + period);
    return bookings.filter((booking) => {
      const date = booking.serviceDate || booking.checkIn;
      if (!date) return false;
      const serviceDate = new Date(date);
      return serviceDate >= from && serviceDate <= to;
    });
  }, [bookings, period]);

  const refresh = () => {
    setRefreshing(true);
    setRefreshKey((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Operations control</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Trung tâm điều hành</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Một màn hình để theo dõi lịch khởi hành, phân công nhân sự, xác nhận dịch vụ và các khoản cần xử lý.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              aria-label="Khoảng thời gian điều hành"
            >
              <option value={7}>7 ngày tới</option>
              <option value={14}>14 ngày tới</option>
              <option value={30}>30 ngày tới</option>
            </select>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
            >
              {refreshing ? 'Đang tải...' : '↻ Làm mới'}
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-6 p-8">
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={refresh} className="font-semibold underline">
              Thử lại
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Tour trong kỳ', value: upcomingTours.length, note: `${period} ngày tới`, dotClass: 'bg-blue-500' },
            { label: 'Khởi hành hôm nay', value: todayTours.length, note: 'Cần theo dõi trực tiếp', dotClass: 'bg-emerald-500' },
            { label: 'Chưa phân công', value: unassignedTours.length, note: 'Cần điều phối guide/driver', dotClass: 'bg-amber-500' },
            { label: 'Dịch vụ chờ xác nhận', value: pendingBookings.length, note: 'Booking nhà cung cấp', dotClass: 'bg-violet-500' },
            { label: 'Khoản phải trả', value: unpaidBookings.length, note: 'Booking chưa thanh toán', dotClass: 'bg-rose-500' },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${card.dotClass}`} />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{loading ? '—' : card.value}</p>
              <p className="mt-1 text-xs text-slate-400">{card.note}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">Lịch điều hành</h2>
                <p className="mt-1 text-xs text-slate-400">Các tour cần chuẩn bị trong {period} ngày tới</p>
              </div>
              <Link href="/dashboard/tours" className="text-sm font-medium text-blue-600 hover:underline">
                Xem toàn bộ tour →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Tour / khách hàng</th>
                    <th className="px-5 py-3">Khởi hành</th>
                    <th className="px-5 py-3">Phân công</th>
                    <th className="px-5 py-3">Dịch vụ</th>
                    <th className="px-5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                        Đang tải lịch điều hành...
                      </td>
                    </tr>
                  ) : upcomingTours.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                        Chưa có tour nào trong khoảng thời gian này.
                      </td>
                    </tr>
                  ) : (
                    upcomingTours.map((tour) => (
                      <tr key={tour.id} className="transition hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <Link href={`/dashboard/tours/${tour.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                            {tour.title}
                          </Link>
                          <p className="mt-1 text-xs text-slate-400">
                            {tour.code} · {customerName(tour.customer)} · {tour.pax} khách
                          </p>
                          {tour.destination && <p className="mt-1 text-xs text-slate-500">{tour.destination}</p>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-medium text-slate-700">{formatDateRange(tour.travelDateFrom, tour.travelDateTo)}</p>
                          <p className="mt-1 text-xs text-slate-400">{tour.pickupTime || 'Chưa có giờ đón'}</p>
                        </td>
                        <td className="max-w-[190px] px-5 py-4 text-xs text-slate-600">
                          <span className={!tour.assignments?.length ? 'font-semibold text-amber-600' : ''}>
                            {assignmentLabel(tour)}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                          <span className="font-semibold">{tour._count?.bookings ?? 0}</span>
                          <span className="text-xs text-slate-400"> booking</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[tour.status]}`}>
                            {STATUS_LABELS[tour.status]}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-amber-900">Việc cần xử lý</h2>
                  <p className="mt-1 text-xs text-amber-700">Các điểm nghẽn trong vận hành hiện tại</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                  {unassignedTours.length + pendingBookings.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {unassignedTours.slice(0, 4).map((tour) => (
                  <Link key={tour.id} href={`/dashboard/tours/${tour.id}`} className="block rounded-xl bg-white/80 p-3 transition hover:bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-800">Phân công nhân sự: {tour.title}</p>
                      <span className="text-xs text-amber-700">{formatDate(tour.travelDateFrom)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{tour.pax} khách · {tour.destination || 'Chưa có điểm đến'}</p>
                  </Link>
                ))}
                {pendingBookings.slice(0, 4).map((booking) => (
                  <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="block rounded-xl bg-white/80 p-3 transition hover:bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-800">Xác nhận dịch vụ: {booking.title}</p>
                      <span className="text-xs text-violet-700">{BOOKING_STATUS_LABELS[booking.status]}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{booking.code} · {booking.supplier?.name || 'Chưa có nhà cung cấp'}</p>
                  </Link>
                ))}
                {!unassignedTours.length && !pendingBookings.length && (
                  <p className="rounded-xl bg-white/70 px-3 py-4 text-center text-sm text-emerald-700">Không có việc tồn đọng.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Dịch vụ theo kỳ</h2>
                  <p className="mt-1 text-xs text-slate-400">Theo dõi mức độ sẵn sàng nhà cung cấp</p>
                </div>
                <Link href="/dashboard/bookings" className="text-xs font-medium text-blue-600 hover:underline">Mở booking →</Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xl font-bold text-slate-900">{periodBookings.length}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Tổng dịch vụ</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xl font-bold text-emerald-700">{periodBookings.filter((booking) => booking.status === 'CONFIRMED').length}</p>
                  <p className="mt-1 text-[11px] text-emerald-700">Đã xác nhận</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <p className="text-xl font-bold text-rose-700">{periodBookings.filter((booking) => booking.paymentStatus !== 'PAID').length}</p>
                  <p className="mt-1 text-[11px] text-rose-700">Chưa thanh toán</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
