'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Quotation, QuotationStatus, QuotationItem } from '@/types';

const toNum = (v: any): number => Number(v ?? 0);
function formatMoney(v: any, currency = 'USD') {
  return new Intl.NumberFormat('vi-VN').format(Math.round(toNum(v))) + ' ' + currency;
}
function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
function getCustomerName(q: any) {
  const c = q.customer;
  if (!c) return '—';
  return c.type === 'B2B'
    ? (c.companyName ?? '—')
    : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  SENT: 'Đã gửi',
  VIEWED: 'Đã xem',
  NEGOTIATING: 'Đang thương lượng',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  EXPIRED: 'Hết hạn',
  CONVERTED: 'Đã tạo Tour',
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-cyan-100 text-cyan-700',
  NEGOTIATING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
  CONVERTED: 'bg-purple-100 text-purple-700',
};
const NEXT_ACTIONS: Partial<Record<string, { status: string; label: string; color: string }[]>> = {
  DRAFT: [{ status: 'SENT', label: '📤 Gửi báo giá', color: 'bg-blue-600 hover:bg-blue-700' }],
  SENT: [
    { status: 'APPROVED', label: '✅ Duyệt', color: 'bg-green-600 hover:bg-green-700' },
    { status: 'NEGOTIATING', label: '💬 Thương lượng', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { status: 'REJECTED', label: '❌ Từ chối', color: 'bg-red-500 hover:bg-red-600' },
  ],
  VIEWED: [
    { status: 'APPROVED', label: '✅ Duyệt', color: 'bg-green-600 hover:bg-green-700' },
    { status: 'NEGOTIATING', label: '💬 Thương lượng', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { status: 'REJECTED', label: '❌ Từ chối', color: 'bg-red-500 hover:bg-red-600' },
  ],
  NEGOTIATING: [
    { status: 'APPROVED', label: '✅ Duyệt', color: 'bg-green-600 hover:bg-green-700' },
    { status: 'REJECTED', label: '❌ Từ chối', color: 'bg-red-500 hover:bg-red-600' },
  ],
  APPROVED: [
    { status: 'CONVERTED', label: '🗺️ Tạo Tour', color: 'bg-purple-600 hover:bg-purple-700' },
  ],
};
const CAT_ICON: Record<string, string> = {
  hotel: '🏨',
  resort: '🏖️',
  restaurant: '🍽️',
  transport: '🚌',
  boat: '⛵',
  guide: '🧭',
  attraction: '🎡',
  visa: '📄',
  insurance: '🛡️',
  other: '📦',
  tour_package: '🗺️',
};
const MEAL_LABEL: Record<string, string> = { B: '🍳 Sáng', L: '🍲 Trưa', D: '🍽️ Tối' };

function InfoRow({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value ?? '—'}</span>
    </div>
  );
}

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<any>(`/quotations/${id}`);
      setQuotation(data);
    } catch {
      router.push('/dashboard/quotations');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(status: string, reason?: string) {
    setChanging(true);
    try {
      await api.patch(`/quotations/${id}/status`, { status, reason });
      await load();
    } finally {
      setChanging(false);
    }
  }

  async function handleAction(status: string) {
    if (status === 'REJECTED') {
      setShowReject(true);
      return;
    }
    if (status === 'CONVERTED') {
      if (
        !confirm(
          'Tạo Tour từ báo giá này? Hệ thống sẽ tự động tạo Tour và các Bookings từ dịch vụ trong báo giá.',
        )
      )
        return;
      setConverting(true);
      try {
        const result = await api.post<any>(`/tours/convert-from-quotation/${id}`, {});
        setConvertResult(result);
        await load();
      } catch (e: any) {
        alert(e?.response?.data?.message ?? 'Không thể tạo tour');
      } finally {
        setConverting(false);
      }
      return;
    }
    await handleStatusChange(status);
  }

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const result = await api.post<any>(`/quotations/${id}/duplicate`, {});
      router.push(`/dashboard/quotations/${result.id}`);
    } finally {
      setDuplicating(false);
    }
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!quotation) return null;

  const nextActions = NEXT_ACTIONS[quotation.status] ?? [];
  const items = quotation.items ?? [];
  const canEdit = ['DRAFT', 'NEGOTIATING'].includes(quotation.status);

  const itemsByDay: Record<string, any[]> = items.reduce(
    (acc: any, item: any) => {
      const key = item.day ? `Ngày ${item.day}` : 'Chung';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, any[]>,
  );
  const dayKeys = Object.keys(itemsByDay).sort((a, b) => {
    if (a === 'Chung') return 1;
    if (b === 'Chung') return -1;
    return Number(a.replace('Ngày ', '')) - Number(b.replace('Ngày ', ''));
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard/quotations')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2 block"
          >
            ← Danh sách báo giá
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{quotation.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm font-mono text-gray-400">{quotation.code}</span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[quotation.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {STATUS_LABEL[quotation.status] ?? quotation.status}
            </span>
            {quotation.destination && (
              <span className="text-sm text-gray-500">📍 {quotation.destination}</span>
            )}
            {quotation.tourQuotationType && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  quotation.tourQuotationType === 'GROUP'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-teal-100 text-teal-700'
                }`}
              >
                {quotation.tourQuotationType === 'GROUP' ? '👥 Group Tour' : '🎯 Private Tour'}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end flex-shrink-0">
          {canEdit && (
            <Link
              href={`/dashboard/quotations/${id}/edit`}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium"
            >
              ✏️ Chỉnh sửa
            </Link>
          )}
          <Link
            href={`/dashboard/quotations/${id}/workflow`}
            className="border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium"
          >
            🔁 Workflow báo giá
          </Link>
          <Link
            href={`/dashboard/quotations/${id}/print`}
            target="_blank"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium"
          >
            🖨️ Export PDF
          </Link>
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {duplicating ? 'Đang copy...' : '📋 Nhân bản'}
          </button>
          {nextActions.map((a) => (
            <button
              key={a.status}
              disabled={changing || converting}
              onClick={() => handleAction(a.status)}
              className={`${a.color} text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60`}
            >
              {a.status === 'CONVERTED' && converting ? 'Đang tạo...' : a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reject modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Xác nhận từ chối</h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Lý do từ chối (bắt buộc)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReject(false);
                  setRejectReason('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                Huỷ
              </button>
              <button
                disabled={!rejectReason.trim() || changing}
                onClick={async () => {
                  await handleStatusChange('REJECTED', rejectReason);
                  setShowReject(false);
                  setRejectReason('');
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Success Modal */}
      {convertResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="text-center">
              <p className="text-4xl mb-2">🎉</p>
              <h3 className="font-semibold text-gray-900 text-lg">Tạo Tour thành công!</h3>
              <p className="text-sm text-gray-500 mt-1">
                Đã tạo Tour và {convertResult.bookings?.length || 0} bookings tự động
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tour Code</span>
                <span className="font-mono font-semibold">{convertResult.tour?.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bookings tạo</span>
                <span className="font-semibold">{convertResult.bookings?.length || 0}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConvertResult(null)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                Đóng
              </button>
              <Link
                href={`/dashboard/tours/${convertResult.tour?.id}`}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center"
              >
                🗺️ Xem Tour
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Itinerary Section */}
      {quotation.itineraryVersion?.days && quotation.itineraryVersion.days.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-sm">
              🗺️ Chương trình ({quotation.itineraryVersion.days.length} ngày)
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {quotation.itineraryVersion.days.map((day: any) => (
              <div key={day.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-blue-600">Ngày {day.dayNumber}</span>
                  {day.title && (
                    <span className="text-sm font-medium text-gray-700">— {day.title}</span>
                  )}
                  {day.meals?.length > 0 && (
                    <span className="text-xs text-gray-400 ml-2">
                      {day.meals.map((m: string) => MEAL_LABEL[m] || m).join(' · ')}
                    </span>
                  )}
                </div>
                {day.description && <p className="text-sm text-gray-500 mb-2">{day.description}</p>}
                {day.accommodation && (
                  <p className="text-xs text-gray-400 mb-2">🏨 {day.accommodation}</p>
                )}
                {day.activities?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {day.activities.map((act: any) => (
                      <div key={act.id} className="flex items-start gap-2 text-sm">
                        {act.time && (
                          <span className="text-xs font-mono text-blue-500 w-12 flex-shrink-0">
                            {act.time}
                          </span>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">{act.title}</span>
                          {act.location && (
                            <span className="text-xs text-gray-400 ml-1">📍 {act.location}</span>
                          )}
                          {act.description && (
                            <p className="text-xs text-gray-400">{act.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">
                Dịch vụ ({items.length} items)
              </h3>
              <span className="text-xs text-gray-400">
                {quotation.pax} khách · {formatDate(quotation.travelDateFrom)}
                {quotation.travelDateTo ? ` → ${formatDate(quotation.travelDateTo)}` : ''}
              </span>
            </div>
            {items.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">Chưa có dịch vụ nào</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {dayKeys.map((dayKey) => (
                  <div key={dayKey}>
                    {dayKeys.length > 1 && (
                      <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          📅 {dayKey}
                        </span>
                      </div>
                    )}
                    {itemsByDay[dayKey].map((item: any) => {
                      const total = toNum(item.sellingPrice) * toNum(item.quantity);
                      const margin =
                        toNum(item.buyingPrice) > 0
                          ? ((toNum(item.sellingPrice) - toNum(item.buyingPrice)) /
                              toNum(item.buyingPrice)) *
                            100
                          : 0;
                      return (
                        <div
                          key={item.id}
                          className={`px-5 py-4 flex items-start gap-4 ${!item.isIncluded ? 'opacity-50' : ''}`}
                        >
                          <span className="text-xl flex-shrink-0 mt-0.5">
                            {CAT_ICON[item.category?.toLowerCase()] ?? '📦'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.name}
                                  {item.isOptional && (
                                    <span className="ml-1.5 text-xs text-gray-400 font-normal">
                                      (tuỳ chọn)
                                    </span>
                                  )}
                                  {!item.isIncluded && (
                                    <span className="ml-1.5 text-xs text-orange-500 font-normal">
                                      (không tính giá)
                                    </span>
                                  )}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {toNum(item.quantity)} ×{' '}
                                  {formatMoney(item.sellingPrice, item.currency)}
                                  <span
                                    className={`ml-1 font-medium ${margin >= 20 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-600' : 'text-red-500'}`}
                                  >
                                    ({margin.toFixed(0)}% markup)
                                  </span>
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatMoney(total, item.currency)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  vốn:{' '}
                                  {formatMoney(
                                    toNum(item.buyingPrice) * toNum(item.quantity),
                                    item.currency,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {(quotation.notes || quotation.internalNotes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quotation.notes && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">📝 Ghi chú cho khách</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{quotation.notes}</p>
                </div>
              )}
              {quotation.internalNotes && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">🔒 Ghi chú nội bộ</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {quotation.internalNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 text-sm">Tổng báo giá</h3>
            </div>
            <div className="p-5 space-y-0">
              <InfoRow
                label="Subtotal"
                value={formatMoney(quotation.subtotal, quotation.currency)}
              />
              {toNum(quotation.discountAmount) > 0 && (
                <InfoRow
                  label={`Giảm giá (${toNum(quotation.discountPct)}%)`}
                  value={
                    <span className="text-red-500">
                      −{formatMoney(quotation.discountAmount, quotation.currency)}
                    </span>
                  }
                />
              )}
              {toNum(quotation.taxAmount) > 0 && (
                <InfoRow
                  label={`Thuế (${toNum(quotation.taxPct)}%)`}
                  value={formatMoney(quotation.taxAmount, quotation.currency)}
                />
              )}
              <div className="flex justify-between pt-3 mt-1 border-t border-gray-200">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatMoney(quotation.totalAmount, quotation.currency)}
                </span>
              </div>
              {toNum(quotation.pax) > 0 && (
                <div className="mt-3 bg-blue-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-blue-500">Giá / người</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatMoney(
                      toNum(quotation.totalAmount) / toNum(quotation.pax),
                      quotation.currency,
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 border-t border-dashed border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 pt-4">
                🔒 Nội bộ
              </p>
              <InfoRow
                label="Tổng vốn"
                value={formatMoney(quotation.totalCost, quotation.currency)}
              />
              <InfoRow
                label="Lợi nhuận"
                value={
                  <span
                    className={
                      toNum(quotation.profitAmount) >= 0
                        ? 'text-emerald-600 font-semibold'
                        : 'text-red-600 font-semibold'
                    }
                  >
                    {formatMoney(quotation.profitAmount, quotation.currency)}
                  </span>
                }
              />
              <div
                className={`mt-3 rounded-xl p-4 text-center ${toNum(quotation.profitMargin) >= 20 ? 'bg-emerald-50' : toNum(quotation.profitMargin) >= 10 ? 'bg-amber-50' : 'bg-red-50'}`}
              >
                <p
                  className={`text-3xl font-black ${toNum(quotation.profitMargin) >= 20 ? 'text-emerald-600' : toNum(quotation.profitMargin) >= 10 ? 'text-amber-600' : 'text-red-600'}`}
                >
                  {toNum(quotation.profitMargin).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5">biên lợi nhuận</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">ℹ️ Thông tin</h3>
            <InfoRow label="Khách hàng" value={getCustomerName(quotation)} />
            <InfoRow label="Loại KH" value={quotation.customer?.type} />
            <InfoRow
              label="Số khách"
              value={`${quotation.pax} (${quotation.paxAdult ?? 0} NL · ${quotation.paxChild ?? 0} TE)`}
            />
            <InfoRow label="Ngày đi" value={formatDate(quotation.travelDateFrom)} />
            <InfoRow label="Ngày về" value={formatDate(quotation.travelDateTo)} />
            <InfoRow label="Tiền tệ" value={quotation.currency} />
            <InfoRow label="Hiệu lực" value={formatDate(quotation.validUntil)} />
            <InfoRow label="Phiên bản" value={`v${quotation.version ?? 1}`} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">📅 Lịch sử</h3>
            <InfoRow label="Tạo lúc" value={formatDate(quotation.createdAt)} />
            <InfoRow label="Gửi lúc" value={formatDate(quotation.sentAt)} />
            <InfoRow label="Duyệt lúc" value={formatDate(quotation.approvedAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}
