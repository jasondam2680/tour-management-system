'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';

const STAGES = [
  ['CUSTOMER_BRIEF', '1. Lấy ý kiến khách'],
  ['PROGRAM_OPTIONS', '2. Chọn chương trình'],
  ['PROGRAM_SELECTED', '3. Đã chốt chương trình'],
  ['COST_SHEET', '4. Chi phí tạm tính'],
  ['QUOTATION_READY', '5. Báo giá sẵn sàng'],
  ['SENT_TO_CUSTOMER', '6. Đã gửi khách'],
  ['CUSTOMER_APPROVED', '7. Khách duyệt'],
] as const;

const money = (value: unknown, currency = 'VND') => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} ${currency}`;

export default function QuotationWorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [optionNo, setOptionNo] = useState(1);
  const [optionTitle, setOptionTitle] = useState('');
  const [optionSummary, setOptionSummary] = useState('');
  const [costTitle, setCostTitle] = useState('Bảng chi phí tạm tính');
  const [costNotes, setCostNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [availableTours, setAvailableTours] = useState<any[]>([]);
  const [sourceTourId, setSourceTourId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [data, tourResult] = await Promise.all([
        api.get<any>(`/quotations/${id}`),
        api.get<any>('/tours', { page: 1, limit: 50 }),
      ]);
      setQuotation(data);
      setAvailableTours(tourResult?.data || []);
      setSourceTourId(data.tour?.id || '');
      if (!optionTitle) setOptionTitle(data.title || 'Chương trình tour');
    } catch {
      setError('Không thể tải báo giá.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  const costLines = useMemo(() => {
    const sourceBookings = quotation?.tour?.bookings || [];
    if (sourceBookings.length) {
      return sourceBookings.map((booking: any, index: number) => ({
        category: booking.category || 'Dịch vụ',
        name: booking.title,
        description: booking.supplier?.name,
        quantity: Number(booking.quantity || 1),
        unitPrice: Number(booking.unitCost || 0),
        serviceCount: 1,
        currency: booking.currency || quotation?.currency || 'VND',
        isIncluded: true,
        notes: [booking.serviceDate, booking.checkInDate, booking.checkOutDate, booking.confirmationNo, booking.notes].filter(Boolean).join(' · '),
        sortOrder: index,
      }));
    }
    return (quotation?.items || []).map((item: any, index: number) => ({
      category: item.category || 'Dịch vụ',
      name: item.name,
      description: item.description,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.buyingPrice || 0),
      serviceCount: 1,
      currency: item.currency || quotation?.currency || 'VND',
      isIncluded: item.isIncluded !== false,
      notes: item.notes,
      sortOrder: index,
    }));
  }, [quotation]);

  async function selectSourceTour() {
    if (!sourceTourId) return;
    setSaving(true); setMessage(''); setError('');
    try {
      await api.patch(`/quotations/${id}/source-tour`, { tourId: sourceTourId });
      setMessage('Đã chọn chương trình Tour làm nguồn cho lịch trình và PDF.');
      await load();
    } catch (e: any) { setError(e?.response?.data?.message || 'Không thể chọn chương trình Tour.'); }
    finally { setSaving(false); }
  }

  async function createOption(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      await api.post(`/quotations/${id}/program-options`, {
        optionNo, title: optionTitle, summary: optionSummary || undefined,
      });
      setMessage('Đã thêm chương trình để khách xem và chọn.');
      setOptionNo(optionNo + 1);
      setOptionTitle(''); setOptionSummary('');
      await load();
    } catch (e: any) { setError(e?.response?.data?.message || 'Không thể thêm chương trình.'); }
    finally { setSaving(false); }
  }

  async function createCostSheet(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      await api.post(`/quotations/${id}/cost-sheet`, { title: costTitle, notes: costNotes || undefined, lines: costLines });
      setMessage('Đã tạo phiên bảng chi phí tạm tính từ các dòng dịch vụ hiện có.');
      await load();
    } catch (e: any) { setError(e?.response?.data?.message || 'Không thể tạo bảng chi phí.'); }
    finally { setSaving(false); }
  }

  async function createShare() {
    setSaving(true); setMessage(''); setError('');
    try {
      const result = await api.post<any>(`/quotations/${id}/share`, {});
      const token = result.customerShareToken;
      setShareUrl(`${window.location.origin}/quote/${token}`);
      setMessage('Đã tạo liên kết để gửi khách xem chương trình.');
      await load();
    } catch (e: any) { setError(e?.response?.data?.message || 'Không thể tạo liên kết khách hàng.'); }
    finally { setSaving(false); }
  }

  async function updateStage(stage: string) {
    setSaving(true); setMessage(''); setError('');
    try {
      await api.patch(`/quotations/${id}/workflow-stage`, { stage });
      setMessage('Đã cập nhật giai đoạn workflow.');
      await load();
    } catch (e: any) { setError(e?.response?.data?.message || 'Không thể cập nhật workflow.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Đang tải workflow...</div>;
  if (!quotation) return <div className="p-8 text-center text-red-600">{error || 'Không tìm thấy báo giá.'}</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href={`/dashboard/quotations/${id}`} className="text-sm text-slate-500 hover:text-blue-600">← Quay lại báo giá</Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Quotation workflow</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{quotation.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{quotation.code} · {quotation.destination || 'Chưa khai báo điểm đến'}</p>
          </div>
          <Link href={`/dashboard/quotations/${id}/print`} target="_blank" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Mở bản in báo giá</Link>
        </header>

        {(message || error) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-semibold text-slate-900">Trạng thái workflow</h2><p className="mt-1 text-xs text-slate-500">Theo dõi từ brief khách hàng tới duyệt báo giá.</p></div>
            <select value={quotation.workflowStage || 'CUSTOMER_BRIEF'} onChange={(event) => void updateStage(event.target.value)} disabled={saving} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {STAGES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-7">
            {STAGES.map(([value, label]) => <div key={value} className={`rounded-lg border px-3 py-3 text-xs ${quotation.workflowStage === value ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>{label}</div>)}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Chương trình Tour nguồn cho PDF</h2>
              <p className="mt-1 text-xs text-slate-500">Chọn chương trình đã lập trong module Tour. PDF sẽ lấy lịch trình từ itinerary hiện tại của Tour này.</p>
            </div>
            {quotation.tour && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Đã liên kết: {quotation.tour.code}</span>}
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <select value={sourceTourId} onChange={(event) => setSourceTourId(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" disabled={saving}>
              <option value="">Chọn chương trình Tour</option>
              {availableTours.map((tour) => <option key={tour.id} value={tour.id}>{tour.code} — {tour.title}{tour.destination ? ` — ${tour.destination}` : ''}</option>)}
            </select>
            <button onClick={() => void selectSourceTour()} disabled={saving || !sourceTourId} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Dùng Tour này cho PDF</button>
          </div>
          {quotation.tour?.itinerary?.currentVersion && <p className="mt-3 text-xs text-emerald-700">Lịch trình hiện tại: {quotation.tour.itinerary.currentVersion.title}</p>}
          {!availableTours.length && <p className="mt-3 text-xs text-amber-700">Chưa có chương trình Tour để chọn.</p>}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Chương trình tổng quát cho khách chọn</h2>
            <p className="mt-1 text-xs text-slate-500">Tạo các phương án trước khi khách chốt chương trình.</p>
            <form onSubmit={createOption} className="mt-4 space-y-3">
              <div className="grid grid-cols-[90px_1fr] gap-3">
                <label className="text-sm text-slate-600">Phương án<input type="number" min={1} value={optionNo} onChange={(event) => setOptionNo(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
                <label className="text-sm text-slate-600">Tiêu đề<input value={optionTitle} onChange={(event) => setOptionTitle(event.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              </div>
              <label className="block text-sm text-slate-600">Tóm tắt chương trình<textarea value={optionSummary} onChange={(event) => setOptionSummary(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              <button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Thêm phương án</button>
            </form>
            <div className="mt-5 space-y-2">
              {(quotation.programOptions || []).map((option: any) => <div key={option.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"><p className="font-medium text-slate-800">Phương án {option.optionNo}: {option.title}</p><p className="mt-1 text-xs text-slate-500">{option.summary || 'Chưa có tóm tắt'}</p>{option.isSelected && <span className="mt-2 inline-block text-xs font-semibold text-emerald-700">Khách đã chọn</span>}</div>)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Chia sẻ cho khách</h2>
            <p className="mt-1 text-xs text-slate-500">Tạo đường dẫn công khai để khách xem và chọn phương án.</p>
            <button onClick={() => void createShare()} disabled={saving} className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Tạo / làm mới liên kết</button>
            {shareUrl && <div className="mt-4 rounded-lg bg-violet-50 p-3"><p className="text-xs font-medium text-violet-800">Liên kết gửi khách</p><input readOnly value={shareUrl} className="mt-2 w-full rounded border border-violet-200 bg-white px-3 py-2 text-xs text-slate-700" /></div>}
            {quotation.customerShareToken && !shareUrl && <p className="mt-4 text-xs text-slate-500">Báo giá đã có liên kết khách hàng. Bấm nút để tạo lại liên kết hiển thị.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Bảng chi phí tạm tính</h2><p className="mt-1 text-xs text-slate-500">{quotation.tour?.bookings?.length ? 'Lấy chi phí dịch vụ và nhà cung cấp từ các booking của Tour nguồn.' : 'Lấy chi phí dịch vụ từ các dòng báo giá hiện có.'}</p></div><span className="text-sm font-semibold text-slate-700">{money(costLines.reduce((sum: number, line: any) => sum + line.quantity * line.unitPrice * line.serviceCount, 0), quotation.currency)}</span></div>
          <form onSubmit={createCostSheet} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input value={costTitle} onChange={(event) => setCostTitle(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={costNotes} onChange={(event) => setCostNotes(event.target.value)} placeholder="Ghi chú nội bộ" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <button disabled={saving || !costLines.length} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Lưu bảng chi phí</button>
          </form>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-400"><tr><th className="px-3 py-2">Nhóm</th><th className="px-3 py-2">Dịch vụ</th><th className="px-3 py-2">SL</th><th className="px-3 py-2">Đơn giá vốn</th><th className="px-3 py-2">Thành tiền</th></tr></thead><tbody className="divide-y divide-slate-100">{costLines.map((line: any) => <tr key={`${line.sortOrder}-${line.name}`}><td className="px-3 py-2">{line.category}</td><td className="px-3 py-2 font-medium">{line.name}</td><td className="px-3 py-2">{line.quantity}</td><td className="px-3 py-2">{money(line.unitPrice, line.currency)}</td><td className="px-3 py-2 font-medium">{money(line.quantity * line.unitPrice * line.serviceCount, line.currency)}</td></tr>)}</tbody></table></div>
          <div className="mt-4 space-y-2">{(quotation.costSheets || []).map((sheet: any) => <div key={sheet.id} className="flex flex-wrap justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm"><span>{sheet.title} · phiên bản {sheet.version}</span><span className="text-slate-500">{sheet.lines?.length || 0} dòng</span></div>)}</div>
        </section>
      </div>
    </main>
  );
}
