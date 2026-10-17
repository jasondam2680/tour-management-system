'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { guidesApi } from '@/lib/api/guides';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp', SUBMITTED: 'Đã trình duyệt', APPROVED: 'Đã phê duyệt', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy',
};

export default function SettlementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lineForm, setLineForm] = useState({ description: '', amount: '', notes: '' });
  const [addingLine, setAddingLine] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await guidesApi.getSettlement(id);
      setS(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Không tải được quyết toán');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function transition(fn: (x: string) => Promise<any>, label: string) {
    if (!confirm(`${label} quyết toán này?`)) return;
    try {
      await fn(id);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    }
  }

  async function addLine(e: React.FormEvent) {
    e.preventDefault();
    if (!lineForm.description || !lineForm.amount) return;
    setAddingLine(true);
    try {
      await guidesApi.addLine(id, { ...lineForm, amount: Number(lineForm.amount) });
      setLineForm({ description: '', amount: '', notes: '' });
      load();
    } finally { setAddingLine(false); }
  }

  async function removeLine(lineId: string) {
    if (!confirm('Xóa dòng chi phí này?')) return;
    await guidesApi.removeLine(id, lineId);
    load();
  }

  const fmt = (n: any) => (n === null || n === undefined ? '0' : Number(n).toLocaleString('vi-VN'));
  const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');
  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (loading) return <div className="p-6 text-sm text-gray-400">Đang tải...</div>;
  if (error || !s) return <div className="p-6"><button onClick={() => router.back()} className="text-sm text-gray-400 mb-2">← Quay lại</button><p className="text-sm text-red-600">{error}</p></div>;

  const isDraft = s.status === 'DRAFT';
  const money = (label: string, value: any, bold = false, neg = false) => (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900 text-base' : 'text-gray-900'} ${neg ? 'text-red-600' : ''}`}>
        {neg ? '−' : ''}{fmt(value)} {s.currency}
      </span>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← Quay lại</button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{s.code}</h1>
            <p className="text-sm text-gray-500 mt-1">
              HDV: <span className="font-medium text-gray-800">{s.guide?.fullName}</span>
              {s.tour && <> · Đoàn: <span className="font-mono text-blue-700">{s.tour.code}</span> — {s.tour.title}</>}
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">{STATUS_LABEL[s.status]}</span>
        </div>
      </div>

      {/* Trạng thái */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500 mr-2">Chuyển trạng thái:</span>
        {s.status === 'DRAFT' && (
          <button onClick={() => transition(guidesApi.submitSettlement, 'Trình duyệt')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">📤 Trình duyệt</button>
        )}
        {s.status === 'SUBMITTED' && (
          <button onClick={() => transition(guidesApi.approveSettlement, 'Phê duyệt')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">✓ Phê duyệt</button>
        )}
        {s.status === 'APPROVED' && (
          <button onClick={() => transition(guidesApi.markSettlementPaid, 'Xác nhận đã thanh toán')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">💰 Đã thanh toán</button>
        )}
        {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(s.status) && (
          <button onClick={() => transition(guidesApi.cancelSettlement, 'Hủy')} className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm">Hủy</button>
        )}
        <div className="flex-1" />
        <button onClick={() => router.push(`/dashboard/guides/settlements/${id}/print`)} className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">🖨️ In bảng thanh toán</button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Khối tính toán */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Bảng tính quyết toán</h2>
          {money('Công tác phí (số ngày × phí/ngày)', s.perDiem)}
          <div className="text-xs text-gray-400 pl-1 pb-1">{s.days} ngày × {fmt(s.dailyRate)}</div>
          {money('Thu nhập khác — tiền tip', s.tipAmount)}
          {money('Thu nhập khác', s.otherIncome)}
          {money('Tổng HDV đã chi (dòng chi phí)', s.totalExpenses)}
          {money('Trừ tạm ứng', s.advanceDeduction, false, true)}
          {money(`Thuế TNCN ${s.pitRate}%`, s.pitTax, false, true)}
          <div className="mt-3 pt-3 border-t-2 border-gray-200">
            {money('TỔNG CẦN THANH TOÁN', s.netPayable, true)}
          </div>
          <p className="text-xs text-gray-400 mt-2">Công thức: công tác phí + tip + thu nhập khác + chi phí − tạm ứng − thuế TNCN</p>
        </div>

        {/* Thông tin HDV + đoàn */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Thông tin</h2>
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-500">HDV</span><span className="font-medium">{s.guide?.fullName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">SĐT</span><span>{s.guide?.phone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">STK</span><span className="font-mono text-xs">{s.guide?.bankAccount || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Ngân hàng</span><span>{s.guide?.bankName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Số khách</span><span>{s.tour?.pax ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Ngày đón đoàn</span><span>{fmtDate(s.tour?.travelDateFrom)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Ngày tiễn đoàn</span><span>{fmtDate(s.tour?.travelDateTo)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Người lập</span><span>{s.preparedBy || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Người duyệt</span><span>{s.approvedBy || '—'}</span></div>
            {s.paidAt && <div className="flex justify-between"><span className="text-gray-500">Ngày thanh toán</span><span>{fmtDate(s.paidAt)}</span></div>}
          </div>
        </div>
      </div>

      {/* Dòng chi phí */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Các khoản HDV đã chi ({(s.lines ?? []).length})</h2>
        {isDraft && (
          <form onSubmit={addLine} className="flex gap-2 mb-4">
            <input value={lineForm.description} onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })}
              placeholder="Nội dung chi (vd: vé tham quan HDV tự chi)" className={`${inputCls} flex-1`} />
            <input type="number" min="0" value={lineForm.amount} onChange={(e) => setLineForm({ ...lineForm, amount: e.target.value })}
              placeholder="Số tiền" className={`${inputCls} w-40`} />
            <button type="submit" disabled={addingLine} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
              {addingLine ? '...' : '+ Thêm'}
            </button>
          </form>
        )}
        {(s.lines ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Chưa có dòng chi phí nào</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              {['Nội dung', 'Số tiền', 'Ghi chú', ''].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-medium text-gray-500 text-xs">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {(s.lines ?? []).map((l: any) => (
                <tr key={l.id}>
                  <td className="px-3 py-2.5">{l.description}</td>
                  <td className="px-3 py-2.5 font-medium">{fmt(l.amount)} {s.currency}</td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{l.notes || '—'}</td>
                  <td className="px-3 py-2.5 text-right">
                    {isDraft && <button onClick={() => removeLine(l.id)} className="text-red-500 hover:text-red-700 text-xs">Xóa</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
