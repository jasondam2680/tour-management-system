'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auditsApi } from '@/lib/api/audits';

const SERVICE_TYPE_LABEL: Record<string, string> = {
  ATTRACTION: 'Vé tham quan', HOTEL: 'Khách sạn', MEAL: 'Bữa ăn', TRANSPORT: 'Xe',
  FLIGHT: 'Vé máy bay', INSURANCE: 'Bảo hiểm', VISA: 'Visa',
  GUIDE_SERVICE: 'HDV', SHOPPING: 'Mua sắm', OTHER: 'Khác',
};

export default function SettlementPrintPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setD(await auditsApi.settlement(tourId)); }
    finally { setLoading(false); }
  }, [tourId]);
  useEffect(() => { load(); }, [load]);

  const fmt = (n: any) => (n === null || n === undefined ? '0' : Number(n).toLocaleString('vi-VN'));

  if (loading) return <div className="p-6 text-sm text-gray-400">Đang tải...</div>;
  if (!d) return <div className="p-6 text-sm text-red-600">Không tải được quyết toán</div>;

  const cell = 'border border-gray-400 px-2 py-1.5';
  const org = d.organization ?? {};
  const t = d.tour ?? {};
  const costs = d.costs ?? {};

  return (
    <div className="bg-gray-100 min-h-screen">
      <style>{`
        @media print {
          aside { display: none !important; }
          main { margin-left: 0 !important; }
          .no-print { display: none !important; }
          .sheet-wrap { background: white !important; padding: 0 !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      <div className="no-print p-4 flex items-center gap-3 print:hidden">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Quay lại</button>
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          🖨️ In / Lưu PDF
        </button>
      </div>

      <div className="sheet-wrap p-6 flex justify-center">
        <div className="sheet bg-white shadow max-w-[210mm] w-full p-8 text-sm text-gray-900">
          <div className="text-center mb-4">
            <p className="font-bold text-lg uppercase">{org.name || '................................'}</p>
            {org.address && <p className="text-xs text-gray-600">{org.address}</p>}
            <p className="text-xs text-gray-600">
              {org.phone ? `ĐT: ${org.phone}` : ''}{org.taxCode ? ` · MST: ${org.taxCode}` : ''}
            </p>
          </div>

          <h1 className="text-center font-bold text-xl mb-1">QUYẾT TOÁN TÀI CHÍNH ĐOÀN</h1>
          <p className="text-center text-gray-600 mb-4">旅行團结算單</p>

          <table className="w-full border-collapse mb-4 text-[13px]">
            <tbody>
              <tr>
                <td className={cell + ' w-1/4 bg-gray-50 font-medium'}>Mã đoàn / 團號</td>
                <td className={cell + ' w-1/4 font-mono'}>{t.code}</td>
                <td className={cell + ' w-1/4 bg-gray-50 font-medium'}>Tuyến / 線路</td>
                <td className={cell + ' w-1/4'}>{t.title}</td>
              </tr>
            </tbody>
          </table>

          <h2 className="font-bold mb-2">I. Tổng thu / 總收入</h2>
          <table className="w-full border-collapse mb-4 text-[13px]">
            <tbody>
              {(d.revenue ?? []).map((r: any) => (
                <tr key={r.currency}>
                  <td className={cell + ' bg-gray-50'}>Doanh thu invoice</td>
                  <td className={cell + ' text-right w-48'}>{fmt(r.amount)} {r.currency}</td>
                </tr>
              ))}
              {(!d.revenue || d.revenue.length === 0) && (
                <tr><td className={cell + ' text-gray-400'}>Chưa có invoice gắn đoàn</td><td className={cell}></td></tr>
              )}
            </tbody>
          </table>

          <h2 className="font-bold mb-2">II. Tổng chi / 總支出</h2>
          <table className="w-full border-collapse mb-4 text-[13px]">
            <thead>
              <tr className="bg-gray-50">
                <th className={cell + ' text-left'}>Hạng mục / 項目</th>
                <th className={cell + ' w-48 text-right'}>Số tiền / 金額</th>
              </tr>
            </thead>
            <tbody>
              {(d.costByService ?? []).map((c: any, i: number) => (
                <tr key={i}>
                  <td className={cell + ' pl-6'}>{SERVICE_TYPE_LABEL[c.serviceType] ?? c.serviceType}</td>
                  <td className={cell + ' text-right'}>{fmt(c.amount)} {c.currency}</td>
                </tr>
              ))}
              {(costs.guideSettlements ?? []).map((c: any, i: number) => (
                <tr key={'g' + i}>
                  <td className={cell + ' pl-6'}>Quyết toán HDV / 導遊結算</td>
                  <td className={cell + ' text-right'}>{fmt(c.amount)} {c.currency}</td>
                </tr>
              ))}
              {(costs.supplierPayments ?? []).map((c: any, i: number) => (
                <tr key={'s' + i}>
                  <td className={cell + ' pl-6'}>Thanh toán NCC khác / 其他供應商付款</td>
                  <td className={cell + ' text-right'}>{fmt(c.amount)} {c.currency}</td>
                </tr>
              ))}
              {(costs.total ?? []).map((c: any) => (
                <tr key={'t' + c.currency} className="font-bold bg-gray-50">
                  <td className={cell}>Tổng chi / 總支出</td>
                  <td className={cell + ' text-right'}>{fmt(c.amount)} {c.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="font-bold mb-2">III. Lợi nhuận / 利潤</h2>
          <table className="w-full border-collapse mb-4 text-[13px]">
            <tbody>
              {(d.profit ?? []).map((p: any) => (
                <tr key={p.currency} className="font-bold">
                  <td className={cell + ' bg-yellow-50'}>Lợi nhuận (Thu − Chi) / 利潤</td>
                  <td className={'border border-gray-400 px-2 py-1.5 text-right w-48 bg-yellow-100 text-base ' + (Number(p.amount) < 0 ? 'text-red-600' : 'text-green-700')}>
                    {fmt(p.amount)} {p.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(d.notes ?? []).length > 0 && (
            <div className="text-xs text-gray-500 mb-6">
              {d.notes.map((n: string, i: number) => <p key={i}>• {n}</p>)}
            </div>
          )}

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
