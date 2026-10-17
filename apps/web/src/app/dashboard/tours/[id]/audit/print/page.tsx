'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auditsApi, AUDIT_LINE_STATUS_LABEL } from '@/lib/api/audits';

export default function AuditPrintPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setAudit(await auditsApi.getByTour(tourId)); }
    finally { setLoading(false); }
  }, [tourId]);
  useEffect(() => { load(); }, [load]);

  const fmt = (n: any) => (n === null || n === undefined ? '0' : Number(n).toLocaleString('vi-VN'));
  const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : '');

  if (loading) return <div className="p-6 text-sm text-gray-400">Đang tải...</div>;
  if (!audit) return <div className="p-6 text-sm text-red-600">Đoàn chưa mở kiểm toán</div>;

  const cell = 'border border-gray-400 px-2 py-1.5';
  const totalClaimed = audit.lines.reduce((s: number, l: any) => s + Number(l.claimedAmount ?? 0), 0);
  const totalAudited = audit.lines.reduce((s: number, l: any) => s + Number(l.auditedAmount ?? l.claimedAmount ?? 0), 0);
  const t = audit.tour ?? {};

  return (
    <div className="bg-gray-100 min-h-screen">
      <style>{`
        @media print {
          aside { display: none !important; }
          main { margin-left: 0 !important; }
          .no-print { display: none !important; }
          .sheet-wrap { background: white !important; padding: 0 !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>

      <div className="no-print p-4 flex items-center gap-3 print:hidden">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Quay lại</button>
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          🖨️ In / Lưu PDF
        </button>
      </div>

      <div className="sheet-wrap p-6 flex justify-center">
        <div className="sheet bg-white shadow max-w-[280mm] w-full p-8 text-sm text-gray-900">
          <h1 className="text-center font-bold text-xl mb-1">BẢNG KIỂM TOÁN ĐOÀN</h1>
          <p className="text-center text-gray-600 mb-4">旅行團核算表</p>

          <table className="w-full border-collapse mb-4 text-[13px]">
            <tbody>
              <tr>
                <td className={cell + ' w-1/6 bg-gray-50 font-medium'}>Mã đoàn / 團號</td>
                <td className={cell + ' w-2/6 font-mono'}>{t.code}</td>
                <td className={cell + ' w-1/6 bg-gray-50 font-medium'}>Tuyến / 線路</td>
                <td className={cell + ' w-2/6'}>{t.title}</td>
              </tr>
              <tr>
                <td className={cell + ' bg-gray-50 font-medium'}>Ngày đi / 出發日期</td>
                <td className={cell}>{fmtDate(t.travelDateFrom)}</td>
                <td className={cell + ' bg-gray-50 font-medium'}>Ngày về / 回程日期</td>
                <td className={cell}>{fmtDate(t.travelDateTo)}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse mb-4 text-[13px]">
            <thead>
              <tr className="bg-gray-50">
                <th className={cell + ' w-8'}>STT</th>
                <th className={cell}>Hạng mục / 項目</th>
                <th className={cell + ' w-24'}>Nguồn / 來源</th>
                <th className={cell + ' w-32 text-right'}>Kê khai / 申報</th>
                <th className={cell + ' w-32 text-right'}>Đã duyệt / 審核</th>
                <th className={cell + ' w-28'}>Trạng thái / 狀態</th>
                <th className={cell + ' w-10'}>✓</th>
              </tr>
            </thead>
            <tbody>
              {audit.lines.map((l: any, i: number) => (
                <tr key={l.id}>
                  <td className={cell + ' text-center'}>{i + 1}</td>
                  <td className={cell}>{l.description}{l.notes && <div className="text-xs text-gray-500">{l.notes}</div>}</td>
                  <td className={cell + ' text-xs'}>{l.sourceType === 'ARRANGEMENT' ? 'Sắp xếp DV' : l.sourceType === 'GUIDE_SETTLEMENT' ? 'QT HDV' : 'Thủ công'}</td>
                  <td className={cell + ' text-right'}>{fmt(l.claimedAmount)} {l.currency}</td>
                  <td className={cell + ' text-right'}>{l.auditedAmount != null ? `${fmt(l.auditedAmount)} ${l.currency}` : '—'}</td>
                  <td className={cell + ' text-xs'}>{AUDIT_LINE_STATUS_LABEL[l.status] ?? l.status}</td>
                  <td className={cell + ' text-center'}>{l.status === 'APPROVED' || l.status === 'ADJUSTED' ? '☑' : '☐'}</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-50">
                <td className={cell + ' text-right'} colSpan={3}>Tổng cộng / 合計</td>
                <td className={cell + ' text-right'}>{fmt(totalClaimed)}</td>
                <td className={cell + ' text-right'}>{fmt(totalAudited)}</td>
                <td className={cell} colSpan={2}></td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-gray-500 mb-6">Ghi chú: tick ☑ các dòng đã kiểm toán xong trước khi gửi kế toán.</p>

          <div className="grid grid-cols-3 gap-4 text-center text-[13px]">
            {['Người lập biểu / 制表人', 'Kế toán / 會計', 'Người phê duyệt / 批准人'].map((r) => (
              <div key={r}>
                <p className="font-medium mb-12">{r}</p>
                <p className="text-gray-400">(Ký, ghi rõ họ tên)</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
