'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toursApi, TourStatus } from '@/lib/api/tours';

type DispatchTour = {
  id: string;
  code: string;
  title: string;
  status: TourStatus;
  pax: number;
  travelDateFrom: string;
  travelDateTo: string;
  destination?: string;
  pickupTime?: string;
  pickupLocation?: string;
  assignments?: { id: string; role: string; user?: { firstName: string; lastName: string; role: string } }[];
};

const STATUS_LABEL: Record<TourStatus, string> = {
  PLANNING: 'Lập kế hoạch',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang chạy',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const STATUS_STYLE: Record<TourStatus, string> = {
  PLANNING: 'border-amber-200 bg-amber-50 text-amber-700',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-700',
  IN_PROGRESS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-slate-200 bg-slate-100 text-slate-600',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
};

function dateOnly(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function displayDate(value: Date) {
  return value.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function formatRange(from: string, to: string) {
  const start = new Date(from).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const end = new Date(to).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return start === end ? start : `${start} – ${end}`;
}

function assigneeNames(tour: DispatchTour) {
  if (!tour.assignments?.length) return 'Chưa phân công';
  return tour.assignments.map((assignment) => assignment.user ? `${assignment.user.firstName} ${assignment.user.lastName}` : assignment.role).join(', ');
}

export default function DispatchPage() {
  const [days, setDays] = useState(14);
  const [tours, setTours] = useState<DispatchTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + days - 1);
      try {
        const result = await toursApi.getAll({ dateFrom: from.toISOString(), dateTo: to.toISOString(), limit: 200 });
        if (active) setTours((result?.data || []) as DispatchTour[]);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [days]);

  const calendarDays = useMemo(() => {
    const result: Date[] = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let index = 0; index < days; index += 1) {
      const day = new Date(cursor);
      day.setDate(day.getDate() + index);
      result.push(day);
    }
    return result;
  }, [days]);

  const visibleTours = useMemo(
    () => tours.filter((tour) => showCompleted || !['COMPLETED', 'CANCELLED'].includes(tour.status)),
    [showCompleted, tours],
  );

  const toursByDay = useMemo(() => {
    const map = new Map<string, DispatchTour[]>();
    visibleTours.forEach((tour) => {
      const key = dateOnly(new Date(tour.travelDateFrom));
      const list = map.get(key) || [];
      list.push(tour);
      map.set(key, list);
    });
    return map;
  }, [visibleTours]);

  const unassigned = visibleTours.filter((tour) => !tour.assignments?.length);
  const activeDays = calendarDays.filter((day) => (toursByDay.get(dateOnly(day)) || []).length).length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Dispatch planning</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Dispatch Calendar</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">Lịch điều phối theo ngày cho tour, guide và các đầu việc cần chuẩn bị.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <option value={7}>7 ngày</option>
              <option value={14}>14 ngày</option>
              <option value={30}>30 ngày</option>
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} />
              Hiện tour đã đóng
            </label>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Tour trong lịch</p><p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : visibleTours.length}</p><p className="mt-1 text-xs text-slate-400">{activeDays} ngày có hoạt động</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Chưa phân công</p><p className="mt-2 text-3xl font-bold text-amber-600">{loading ? '—' : unassigned.length}</p><p className="mt-1 text-xs text-slate-400">Cần điều phối nhân sự</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Đã xác nhận</p><p className="mt-2 text-3xl font-bold text-blue-600">{loading ? '—' : visibleTours.filter((tour) => tour.status === 'CONFIRMED').length}</p><p className="mt-1 text-xs text-slate-400">Sẵn sàng chuẩn bị dịch vụ</p></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div><h2 className="font-semibold text-slate-900">Lịch khởi hành</h2><p className="mt-1 text-xs text-slate-400">Chọn tour để mở màn hình điều hành chi tiết</p></div>
            <Link href="/dashboard/operations" className="text-sm font-medium text-blue-600 hover:underline">Operations Center →</Link>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[1120px] grid-cols-7 divide-x divide-slate-100">
              {calendarDays.map((day) => {
                const dayTours = toursByDay.get(dateOnly(day)) || [];
                const isToday = dateOnly(day) === dateOnly(new Date());
                return (
                  <div key={dateOnly(day)} className="min-h-[440px] bg-white">
                    <div className={`border-b border-slate-100 px-3 py-3 ${isToday ? 'bg-blue-50' : 'bg-slate-50'}`}>
                      <p className={`text-xs font-semibold uppercase ${isToday ? 'text-blue-700' : 'text-slate-500'}`}>{displayDate(day)}</p>
                      <p className="mt-1 text-xs text-slate-400">{dayTours.length} tour</p>
                    </div>
                    <div className="space-y-3 p-3">
                      {dayTours.map((tour) => (
                        <Link key={tour.id} href={`/dashboard/tours/${tour.id}`} className={`block rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md ${STATUS_STYLE[tour.status]}`}>
                          <div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-sm font-semibold">{tour.title}</p><span className="shrink-0 text-[10px] font-bold">{tour.pax} pax</span></div>
                          <p className="mt-2 text-[11px] opacity-80">{tour.code} · {formatRange(tour.travelDateFrom, tour.travelDateTo)}</p>
                          <p className="mt-2 text-xs font-medium">{tour.pickupTime || 'Chưa có giờ đón'}</p>
                          <p className={`mt-2 line-clamp-2 text-[11px] ${tour.assignments?.length ? 'opacity-80' : 'font-semibold text-amber-800'}`}>{assigneeNames(tour)}</p>
                          <p className="mt-2 text-[11px] opacity-70">{STATUS_LABEL[tour.status]}</p>
                        </Link>
                      ))}
                      {!dayTours.length && <p className="py-8 text-center text-xs text-slate-300">Trống</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {unassigned.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <h2 className="font-semibold text-amber-900">Cần phân công ngay</h2>
            <p className="mt-1 text-xs text-amber-700">Các tour chưa có assignment sẽ xuất hiện tại đây.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {unassigned.slice(0, 6).map((tour) => (
                <Link key={tour.id} href={`/dashboard/tours/${tour.id}`} className="rounded-xl bg-white/80 p-3 hover:bg-white"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium text-slate-800">{tour.title}</span><span className="text-xs text-amber-700">{new Date(tour.travelDateFrom).toLocaleDateString('vi-VN')}</span></div><p className="mt-1 text-xs text-slate-500">{tour.pax} khách · {tour.destination || 'Chưa có điểm đến'}</p></Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
