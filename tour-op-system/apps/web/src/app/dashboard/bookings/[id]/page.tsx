'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsApi, Booking, BookingStatus } from '@/lib/api/bookings';

const STATUS_LABEL: Record<BookingStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};
const STATUS_COLOR: Record<BookingStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const NEXT_STATUS: Partial<
  Record<BookingStatus, { status: BookingStatus; label: string; color: string }[]>
> = {
  DRAFT: [
    { status: 'PENDING', label: '📤 Gửi yêu cầu', color: 'bg-yellow-500 hover:bg-yellow-600' },
  ],
  PENDING: [{ status: 'CONFIRMED', label: '✅ Xác nhận', color: 'bg-blue-600 hover:bg-blue-700' }],
  CONFIRMED: [
    { status: 'COMPLETED', label: '🏁 Hoàn thành', color: 'bg-gray-700 hover:bg-gray-800' },
  ],
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
function formatMoney(v: number | string, c: string) {
  return new Intl.NumberFormat('vi-VN').format(Number(v)) + ' ' + c;
}
function InfoRow({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [confirmNo, setConfirmNo] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payment, setPayment] = useState({
    amount: 0,
    currency: 'VND',
    method: 'bank_transfer',
    reference: '',
    notes: '',
  });

  async function load() {
    setLoading(true);
    try {
      setBooking(await bookingsApi.getOne(id));
    } catch {
      router.push('/dashboard/bookings');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  async function handleStatus(status: BookingStatus) {
    setChanging(true);
    try {
      if (status === 'CONFIRMED') {
        setShowConfirm(true);
        return;
      }
      await bookingsApi.changeStatus(id, status);
      await load();
    } finally {
      setChanging(false);
    }
  }

  async function handleConfirm() {
    setChanging(true);
    try {
      await bookingsApi.changeStatus(id, 'CONFIRMED', confirmNo);
      setShowConfirm(false);
      await load();
    } finally {
      setChanging(false);
    }
  }

  async function handlePayment() {
    if (!payment.amount) return;
    setChanging(true);
    try {
      await bookingsApi.addPayment(id, { ...payment, amount: Number(payment.amount) });
      setShowPayment(false);
      await load();
    } finally {
      setChanging(false);
    }
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!booking) return null;

  const nextActions = NEXT_STATUS[booking.status] ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2 block"
          >
            ← Quay lại
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{booking.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-mono text-gray-400">{booking.code}</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[booking.status]}`}
            >
              {STATUS_LABEL[booking.status]}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {nextActions.map((a) => (
            <button
              key={a.status}
              disabled={changing}
              onClick={() => handleStatus(a.status)}
              className={`${a.color} text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60`}
            >
              {a.label}
            </button>
          ))}
          {booking.status === 'CONFIRMED' && booking.amountDue > 0 && (
            <button
              onClick={() => setShowPayment(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              💳 Ghi nhận thanh toán
            </button>
          )}
          {!['COMPLETED', 'CANCELLED'].includes(booking.status) && (
            <button
              onClick={() => bookingsApi.changeStatus(id, 'CANCELLED').then(load)}
              className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Huỷ
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-semibold text-gray-900">Xác nhận booking</h3>
            <input
              placeholder="Mã xác nhận từ NCC (nếu có)"
              value={confirmNo}
              onChange={(e) => setConfirmNo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirm}
                disabled={changing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-semibold text-gray-900">Ghi nhận thanh toán NCC</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Số tiền</label>
                <input
                  type="number"
                  min={0}
                  value={payment.amount}
                  onChange={(e) => setPayment((p) => ({ ...p, amount: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tiền tệ</label>
                <select
                  value={payment.currency}
                  onChange={(e) => setPayment((p) => ({ ...p, currency: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {['VND', 'USD', 'EUR', 'THB'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <select
              value={payment.method}
              onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="bank_transfer">Chuyển khoản</option>
              <option value="cash">Tiền mặt</option>
              <option value="card">Thẻ</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                Đóng
              </button>
              <button
                onClick={handlePayment}
                disabled={!payment.amount || changing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
              >
                Lưu thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Thông tin dịch vụ</h2>
            <InfoRow label="Loại" value={booking.category} />
            <InfoRow label="Ngày DV" value={formatDate(booking.serviceDate)} />
            <InfoRow label="Check-in" value={formatDate(booking.checkIn)} />
            <InfoRow label="Check-out" value={formatDate(booking.checkOut)} />
            <InfoRow label="Số lượng" value={booking.quantity} />
            <InfoRow label="Đơn giá" value={formatMoney(booking.unitCost, booking.currency)} />
            <InfoRow label="Mã xác nhận" value={booking.confirmationNo} />
          </div>

          {booking.items && booking.items.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-3">
                Chi tiết ({booking.items.length})
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    {['Tên', 'SL', 'Đơn giá', 'Tổng'].map((h) => (
                      <th key={h} className="py-2 font-medium text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {booking.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-2 text-gray-800">{item.name}</td>
                      <td className="py-2 text-gray-600">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2 text-gray-600">
                        {formatMoney(item.unitCost, booking.currency)}
                      </td>
                      <td className="py-2 font-medium">
                        {formatMoney(item.totalCost, booking.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">
              Lịch sử thanh toán ({booking.payments?.length ?? 0})
            </h2>
            {!booking.payments?.length ? (
              <p className="text-sm text-gray-400">Chưa có thanh toán nào</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    {['Ngày', 'Số tiền', 'PT', 'Tham chiếu'].map((h) => (
                      <th key={h} className="py-2 font-medium text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {booking.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2 text-gray-600">{formatDate(p.paidAt ?? p.createdAt)}</td>
                      <td className="py-2 font-medium">{formatMoney(p.amount, p.currency)}</td>
                      <td className="py-2 text-gray-600">{p.method}</td>
                      <td className="py-2 text-gray-400 font-mono text-xs">{p.reference ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Tour</h2>
            {booking.tour ? (
              <Link
                href={`/dashboard/tours/${booking.tour.id}`}
                className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
              >
                <p className="text-sm font-medium text-blue-600">{booking.tour.code}</p>
                <p className="text-sm text-gray-700">{booking.tour.title}</p>
              </Link>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Nhà cung cấp</h2>
            {booking.supplier ? (
              <>
                <p className="text-sm font-medium text-gray-900">{booking.supplier.name}</p>
                {booking.supplier.phone && (
                  <p className="text-sm text-gray-500 mt-1">📞 {booking.supplier.phone}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Tài chính</h2>
            <InfoRow
              label="Tổng chi phí"
              value={formatMoney(booking.totalCost, booking.currency)}
            />
            <InfoRow
              label="Đã thanh toán"
              value={formatMoney(booking.amountPaid, booking.currency)}
            />
            <InfoRow label="Còn lại" value={formatMoney(booking.amountDue, booking.currency)} />
            <div className="pt-2">
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  booking.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-700'
                    : booking.paymentStatus === 'PARTIAL'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {booking.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
