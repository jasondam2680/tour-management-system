'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auditsApi } from '@/lib/api/audits';

export default function DeparturePlanPrintPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setD(await auditsApi.departurePlan(tourId)); }
    finally { setLoading(false); }
  }, [tourId]);
  useEffect(() => { load(); }, [load]);

  const fmt = (n: any) => (n === null || n === undefined ? '0' : Number(n).toLocaleString('vi-VN'));
  const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : '........');

  if (loading) return <div className="p-6 text-sm text-gray-400">Đang tải...</div>;
  if (!d) return <div className="p-6 text-sm text-red-600">Không tải được kế hoạch đoàn</div>;

  const cell = 'border border-gray-400 px-2 py-1.5';
  const org = d.organization ?? {};
  const t = d.tour ?? {};
  const g = d.guide ?? {};
  const drv = d.driver ?? {};
  const roomEntries = Object.entries(d.rooming ?? {});

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

          <h1 className="text-center font-bold text-xl mb-1">KẾ HOẠCH XUẤT ĐOÀN</h1>
          <p className="text-center text-gray-600 mb-4">出团计划表</p>

          <table className="w-full border-collapse mb-4 text-[13px]">
            <tbody>
              <tr>
                <td className={cell + ' w-1/4 bg-gray-50 font-medium'}>Ngày xuất đoàn / 出团日期</td>
                <td className={cell + ' w-1/4'}>{fmtDate(t.travelDateFrom)}</td>
                <td className={cell + ' w-1/4 bg-gray-50 font-medium'}>Ngày về / 回程日期</td>
                <td className={cell + ' w-1/4'}>{fmtDate(t.travelDateTo)}</td>
              </tr>
              <tr>
                <td className={cell + ' bg-gray-50 font-medium'}>Tuyến / 線路</td>
                <td className={cell} colSpan={3}>{t.title} {t.destination ? `(${t.destination})` : ''}</td>
              </tr>
              <tr>
                <td className={cell + ' bg-gray-50 font-medium'}>Mã đoàn / 團號</td>
                <td className={cell + ' font-mono font-medium'}>{t.code}</td>
                <td className={cell + ' bg-gray-50 font-medium'}>Số khách / 人數</td>
                <td className={cell}>{d.paxCount ?? t.pax} khách</td>
              </tr>
              <tr>
                <td className={cell + ' bg-gray-50 font-medium'}>HDV / 導遊</td>
                <td className={cell}>{g.name || '........'} {g.phone ? `(${g.phone})` : ''}</td>
                <td className={cell + ' bg-gray-50 font-medium'}>Số thẻ HDV / 導遊證號</td>
                <td className={cell}>{g.licenseNo || '........'}</td>
              </tr>
              <tr>
                <td className={cell + ' bg-gray-50 font-medium'}>Tài xế / 司機</td>
                <td className={cell}>{drv.name || '........'} {drv.phone ? `(${drv.phone})` : ''}</td>
                <td className={cell + ' bg-gray-50 font-medium'}>HDV ứng trước / 導遊現付</td>
                <td className={cell}>{fmt(d.guideAdvanceTotal)} VND</td>
              </tr>
              <tr>
                <td className={cell + ' bg-gray-50 font-medium'}>Đơn giá tour / 團費單價</td>
                <td className={cell}>{fmt(t.sellingPrice)} {t.currency}</td>
                <td className={cell + ' bg-gray-50 font-medium'}>Phòng / 房間</td>
                <td className={cell}>{roomEntries.length ? roomEntries.map(([k, v]) => `${k}: ${v}`).join(' · ') : '........'}</td>
              </tr>
              {(t.pickupLocation || t.pickupTime) && (
                <tr>
                  <td className={cell + ' bg-gray-50 font-medium'}>Điểm đón / 集合地點</td>
                  <td className={cell} colSpan={3}>{t.pickupLocation || ''} {t.pickupTime ? `— ${t.pickupTime}` : ''}</td>
                </tr>
              )}
            </tbody>
          </table>

          <h2 className="font-bold mb-2">Lịch trình theo ngày / 每日行程</h2>
          <table className="w-full border-collapse mb-4 text-[13px]">
            <thead>
              <tr className="bg-gray-50">
                <th className={cell + ' w-16'}>Ngày / 日期</th>
                <th className={cell}>Lịch trình / 行程</th>
                <th className={cell + ' w-32'}>Bữa ăn / 用餐</th>
                <th className={cell + ' w-40'}>Khách sạn / 住宿</th>
              </tr>
            </thead>
            <tbody>
              {(d.itineraryDays ?? []).map((day: any) => (
                <tr key={day.dayNumber}>
                  <td className={cell + ' text-center'}>Ngày {day.dayNumber}</td>
                  <td className={cell}>
                    {day.title && <div className="font-medium">{day.title}</div>}
                    {day.description && <div className="text-xs text-gray-600 whitespace-pre-line">{day.description}</div>}
                  </td>
                  <td className={cell + ' text-xs'}>{(day.meals ?? []).join(' · ') || '—'}</td>
                  <td className={cell + ' text-xs'}>{day.accommodation || '—'}</td>
                </tr>
              ))}
              {(!d.itineraryDays || d.itineraryDays.length === 0) && (
                <tr><td className={cell + ' text-center text-gray-400'} colSpan={4}>Chưa có lịch trình chi tiết</td></tr>
              )}
            </tbody>
          </table>

          <h2 className="font-bold mb-2">Ghi chú điều hành / 計调備註</h2>
          <div className="border border-gray-400 p-3 min-h-[80px] text-[13px] whitespace-pre-line mb-6">
            {t.internalNotes || ''}
          </div>

          <div className="grid grid-cols-2 gap-4 text-center text-[13px]">
            <div>
              <p className="font-medium mb-12">Người lập kế hoạch / 計调</p>
              <p className="text-gray-400">(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="font-medium mb-12">Ngày in / 打印日期: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
