'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toursApi } from '@/lib/api/tours';
import { api } from '@/lib/api-client';

type TourStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_LABEL: Record<TourStatus, string> = {
  PLANNING: 'Đang lên kế hoạch', CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang diễn ra',   COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ',
};
const STATUS_COLOR: Record<TourStatus, string> = {
  PLANNING: 'bg-yellow-100 text-yellow-800',  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-green-100 text-green-800', COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const NEXT_STATUSES: Partial<Record<TourStatus, { status: TourStatus; label: string; color: string }[]>> = {
  PLANNING:    [{ status: 'CONFIRMED',   label: 'Xác nhận tour', color: 'bg-blue-600 hover:bg-blue-700' }],
  CONFIRMED:   [{ status: 'IN_PROGRESS', label: 'Bắt đầu tour',  color: 'bg-green-600 hover:bg-green-700' }],
  IN_PROGRESS: [{ status: 'COMPLETED',   label: 'Hoàn thành',    color: 'bg-gray-700 hover:bg-gray-800' }],
};

const CATEGORIES = [
  { value: 'HOTEL',       label: '🏨 Khách sạn' },
  { value: 'RESORT',      label: '🏖️ Resort' },
  { value: 'TRANSPORT',   label: '🚌 Xe/Tàu' },
  { value: 'BOAT',        label: '⛵ Thuyền' },
  { value: 'RESTAURANT',  label: '🍽️ Nhà hàng' },
  { value: 'GUIDE',       label: '🧭 HDV' },
  { value: 'ATTRACTION',  label: '🎡 Vé tham quan' },
  { value: 'VISA',        label: '📄 Visa' },
  { value: 'INSURANCE',   label: '🛡️ Bảo hiểm' },
  { value: 'OTHER',       label: '📦 Khác' },
];

const toNum = (v: any) => Number(v ?? 0);
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ' + currency;
}
function InfoRow({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
    </div>
  );
}

// ── Modal Thêm Booking ────────────────────────────────────────────
function AddBookingModal({ tourId, onClose, onSaved }: {
  tourId: string; onClose: () => void; onSaved: () => void;
}) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [form, setForm] = useState({
    category: 'HOTEL', supplierId: '', title: '',
    serviceDate: '', checkIn: '', checkOut: '',
    quantity: 1, unitCost: 0, currency: 'VND',
    notes: '',
  });

  // Load suppliers theo category
  useEffect(() => {
    api.get<any>('/suppliers', { category: form.category, limit: 100, isActive: true })
      .then((res: any) => setSuppliers(res?.data ?? []))
      .catch(() => setSuppliers([]));
  }, [form.category]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSave() {
    if (!form.supplierId) { setError('Vui lòng chọn nhà cung cấp'); return; }
    if (!form.title)      { setError('Vui lòng nhập tên dịch vụ'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/bookings', {
        tourId,
        supplierId:  form.supplierId,
        category:    form.category,
        title:       form.title,
        serviceDate: form.serviceDate  || undefined,
        checkIn:     form.checkIn      || undefined,
        checkOut:    form.checkOut     || undefined,
        quantity:    Number(form.quantity),
        unitCost:    Number(form.unitCost),
        currency:    form.currency,
        notes:       form.notes        || undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const isHotel  = form.category === 'HOTEL' || form.category === 'RESORT';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-gray-900 text-lg">📋 Thêm Booking dịch vụ</h3>

        {/* Category + Supplier */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Loại dịch vụ</label>
            <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nhà cung cấp <span className="text-red-500">*</span>
            </label>
            <select name="supplierId" value={form.supplierId} onChange={handleChange} className={inputCls}>
              <option value="">-- Chọn NCC --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{'★'.repeat(s.rating)} {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tên dịch vụ */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tên dịch vụ <span className="text-red-500">*</span>
          </label>
          <input name="title" value={form.title} onChange={handleChange}
            placeholder="VD: Phòng Deluxe 2 đêm, Xe 45 chỗ đón sân bay..."
            className={inputCls} />
        </div>

        {/* Ngày — hotel: check-in/out, các loại khác: ngày dịch vụ */}
        {isHotel ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Check-in</label>
              <input type="date" name="checkIn" value={form.checkIn} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Check-out</label>
              <input type="date" name="checkOut" value={form.checkOut} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ngày dịch vụ</label>
            <input type="date" name="serviceDate" value={form.serviceDate} onChange={handleChange} className={inputCls} />
          </div>
        )}

        {/* Số lượng + Đơn giá + Tiền tệ */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng</label>
            <input type="number" name="quantity" min={1} value={form.quantity} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Đơn giá (vốn)</label>
            <input type="number" name="unitCost" min={0} value={form.unitCost} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tiền tệ</label>
            <select name="currency" value={form.currency} onChange={handleChange} className={inputCls}>
              {['VND', 'USD', 'EUR', 'THB'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Preview tổng */}
        <div className="bg-gray-50 rounded-lg px-4 py-2.5 flex justify-between text-sm">
          <span className="text-gray-500">Tổng chi phí ước tính</span>
          <span className="font-bold text-gray-900">
            {formatMoney(Number(form.quantity) * Number(form.unitCost), form.currency)}
          </span>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className={inputCls} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? 'Đang tạo...' : 'Tạo Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Tạo Invoice ─────────────────────────────────────────────
function CreateInvoiceModal({ tour, onClose, onSaved }: {
  tour: any; onClose: () => void; onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm] = useState({
    type:       'RECEIVABLE',
    subtotal:   toNum(tour.sellingPrice),
    taxPct:     0,
    currency:   tour.currency ?? 'USD',
    dueDate:    '',
    notes:      '',
  });

  const taxAmount   = (form.subtotal * form.taxPct) / 100;
  const totalAmount = form.subtotal + taxAmount;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'subtotal' || name === 'taxPct' ? Number(value) : value }));
  }

  async function handleSave() {
    if (!form.subtotal) { setError('Vui lòng nhập số tiền'); return; }
    if (!tour.customerId) { setError('Tour chưa gắn khách hàng, không thể tạo invoice'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/finance/invoices', {
        type:       form.type,
        customerId: tour.customerId,
        tourId:     tour.id,
        subtotal:   form.subtotal,
        taxPct:     form.taxPct,
        currency:   form.currency,
        dueDate:    form.dueDate || undefined,
        notes:      form.notes   || undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 text-lg">💰 Tạo Hoá đơn</h3>

        {/* Tour info */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
          <p className="text-xs text-blue-500 font-medium">Tour liên kết</p>
          <p className="text-sm font-semibold text-blue-900">{tour.code} — {tour.title}</p>
          {tour.customer && (
            <p className="text-xs text-blue-600 mt-0.5">
              Khách: {tour.customer.type === 'B2B'
                ? tour.customer.companyName
                : `${tour.customer.firstName ?? ''} ${tour.customer.lastName ?? ''}`.trim()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Loại hoá đơn</label>
            <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
              <option value="RECEIVABLE">💙 Thu khách (AR)</option>
              <option value="PAYABLE">🟠 Trả NCC (AP)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tiền tệ</label>
            <select name="currency" value={form.currency} onChange={handleChange} className={inputCls}>
              {['USD', 'VND', 'EUR', 'THB', 'CNY'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Subtotal <span className="text-red-500">*</span>
            </label>
            <input type="number" name="subtotal" min={0} value={form.subtotal} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Thuế (%)</label>
            <input type="number" name="taxPct" min={0} max={100} step={0.5} value={form.taxPct} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        {/* Preview tổng */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatMoney(form.subtotal, form.currency)}</span>
          </div>
          {form.taxPct > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Thuế ({form.taxPct}%)</span>
              <span>{formatMoney(taxAmount, form.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
            <span>Tổng cộng</span>
            <span className="text-blue-600">{formatMoney(totalAmount, form.currency)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hạn thanh toán</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
            placeholder="VD: Thanh toán 50% trước khởi hành, 50% sau tour..." className={inputCls} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            Huỷ
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? 'Đang tạo...' : 'Tạo hoá đơn'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function TourDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [tour, setTour]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [changing, setChanging]   = useState(false);
  const [showCancel, setShowCancel]       = useState(false);
  const [cancelReason, setCancelReason]   = useState('');
  const [showAddBooking, setShowAddBooking]     = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

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
    try {
      await toursApi.changeStatus(tour.id, 'CANCELLED', cancelReason);
      setShowCancel(false); await loadTour();
    } finally { setChanging(false); }
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!tour)   return null;

  const nextActions = NEXT_STATUSES[tour.status as TourStatus] ?? [];
  const canAddBooking = !['COMPLETED', 'CANCELLED'].includes(tour.status);
  const canInvoice    = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(tour.status);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/dashboard/tours')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← Danh sách tours</button>
          <h1 className="text-2xl font-bold text-gray-900">{tour.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-400 font-mono">{tour.code}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[tour.status as TourStatus]}`}>
              {STATUS_LABEL[tour.status as TourStatus]}
            </span>
            {tour.destination && <span className="text-sm text-gray-500">📍 {tour.destination}</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap justify-end">
          {/* ── Gap 1: Thêm Booking ── */}
          {canAddBooking && (
            <button onClick={() => setShowAddBooking(true)}
              className="border border-blue-300 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium">
              📋 + Thêm Booking
            </button>
          )}

          {/* ── Gap 2: Tạo Invoice ── */}
          {canInvoice && (
            <button onClick={() => setShowCreateInvoice(true)}
              className="border border-emerald-300 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-sm font-medium">
              💰 Tạo Hoá đơn
            </button>
          )}

          {/* Status actions */}
          {nextActions.map((a) => (
            <button key={a.status} disabled={changing} onClick={() => handleStatusChange(a.status)}
              className={`${a.color} text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60`}>
              {a.label}
            </button>
          ))}

          {!['COMPLETED', 'CANCELLED'].includes(tour.status) && (
            <button onClick={() => setShowCancel(true)}
              className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium">
              Huỷ tour
            </button>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showAddBooking && (
        <AddBookingModal
          tourId={tour.id}
          onClose={() => setShowAddBooking(false)}
          onSaved={() => { setShowAddBooking(false); loadTour(); }}
        />
      )}
      {showCreateInvoice && (
        <CreateInvoiceModal
          tour={tour}
          onClose={() => setShowCreateInvoice(false)}
          onSaved={() => { setShowCreateInvoice(false); loadTour(); }}
        />
      )}

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Xác nhận huỷ tour</h3>
            <textarea rows={3} placeholder="Lý do huỷ (bắt buộc)" value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">Đóng</button>
              <button onClick={handleCancel} disabled={!cancelReason.trim() || changing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60">
                Xác nhận huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">

          {/* Thông tin tour */}
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

          {/* Bookings */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">
                Bookings dịch vụ ({tour._count?.bookings ?? 0})
              </h2>
              {canAddBooking && (
                <button onClick={() => setShowAddBooking(true)}
                  className="text-xs text-blue-600 hover:underline font-medium">
                  + Thêm booking →
                </button>
              )}
            </div>
            {!tour.bookings?.length ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 mb-2">Chưa có booking nào</p>
                {canAddBooking && (
                  <button onClick={() => setShowAddBooking(true)}
                    className="text-sm text-blue-600 hover:underline">
                    + Thêm booking đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {tour.bookings.map((b: any) => (
                  <div key={b.id}
                    className="flex justify-between items-center py-2.5 px-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{b.title}</span>
                      <span className="ml-2 text-xs text-gray-400">{b.supplier?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        b.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>{b.status}</span>
                      <Link href={`/dashboard/bookings/${b.id}`}
                        className="text-xs text-blue-600 hover:underline">Chi tiết →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">
                Hoá đơn ({tour._count?.invoices ?? 0})
              </h2>
              {canInvoice && (
                <button onClick={() => setShowCreateInvoice(true)}
                  className="text-xs text-emerald-600 hover:underline font-medium">
                  + Tạo hoá đơn →
                </button>
              )}
            </div>
            {!tour.invoices?.length ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 mb-2">Chưa có hoá đơn nào</p>
                {canInvoice && (
                  <button onClick={() => setShowCreateInvoice(true)}
                    className="text-sm text-emerald-600 hover:underline">
                    + Tạo hoá đơn đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {tour.invoices.map((inv: any) => (
                  <div key={inv.id}
                    className="flex justify-between items-center py-2.5 px-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div>
                      <span className="text-sm font-medium text-gray-900 font-mono">{inv.code}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === 'PAID'    ? 'bg-green-100 text-green-700' :
                        inv.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{inv.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatMoney(toNum(inv.totalAmount), inv.currency)}
                      </span>
                      <Link href={`/dashboard/finance/invoices/${inv.id}`}
                        className="text-xs text-blue-600 hover:underline">Chi tiết →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">
              Phân công ({tour.assignments?.length ?? 0})
            </h2>
            {!tour.assignments?.length ? (
              <p className="text-sm text-gray-400">Chưa phân công ai</p>
            ) : (
              <div className="space-y-2">
                {tour.assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {a.user.firstName} {a.user.lastName}
                      </span>
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.role}</span>
                    </div>
                    {a.fee && <span className="text-sm text-gray-600">{formatMoney(a.fee, a.currency)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incidents */}
          {(tour.incidents?.length ?? 0) > 0 && (
            <div className="bg-white border border-red-200 rounded-xl p-5">
              <h2 className="font-semibold text-red-700 mb-3">Sự cố ({tour.incidents.length})</h2>
              <div className="space-y-2">
                {tour.incidents.map((inc: any) => (
                  <div key={inc.id} className="py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        inc.severity === 'HIGH'     ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{inc.severity}</span>
                      <span className="text-sm font-medium text-gray-900">{inc.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{inc.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Khách hàng */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Khách hàng</h2>
            {tour.customer ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {tour.customer.type === 'B2B'
                    ? tour.customer.companyName
                    : `${tour.customer.firstName ?? ''} ${tour.customer.lastName ?? ''}`.trim()}
                </p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {tour.customer.type}
                </span>
              </>
            ) : <p className="text-sm text-gray-400">Chưa gắn khách hàng</p>}
          </div>

          {/* Tài chính */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Tài chính</h2>
            <InfoRow label="Giá bán"    value={formatMoney(toNum(tour.sellingPrice), tour.currency)} />
            <InfoRow label="Chi phí"    value={formatMoney(toNum(tour.totalCost), tour.currency)} />
            <InfoRow label="Lợi nhuận" value={
              <span className={toNum(tour.profitAmount) >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                {formatMoney(toNum(tour.profitAmount), tour.currency)}
              </span>
            } />
            <InfoRow label="Biên LN" value={`${toNum(tour.profitMargin).toFixed(1)}%`} />
          </div>

          {/* Quotation gốc */}
          {tour.quotation && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Báo giá gốc</h2>
              <p className="text-sm font-mono text-blue-600">{tour.quotation.code}</p>
              <p className="text-sm text-gray-600 mt-1">{tour.quotation.title}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatMoney(toNum(tour.quotation.totalAmount), tour.quotation.currency)}
              </p>
            </div>
          )}

          {/* Lịch sử */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Lịch sử</h2>
            <InfoRow label="Xác nhận"   value={formatDate(tour.confirmedAt)} />
            <InfoRow label="Bắt đầu"    value={formatDate(tour.startedAt)} />
            <InfoRow label="Hoàn thành" value={formatDate(tour.completedAt)} />
            <InfoRow label="Cập nhật"   value={formatDate(tour.updatedAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}