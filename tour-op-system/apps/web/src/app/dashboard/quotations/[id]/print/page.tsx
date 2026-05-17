'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';

const MEAL_LABEL: Record<string, string> = { B: '🍳 Sáng', L: '🍲 Trưa', D: '🍽️ Tối' };
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

function formatMoney(v: any, currency = 'USD') {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(v ?? 0))) + ' ' + currency;
}
function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function QuotationPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [q, setQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any>(`/quotations/${id}`)
      .then(setQ)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!q) return null;

  const items = q.items ?? [];
  const days = q.itineraryVersion?.days || [];

  return (
    <div className="max-w-4xl mx-auto p-8 print:p-4">
      {/* Print Button */}
      <div className="no-print flex justify-end mb-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QUOTATION</h1>
            <p className="text-sm text-gray-500 mt-1">{q.code}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">{q.title}</p>
            <p className="text-sm text-gray-500">Date: {formatDate(q.createdAt)}</p>
            <p className="text-sm text-gray-500">Valid until: {formatDate(q.validUntil)}</p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">Bill To</h3>
          <p className="font-medium text-gray-900">
            {q.customer?.type === 'B2B'
              ? q.customer?.companyName
              : [q.customer?.firstName, q.customer?.lastName].filter(Boolean).join(' ')}
          </p>
          {q.customer?.email && <p className="text-sm text-gray-500">{q.customer.email}</p>}
        </div>
        <div className="text-right">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">Tour Details</h3>
          <p className="text-sm text-gray-700">
            {q.pax} pax · {q.paxAdult} adults · {q.paxChild} children
          </p>
          <p className="text-sm text-gray-700">
            {formatDate(q.travelDateFrom)} → {formatDate(q.travelDateTo)}
          </p>
          {q.destination && <p className="text-sm text-gray-700">📍 {q.destination}</p>}
          {q.tourQuotationType && (
            <p className="text-sm text-gray-700 font-semibold">
              {q.tourQuotationType === 'GROUP' ? 'Group Tour' : 'Private Tour'}
            </p>
          )}
        </div>
      </div>

      {/* Itinerary */}
      {days.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
            ITINERARY
          </h2>
          {days.map((day: any) => (
            <div key={day.id} className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-blue-700">Day {day.dayNumber}</span>
                {day.title && <span className="font-medium text-gray-700">— {day.title}</span>}
                {day.meals?.length > 0 && (
                  <span className="text-xs text-gray-400 ml-2">
                    {day.meals.map((m: string) => MEAL_LABEL[m] || m).join(' · ')}
                  </span>
                )}
              </div>
              {day.description && <p className="text-sm text-gray-600 mb-1">{day.description}</p>}
              {day.accommodation && <p className="text-xs text-gray-400">🏨 {day.accommodation}</p>}
              {day.activities?.length > 0 && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {day.activities.map((act: any) => (
                    <div key={act.id} className="flex items-start gap-2 text-sm">
                      {act.time && (
                        <span className="text-xs font-mono text-blue-600 w-10 flex-shrink-0">
                          {act.time}
                        </span>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">{act.title}</span>
                        {act.location && (
                          <span className="text-xs text-gray-400 ml-1">📍 {act.location}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Services & Pricing */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
          SERVICES & PRICING
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-600 w-8">#</th>
              <th className="text-left py-2 font-semibold text-gray-600">Service</th>
              <th className="text-center py-2 font-semibold text-gray-600">Qty</th>
              <th className="text-right py-2 font-semibold text-gray-600">Unit Price</th>
              <th className="text-right py-2 font-semibold text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items
              .filter((i: any) => i.isIncluded)
              .map((item: any, idx: number) => (
                <tr key={item.id}>
                  <td className="py-2 text-gray-400">{idx + 1}</td>
                  <td className="py-2">
                    <span className="mr-1">{CAT_ICON[item.category?.toLowerCase()] ?? '📦'}</span>
                    <span className="font-medium text-gray-900">{item.name}</span>
                    {item.description && (
                      <p className="text-xs text-gray-400">{item.description}</p>
                    )}
                  </td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">
                    {formatMoney(item.sellingPrice, item.currency)}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {formatMoney(Number(item.sellingPrice) * Number(item.quantity), item.currency)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-72 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatMoney(q.subtotal, q.currency)}</span>
          </div>
          {Number(q.discountAmount) > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Discount ({Number(q.discountPct)}%)</span>
              <span>−{formatMoney(q.discountAmount, q.currency)}</span>
            </div>
          )}
          {Number(q.taxAmount) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax ({Number(q.taxPct)}%)</span>
              <span>{formatMoney(q.taxAmount, q.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2 mt-2">
            <span>Total</span>
            <span>{formatMoney(q.totalAmount, q.currency)}</span>
          </div>
          {Number(q.pax) > 0 && (
            <div className="text-right text-xs text-gray-400">
              {formatMoney(Number(q.totalAmount) / Number(q.pax), q.currency)} / person
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {q.notes && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{q.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 mt-8 text-center text-xs text-gray-400">
        <p>This quotation is valid until {formatDate(q.validUntil)}</p>
        <p className="mt-1">Thank you for choosing our services!</p>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
