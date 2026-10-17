'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';

const MEAL_LABEL: Record<string, string> = { B: 'Sáng', L: 'Trưa', D: 'Tối' };

function formatMoney(value: unknown, currency = 'VND') {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(value || 0)))} ${currency}`;
}

function formatDate(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getCustomerName(customer: any) {
  if (!customer) return '—';
  return customer.type === 'B2B'
    ? customer.companyName || '—'
    : [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—';
}

function addDays(value: string | Date | null | undefined, days: number) {
  if (!value) return null;
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function activitiesByPeriod(day: any) {
  const activities = day.activities || [];
  return activities.reduce((result: { morning: string[]; afternoon: string[]; evening: string[]; all: string[] }, activity: any) => {
    const label = `${activity.time ? `${activity.time} — ` : ''}${activity.title}${activity.location ? ` (${activity.location})` : ''}`;
    result.all.push(label);
    const hour = activity.time ? Number(String(activity.time).slice(0, 2)) : 12;
    if (hour < 12) result.morning.push(label);
    else if (hour < 18) result.afternoon.push(label);
    else result.evening.push(label);
    return result;
  }, { morning: [], afternoon: [], evening: [], all: [] });
}

export default function QuotationPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>(`/quotations/${id}`).then(setQuotation).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!quotation) return <div className="p-12 text-center text-red-600">Không tìm thấy báo giá.</div>;

  const sourceTour = quotation.tour;
  const sourceVersion = sourceTour?.itinerary?.currentVersion;
  const days = sourceVersion?.days || quotation.itineraryVersion?.days || [];
  const quotationItems = quotation.items || [];
  const includedItems = quotationItems.filter((item: any) => item.isIncluded !== false);
  const excludedItems = quotationItems.filter((item: any) => item.isIncluded === false);
  const tourBookingItems = (sourceTour?.bookings || []).map((booking: any) => ({
    id: booking.id,
    category: booking.category,
    name: booking.title,
    description: [booking.supplier?.name, booking.serviceDate, booking.checkInDate && `Nhận phòng: ${formatDate(booking.checkInDate)}`, booking.checkOutDate && `Trả phòng: ${formatDate(booking.checkOutDate)}`, booking.confirmationNo, booking.notes].filter(Boolean).join(' · '),
    quantity: booking.quantity || 1,
    sellingPrice: booking.unitCost || 0,
    totalSelling: booking.totalCost || Number(booking.unitCost || 0) * Number(booking.quantity || 1),
    buyingPrice: booking.unitCost || 0,
    currency: booking.currency || quotation.currency,
    isIncluded: true,
  }));
  const displayItems = tourBookingItems.length ? tourBookingItems : includedItems;
  const costSheet = quotation.costSheets?.[0];
  const fallbackCostLines = tourBookingItems.map((item: any, index: number) => ({
    ...item,
    sortOrder: index,
    unitPrice: item.buyingPrice,
    serviceCount: 1,
    total: Number(item.totalSelling || 0),
    supplierName: item.description,
  }));
  const costLines = tourBookingItems.length ? fallbackCostLines : costSheet?.lines?.length ? costSheet.lines : fallbackCostLines;
  const costTotals = costLines.reduce((totals: Record<string, number>, line: any) => {
    const currency = line.currency || quotation.currency || 'VND';
    totals[currency] = (totals[currency] || 0) + Number(line.total || 0);
    return totals;
  }, {});
  const displayTotals = displayItems.reduce((totals: Record<string, number>, item: any) => {
    const currency = item.currency || quotation.currency || 'VND';
    totals[currency] = (totals[currency] || 0) + Number(item.totalSelling ?? Number(item.sellingPrice || 0) * Number(item.quantity || 1));
    return totals;
  }, {});
  const formatTotals = (totals: Record<string, number>) => Object.entries(totals).map(([currency, total]) => formatMoney(total, currency)).join(' · ') || '—';
  const groupedItems = displayItems.reduce((groups: Record<string, any[]>, item: any) => {
    const category = item.category || 'Dịch vụ khác';
    groups[category] = groups[category] || [];
    groups[category].push(item);
    return groups;
  }, {});

  return (
    <main className="quotation-print mx-auto max-w-5xl bg-white p-8 text-gray-900 print:max-w-none print:p-4">
      <div className="no-print mb-5 flex justify-end">
        <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Print / Save PDF</button>
      </div>

      <header className="border-2 border-gray-800">
        <h1 className="border-b-2 border-gray-800 px-4 py-2 text-center text-2xl font-bold uppercase">{quotation.title}</h1>
        <div className="grid grid-cols-2 text-sm">
          <div className="border-r border-gray-400">
            <p className="border-b border-gray-300 px-3 py-2"><b>Mã tour:</b> {sourceTour?.code || quotation.code}</p>
            <p className="border-b border-gray-300 px-3 py-2"><b>Khách hàng:</b> {getCustomerName(quotation.customer)}</p>
            <p className="px-3 py-2"><b>Điểm đến:</b> {quotation.destination || sourceTour?.destination || '—'}</p>
          </div>
          <div>
            <p className="border-b border-gray-300 px-3 py-2"><b>Số khách:</b> {quotation.pax || sourceTour?.pax || '—'}</p>
            <p className="border-b border-gray-300 px-3 py-2"><b>Ngày đi:</b> {formatDate(quotation.travelDateFrom || sourceTour?.travelDateFrom)}</p>
            <p className="px-3 py-2"><b>Ngày về:</b> {formatDate(quotation.travelDateTo || sourceTour?.travelDateTo)}</p>
          </div>
        </div>
      </header>

      <section className="mt-6">
        <div className="section-band">PHẦN 1 — HÀNH TRÌNH TOUR TỔNG QUÁT</div>
        {sourceTour && <p className="mt-2 text-sm"><b>Chương trình từ module Tour:</b> {sourceTour.code} — {sourceTour.title}{sourceVersion ? ` — ${sourceVersion.title}` : ''}</p>}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="cell w-24">Ngày</th>
                <th className="cell text-left">Hành trình</th>
                <th className="cell text-left">Sáng</th>
                <th className="cell text-left">Chiều</th>
                <th className="cell text-left">Tối</th>
                <th className="cell">Bữa ăn</th>
                <th className="cell text-left">Lưu trú</th>
              </tr>
            </thead>
            <tbody>
              {days.length ? days.map((day: any) => {
                const periods = activitiesByPeriod(day);
                return <tr key={day.id}>
                  <td className="cell text-center font-semibold">Ngày {day.dayNumber}<span className="block text-xs font-normal text-gray-500">{formatDate(addDays(quotation.travelDateFrom || sourceTour?.travelDateFrom, Number(day.dayNumber || 1) - 1))}</span></td>
                  <td className="cell"><b>{day.title || '—'}</b><span className="mt-1 block whitespace-pre-line text-xs text-gray-600">{day.description || periods.all.join(' · ') || '—'}</span></td>
                  <td className="cell text-xs">{periods.morning.join(' · ') || '—'}</td>
                  <td className="cell text-xs">{periods.afternoon.join(' · ') || '—'}</td>
                  <td className="cell text-xs">{periods.evening.join(' · ') || '—'}</td>
                  <td className="cell text-center text-xs">{(day.meals || []).map((meal: string) => MEAL_LABEL[meal] || meal).join(' · ') || '—'}</td>
                  <td className="cell text-xs">{day.accommodation || '—'}</td>
                </tr>;
              }) : <tr><td colSpan={7} className="cell text-center text-gray-500">Chưa có chương trình Tour hoặc itinerary được liên kết.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 break-inside-avoid">
        <div className="section-band">PHẦN 2 — BẢNG BÁO GIÁ TOUR</div>
        {sourceTour?.bookings?.length ? <p className="mt-2 text-sm"><b>Dịch vụ từ Tour nguồn:</b> {sourceTour.code} · dữ liệu lấy từ các booking đã lập trong module Tour.</p> : <p className="mt-2 text-sm text-gray-600">Chưa có booking của Tour nguồn; hiển thị các dòng dịch vụ của báo giá.</p>}
        <table className="mt-3 w-full border-collapse text-sm">
          <thead><tr><th className="cell w-10">STT</th><th className="cell text-left">Nội dung chi phí / dịch vụ</th><th className="cell">Số lượng</th><th className="cell">Đơn giá</th><th className="cell text-right">Thành tiền</th></tr></thead>
          <tbody>{(Object.entries(groupedItems) as [string, any[]][]).flatMap(([category, categoryItems]) => [
            <tr key={`category-${category}`}><td colSpan={5} className="category-band">{category}</td></tr>,
            ...categoryItems.map((item: any, index: number) => <tr key={item.id}><td className="cell text-center">{index + 1}</td><td className="cell">{item.name}{item.description ? <span className="block text-xs text-gray-500">{item.description}</span> : null}</td><td className="cell text-center">{item.quantity}</td><td className="cell text-right">{formatMoney(item.sellingPrice, item.currency || quotation.currency)}</td><td className="cell text-right">{formatMoney(item.totalSelling ?? Number(item.sellingPrice || 0) * Number(item.quantity || 1), item.currency || quotation.currency)}</td></tr>),
          ])}</tbody>
        </table>
        <div className="mt-3 ml-auto max-w-sm text-sm">
          <div className="flex justify-between border-b border-gray-200 py-2"><span>{sourceTour?.bookings?.length ? 'Tổng dịch vụ theo Tour nguồn' : 'Tổng cộng'}</span><b>{sourceTour?.bookings?.length ? formatTotals(displayTotals) : formatMoney(quotation.subtotal, quotation.currency)}</b></div>
          {Number(quotation.discountAmount) > 0 && <div className="flex justify-between border-b border-gray-200 py-2"><span>Chiết khấu</span><span>−{formatMoney(quotation.discountAmount, quotation.currency)}</span></div>}
          {Number(quotation.taxAmount) > 0 && <div className="flex justify-between border-b border-gray-200 py-2"><span>Thuế</span><span>{formatMoney(quotation.taxAmount, quotation.currency)}</span></div>}
          <div className="flex justify-between bg-yellow-100 px-2 py-3 text-base font-bold"><span>GIÁ TOUR</span><span>{formatMoney(quotation.totalAmount, quotation.currency)}</span></div>
          <div className="flex justify-between py-2"><span>Giá / khách</span><b>{formatMoney(Number(quotation.totalAmount) / Math.max(Number(quotation.pax || 1), 1), quotation.currency)}</b></div>
        </div>
      </section>

      <section className="mt-6 break-inside-avoid">
        <div className="section-band">CHI PHÍ KHÔNG BAO GỒM</div>
        {excludedItems.length ? <ul className="mt-2 list-disc pl-5 text-sm">{excludedItems.map((item: any) => <li key={item.id}>{item.name}{item.description ? ` — ${item.description}` : ''}</li>)}</ul> : <p className="mt-2 text-sm text-gray-500">Chưa khai báo.</p>}
        {quotation.notes && <p className="mt-3 whitespace-pre-line text-sm">{quotation.notes}</p>}
      </section>

      <section className="mt-6 break-inside-avoid">
        <div className="section-band">BẢNG CHI PHÍ TẠM TÍNH</div>
        {costSheet && <p className="mt-2 text-sm"><b>{costSheet.title}</b>{costSheet.notes ? ` — ${costSheet.notes}` : ''}</p>}
        <table className="mt-3 w-full border-collapse text-sm"><thead><tr><th className="cell w-10">STT</th><th className="cell text-left">Nội dung chi phí</th><th className="cell">Số lượng</th><th className="cell">Đơn giá</th><th className="cell">Số lượt dịch vụ</th><th className="cell text-right">Thành tiền</th></tr></thead><tbody>{costLines.length ? costLines.map((line: any, index: number) => <tr key={line.id || `${line.name}-${index}`}><td className="cell text-center">{index + 1}</td><td className="cell">{line.name}{line.supplierName ? <span className="block text-xs text-gray-500">{line.supplierName}</span> : null}</td><td className="cell text-center">{line.quantity}</td><td className="cell text-right">{formatMoney(line.unitPrice, line.currency)}</td><td className="cell text-center">{line.serviceCount}</td><td className="cell text-right">{formatMoney(line.total, line.currency)}</td></tr>) : <tr><td colSpan={6} className="cell text-center text-gray-500">Chưa có dữ liệu chi phí.</td></tr>}</tbody><tfoot><tr><td colSpan={5} className="cell text-right font-bold">TỔNG CỘNG CHI PHÍ</td><td className="cell text-right font-bold">{formatTotals(costTotals)}</td></tr></tfoot></table>
      </section>

      <footer className="mt-8 border-t border-gray-300 pt-3 text-center text-xs text-gray-500">Mã báo giá: {quotation.code} · Ngày tạo: {formatDate(quotation.createdAt)}</footer>

      <style jsx global>{`@page { size: A4 landscape; margin: 8mm; } .section-band { background: #dceaf3; border: 1px solid #111; padding: 6px 8px; font-weight: 700; } .cell { border: 1px solid #777; padding: 6px 7px; vertical-align: top; } .category-band { border: 1px solid #777; background: #e8f1f6; padding: 6px 7px; font-weight: 700; } @media print { .no-print { display: none !important; } body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .quotation-print { width: 100%; } }`}</style>
    </main>
  );
}
