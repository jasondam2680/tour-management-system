'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toursApi } from '@/lib/api/tours';

type TourStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_LABEL: Record<TourStatus, string> = {
  PLANNING:'Đang lên kế hoạch', CONFIRMED:'Đã xác nhận', IN_PROGRESS:'Đang diễn ra',
  COMPLETED:'Hoàn thành', CANCELLED:'Đã huỷ',
};
const STATUS_COLOR: Record<TourStatus, string> = {
  PLANNING:'bg-yellow-100 text-yellow-800', CONFIRMED:'bg-blue-100 text-blue-800',
  IN_PROGRESS:'bg-green-100 text-green-800', COMPLETED:'bg-gray-100 text-gray-700',
  CANCELLED:'bg-red-100 text-red-700',
};
const NEXT_STATUSES: Partial<Record<TourStatus, {status:TourStatus;label:string;color:string}[]>> = {
  PLANNING:    [{status:'CONFIRMED',   label:'Xác nhận tour', color:'bg-blue-600 hover:bg-blue-700'}],
  CONFIRMED:   [{status:'IN_PROGRESS', label:'Bắt đầu tour',  color:'bg-green-600 hover:bg-green-700'}],
  IN_PROGRESS: [{status:'COMPLETED',   label:'Hoàn thành',    color:'bg-gray-700 hover:bg-gray-800'}],
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric'});
}
function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;
}
function InfoRow({label,value}:{label:string;value?:string|number|null}) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value??'—'}</span>
    </div>
  );
}

export default function TourDetailPage() {
  const {id} = useParams<{id:string}>();
  const router = useRouter();
  const [tour, setTour]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [changing, setChanging] = useState(false);
  const [showCancel, setShowCancel]     = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  async function loadTour() {
    setLoading(true);
    try { setTour(await toursApi.getOne(id)); }
    catch { router.push('/dashboard/tours'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadTour(); }, [id]);

  async function handleStatusChange(status: TourStatus) {
    setChanging(true);
    try { await toursApi.changeStatus(tour.id, status); await loadTour(); }
    finally { setChanging(false); }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    setChanging(true);
    try { await toursApi.changeStatus(tour!.id, 'CANCELLED', cancelReason); setShowCancel(false); await loadTour(); }
    finally { setChanging(false); }
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!tour) return null;

  const nextActions = NEXT_STATUSES[tour.status as TourStatus] ?? [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/dashboard/tours')} className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← Danh sách tours</button>
          <h1 className="text-2xl font-bold text-gray-900">{tour.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-400 font-mono">{tour.code}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[tour.status as TourStatus]}`}>{STATUS_LABEL[tour.status as TourStatus]}</span>
            {tour.destination && <span className="text-sm text-gray-500">📍 {tour.destination}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {nextActions.map((a) => (
            <button key={a.status} disabled={changing} onClick={() => handleStatusChange(a.status)}
              className={`${a.color} text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60`}>{a.label}</button>
          ))}
          {!['COMPLETED','CANCELLED'].includes(tour.status) && (
            <button onClick={() => setShowCancel(true)} className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium">Huỷ tour</button>
          )}
        </div>
      </div>

      {showCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Xác nhận huỷ tour</h3>
            <textarea rows={3} placeholder="Lý do huỷ (bắt buộc)" value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">Đóng</button>
              <button onClick={handleCancel} disabled={!cancelReason.trim() || changing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60">Xác nhận huỷ</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Thông tin tour</h2>
            <InfoRow label="Ngày khởi hành" value={formatDate(tour.travelDateFrom)} />
            <InfoRow label="Ngày kết thúc"  value={formatDate(tour.travelDateTo)} />
            <InfoRow label="Tổng khách"     value={`${tour.pax} (${tour.paxAdult} NL, ${tour.paxChild} TE)`} />
            <InfoRow label="Điểm đón"       value={tour.pickupLocation} />
            <InfoRow label="Giờ đón"        value={tour.pickupTime} />
            {tour.specialRequests && <InfoRow label="Yêu cầu đặc biệt" value={tour.specialRequests} />}
            {tour.cancelReason    && <InfoRow label="Lý do huỷ"        value={tour.cancelReason} />}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Phân công ({tour.assignments?.length ?? 0})</h2>
            {!tour.assignments?.length ? <p className="text-sm text-gray-400">Chưa phân công ai</p> : (
              <div className="space-y-2">
                {tour.assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{a.user.firstName} {a.user.lastName}</span>
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.role}</span>
                    </div>
                    {a.fee && <span className="text-sm text-gray-600">{formatMoney(a.fee, a.currency)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Bookings ({tour._count?.bookings ?? 0})</h2>
            {!tour.bookings?.length ? (
              <p className="text-sm text-gray-400">Chưa có booking nào</p>
            ) : (
              <div className="space-y-2">
                {tour.bookings.map((b: any) => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{b.title}</span>
                      <span className="ml-2 text-xs text-gray-400">{b.supplier?.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Khách hàng</h2>
            {tour.customer ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {tour.customer.type === 'B2B' ? tour.customer.companyName : `${tour.customer.firstName??''} ${tour.customer.lastName??''}`.trim()}
                </p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tour.customer.type}</span>
              </>
            ) : <p className="text-sm text-gray-400">Chưa gắn khách hàng</p>}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Tài chính</h2>
            <InfoRow label="Giá bán"        value={formatMoney(tour.sellingPrice, tour.currency)} />
            <InfoRow label="Chi phí"        value={formatMoney(tour.totalCost, tour.currency)} />
            <InfoRow label="Lợi nhuận"      value={formatMoney(tour.profitAmount, tour.currency)} />
            <InfoRow label="Biên LN"        value={`${Number(tour.profitMargin).toFixed(1)}%`} />
          </div>

          {tour.quotation && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Báo giá gốc</h2>
              <p className="text-sm font-mono text-blue-600">{tour.quotation.code}</p>
              <p className="text-sm text-gray-600 mt-1">{tour.quotation.title}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{formatMoney(tour.quotation.totalAmount, tour.quotation.currency)}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Lịch sử</h2>
            <InfoRow label="Xác nhận"   value={formatDate(tour.confirmedAt)} />
            <InfoRow label="Bắt đầu"    value={formatDate(tour.startedAt)} />
            <InfoRow label="Hoàn thành" value={formatDate(tour.completedAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}
