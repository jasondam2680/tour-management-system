'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';

const MEAL_LABEL: Record<string, string> = { B: 'Sáng', L: 'Trưa', D: 'Tối' };

function formatMoney(value: unknown, currency = 'VND') {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(value || 0)))} ${currency}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getCustomerName(customer: any) {
  if (!customer) return '—';
  return customer.type === 'B2B'
    ? customer.companyName || '—'
    : [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—';
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

  const items = quotation.items || [];
  const includedItems = items.filter((item: any) => item.isIncluded !== false);
  const excludedItems = items.filter((item: any) => item.isIncluded === false);
  const days = quotation.itineraryVersion?.days || [];
  const costSheet = quotation.costSheets?.[0];
  const costLines = costSheet?.lines || [];
  const costTotal = costLines.reduce((sum: number, line: any) => sum + Number(line.total || 0), 0);
  const groupedItems = includedItems.reduce((groups: Record<string, any[]>, item: any) => {
    const category = item.category || 'Dịch vụ khác';
    groups[category] = groups[category] || [];
    groups[category].push(item);
    return groups;
  }, {});

  return (
    <main className="quotation-print mx-auto max-w-5xl bg-white p-8 text-gray-900 print:max-w-none print:p-4">
      <div className="no-print mb-5 flex justify-end gap-2">
        <button onClick={() => window.print()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Print / Save PDF</button>
      </div>

      <header className="border-2 border-gray-800">
        <h1 className="border-b-2 border-gray-800 px-4 py-2 text-center text-2xl font-bold uppercase">{quotation.title}</h1>
        <div className="grid grid-cols-2 text-sm">
          <div className="border-r border-gray-400"><p className="border-b border-gray-300 px-3 py-2"><b>Mã tour:</b> {quotation.code}</p><p className="border-b border-gray-300 px-3 py-2"><b>Khách hàng:</b> {getCustomerName(quotation.customer)}</p><p className="px-3 py-2"><b>Điểm đến:</b> {quotation.destination || '—'}</p></div>
          <div><p className="border-b border-gray-300 px-3 py-2"><b>Số khách:</b> {quotation.pax || '—'}</p><p className="border-b border-gray-300 px-3 py-2"><b>Ngày đi:</b> {formatDate(quotation.travelDateFrom)}</p><p className="px-3 py-2"><b>Ngày về:</b> {formatDate(quotation.travelDateTo)}</p></div>
        </div>
      </header>

      <section className="mt-6">
        <div className="section-band">HÀNH TRÌNH TỔNG QUÁT / CHƯƠNG TRÌNH CHI TIẾT</div>
        <div className="mt-3 space-y-3">
          {days.length ? days.map((day: any) => <article key={day.id} className="border-b border-gray-200 pb-3"><p className="font-bold">Ngày {day.dayNumber}{day.title ? ` — ${day.title}` : ''}</p><p className="mt-1 whitespace-pre-line text-sm">{day.description || '—'}</p>{day.accommodation && <p className="mt-1 text-sm"><b>Lưu trú:</b> {day.accommodation}</p>}{day.meals?.length > 0 && <p className="mt-1 text-sm"><b>Bữa ăn:</b> {day.meals.map((meal: string) => MEAL_LABEL[meal] || meal).join(' · ')}</p>}{day.activities?.length > 0 && <ul className="mt-1 list-disc pl-5 text-sm">{day.activities.map((activity: any) => <li key={activity.id}>{activity.time ? `${activity.time} — ` : ''}{activity.title}{activity.location ? ` (${activity.location})` : ''}</li>)}</ul>}</article>) : <p className="text-sm text-gray-500">Chưa có chương trình chi tiết.</p>}
        </div>
      </section>

      <section className="mt-6 break-inside-avoid">
        <div className="section-band">BẢNG CHI PHÍ TẠM TÍNH</div>
        {costSheet && <p className="mt-2 text-sm"><b>{costSheet.title}</b>{costSheet.notes ? ` — ${costSheet.notes}` : ''}</p>}
        <table className="mt-3 w-full border-collapse text-sm"><thead><tr><th className="cell w-10">STT</th><th className="cell text-left">Nội dung chi phí</th><th className="cell">Số lượng</th><th className="cell">Đơn giá</th><th className="cell">Số lượt dịch vụ</th><th className="cell text-right">Thành tiền</th></tr></thead><tbody>{costLines.length ? costLines.map((line: any, index: number) => <tr key={line.id}><td className="cell text-center">{index + 1}</td><td className="cell">{line.name}{line.supplierName ? <span className="block text-xs text-gray-500">{line.supplierName}</span> : null}</td><td className="cell text-center">{line.quantity}</td><td className="cell text-right">{formatMoney(line.unitPrice, line.currency)}</td><td className="cell text-center">{line.serviceCount}</td><td className="cell text-right">{formatMoney(line.total, line.currency)}</td></tr>) : <tr><td colSpan={6} className="cell text-center text-gray-500">Chưa lập bảng chi phí tạm tính.</td></tr>}</tbody><tfoot><tr><td colSpan={5} className="cell text-right font-bold">TỔNG CỘNG CHI PHÍ</td><td className="cell text-right font-bold">{formatMoney(costTotal, quotation.currency)}</td></tr></tfoot></table>
      </section>

      <section className="mt-6 break-inside-avoid">
        <div className="section-band">BẢNG BÁO GIÁ TOUR</div>
        <table className="mt-3 w-full border-collapse text-sm"><thead><tr><th className="cell w-10">STT</th><th className="cell text-left">Nội dung dịch vụ</th><th className="cell">Số lượng</th><th className="cell">Đơn giá</th><th className="cell text-right">Thành tiền</th></tr></thead><tbody>{(Object.entries(groupedItems) as [string, any[]][]).flatMap(([category, categoryItems]) => [<tr key={`category-${category}`}><td colSpan={5} className="category-band">{category}</td></tr>, ...categoryItems.map((item: any, index: number) => <tr key={item.id}><td className="cell text-center">{index + 1}</td><td className="cell">{item.name}{item.description ? <span className="block text-xs text-gray-500">{item.description}</span> : null}</td><td className="cell text-center">{item.quantity}</td><td className="cell text-right">{formatMoney(item.sellingPrice, item.currency || quotation.currency)}</td><td className="cell text-right">{formatMoney(Number(item.sellingPrice) * Number(item.quantity), item.currency || quotation.currency)}</td></tr>)])}</tbody></table>
        <div className="mt-3 ml-auto max-w-sm text-sm"><div className="flex justify-between border-b border-gray-200 py-2"><span>Tổng cộng</span><b>{formatMoney(quotation.subtotal, quotation.currency)}</b></div>{Number(quotation.discountAmount) > 0 && <div className="flex justify-between border-b border-gray-200 py-2"><span>Chiết khấu</span><span>−{formatMoney(quotation.discountAmount, quotation.currency)}</span></div>}{Number(quotation.taxAmount) > 0 && <div className="flex justify-between border-b border-gray-200 py-2"><span>Thuế</span><span>{formatMoney(quotation.taxAmount, quotation.currency)}</span></div>}<div className="flex justify-between bg-yellow-100 px-2 py-3 text-base font-bold"><span>GIÁ TOUR</span><span>{formatMoney(quotation.totalAmount, quotation.currency)}</span></div><div className="flex justify-between py-2"><span>Giá / khách</span><b>{formatMoney(Number(quotation.totalAmount) / Math.max(Number(quotation.pax || 1), 1), quotation.currency)}</b></div></div>
      </section>

      <section className="mt-6 break-inside-avoid">
        <div className="section-band">CHI PHÍ KHÔNG BAO GỒM</div>
        {excludedItems.length ? <ul className="mt-2 list-disc pl-5 text-sm">{excludedItems.map((item: any) => <li key={item.id}>{item.name}{item.description ? ` — ${item.description}` : ''}</li>)}</ul> : <p className="mt-2 text-sm text-gray-500">Chưa khai báo.</p>}
        {quotation.internalNotes && <p className="mt-3 whitespace-pre-line text-sm">{quotation.internalNotes}</p>}
        {quotation.notes && <p className="mt-3 whitespace-pre-line text-sm">{quotation.notes}</p>}
      </section>

      <footer className="mt-8 border-t border-gray-300 pt-3 text-center text-xs text-gray-500">Mã báo giá: {quotation.code} · Ngày tạo: {formatDate(quotation.createdAt)}</footer>

      <style jsx global>{`@page { size: A4; margin: 10mm; } .section-band { background: #dceaf3; border: 1px solid #111; padding: 6px 8px; font-weight: 700; } .cell { border: 1px solid #777; padding: 6px 7px; vertical-align: top; } .category-band { border: 1px solid #777; background: #e8f1f6; padding: 6px 7px; font-weight: 700; } @media print { .no-print { display: none !important; } body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .quotation-print { width: 100%; } }`}</style>
    </main>
  );
}
