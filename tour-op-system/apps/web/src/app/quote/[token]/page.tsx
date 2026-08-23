'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';

const money = (value: unknown, currency = 'VND') => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} ${currency}`;

export default function CustomerQuotationSharePage() {
  const { token } = useParams<{ token: string }>();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<any>(`/quotations/share/${token}`);
      setQuotation(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Liên kết báo giá không hợp lệ.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [token]);

  async function selectOption(optionNo: number) {
    setSelecting(true); setError(''); setMessage('');
    try {
      await api.post(`/quotations/share/${token}/select`, { optionNo });
      setMessage('Đã ghi nhận lựa chọn chương trình của bạn. Nhân viên phụ trách sẽ tiếp tục chuẩn bị báo giá.');
      await load();
    } catch (e: any) { setError(e?.response?.data?.message || 'Không thể ghi nhận lựa chọn.'); }
    finally { setSelecting(false); }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">Đang tải chương trình...</main>;
  if (!quotation) return <main className="min-h-screen bg-slate-50 p-8 text-center text-red-600">{error || 'Không tìm thấy báo giá.'}</main>;

  const customerName = quotation.customer?.companyName || [quotation.customer?.firstName, quotation.customer?.lastName].filter(Boolean).join(' ') || 'Quý khách';
  const days = quotation.itineraryVersion?.days || [];
  const items = quotation.items || [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Tour quotation</p>
          <h1 className="mt-2 text-3xl font-bold">{quotation.title}</h1>
          <p className="mt-3 text-sm text-slate-300">Kính gửi {customerName} · {quotation.code}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4"><div><p className="text-slate-400">Điểm đến</p><p className="mt-1 font-medium">{quotation.destination || '—'}</p></div><div><p className="text-slate-400">Số khách</p><p className="mt-1 font-medium">{quotation.pax}</p></div><div><p className="text-slate-400">Ngày đi</p><p className="mt-1 font-medium">{quotation.travelDateFrom ? new Date(quotation.travelDateFrom).toLocaleDateString('vi-VN') : '—'}</p></div><div><p className="text-slate-400">Tổng báo giá</p><p className="mt-1 font-medium">{money(quotation.totalAmount, quotation.currency)}</p></div></div>
        </header>

        {(message || error) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Chương trình tổng quát</h2>
          <p className="mt-1 text-sm text-slate-500">Vui lòng xem các phương án và chọn chương trình phù hợp nhất.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">{(quotation.programOptions || []).map((option: any) => <article key={option.id} className={`rounded-xl border p-5 ${option.isSelected ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Phương án {option.optionNo}</p><h3 className="mt-1 text-lg font-semibold">{option.title}</h3></div>{option.isSelected && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Đã chọn</span>}</div><p className="mt-3 text-sm leading-6 text-slate-600">{option.summary || 'Chưa có tóm tắt chương trình.'}</p><button onClick={() => void selectOption(option.optionNo)} disabled={selecting || option.isSelected} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{option.isSelected ? 'Đã chọn chương trình' : 'Chọn chương trình này'}</button></article>)}</div>
          {!quotation.programOptions?.length && <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Chưa có phương án chương trình để lựa chọn.</p>}
        </section>

        {!!days.length && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Tóm tắt hành trình</h2><div className="mt-5 space-y-4">{days.map((day: any) => <div key={day.id} className="border-l-2 border-blue-200 pl-4"><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Ngày {day.dayNumber}</p><h3 className="mt-1 font-semibold">{day.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{day.description || '—'}</p>{day.accommodation && <p className="mt-2 text-xs text-slate-500">Lưu trú: {day.accommodation}</p>}</div>)}</div></section>}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Dịch vụ dự kiến trong báo giá</h2><div className="mt-4 divide-y divide-slate-100">{items.map((item: any) => <div key={`${item.day}-${item.name}`} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.description || item.category}</p></div><p className="font-medium">{money(item.totalSelling, item.currency || quotation.currency)}</p></div>)}</div></section>

        <footer className="text-center text-xs text-slate-400">{quotation.notes || 'Vui lòng liên hệ nhân viên phụ trách nếu cần điều chỉnh chương trình.'}</footer>
      </div>
    </main>
  );
}
