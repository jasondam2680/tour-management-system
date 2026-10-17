'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { guidesApi } from '@/lib/api/guides';

export default function SettlementPrintPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setS(await guidesApi.getSettlement(id));
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: any) => (n === null || n === undefined ? '0' : Number(n).toLocaleString('vi-VN'));
  const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : '........');

  if (loading) return <div className="p-6 text-sm text-gray-400">Đang tải...</div>;
  if (!s) return <div className="p-6 text-sm text-red-600">Không tải được quyết toán</div>;

  const org = s.organization ?? {};
  const g = s.guide ?? {};
  const t = s.tour ?? {};

  const cell = 'border border-gray-400 px-2 py-1.5';

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
          {/* Header công ty */}
          <div className="text-center mb-4">
            <p className="font-bold text-lg uppercase">{org.name || '................................'}</p>
            {org.address && <p className="text-xs text-gray-600">{org.address}</p>}
            <p className="text-xs text-gray-600">
              {org.phone ? `ĐT: ${org.phone}` : ''}{org.taxCode ? ` · MST: ${org.taxCode}` : ''}
            </p>
          </div>

          <h1 className="text-center font-bold text-xl mb-1">BẢNG THANH TOÁN CHO HDV</h1>
          <p className="text-center text-gray-600 mb-4">導遊結帳表</p>

          {/* Thông tin đoàn + HDV */}
          <table className="w-full border-collapse mb-4 text-[13px]">
            <tbody>
              <tr>
                <td className={cell + ' w-1/4 bg-gray-50 font-medium'}>Mã đoàn / 團號</td>
                <td className={cell + ' w-1/4 font-mono'}>{t.code || '........'}</td>
                <td className={cell + ' w-1/4 bg-gray-50 font-medium'}>Tên HDV / 導遊姓名</td>
                <td className={cell + ' w-1/4 font-medium'}>{g.fullName}</td>
              </tr>
              <tr>
                <td className={cell + ' bg-gray-50 font-medium'}>Số lượng khách / 人數</td>
                <td className={cell}>{t.pax ?? '........'}</td>
                <td className={cell + ' bg-gray-50 font-medium'}>Số tài khoản / 賬號</td>
                <td className={cell + ' font-mono text-xs'}>{g.bankAccount || '........'}</td>
              </tr>
              <tr>
                <td className={cell + ' bg-gray-50 font-medium'}>Số ngày / 天數</td>
                <td className={cell}>{s.days}</td>
                <td className={cell + ' bg-gray-50 font-medium'}>Ngân hàng / 銀行</td>
                <td className={cell}>{g.bankName || '........'}</td>
              </tr>
              <tr>
                <td className={cell + ' bg-gray-50 font-medium'}>Ngày đón đoàn / 接團日期</td>
                <td className={cell}>{fmtDate(t.travelDateFrom)}</td>
                <td className={cell + ' bg-gray-50 font-medium'}>Ngày tiễn đoàn / 送團日期</td>
                <td className={cell}>{fmtDate(t.travelDateTo)}</td>
              </tr>
            </tbody>
          </table>

          {/* 4 khối tính toán */}
          <table className="w-full border-collapse mb-4 text-[13px]">
            <tbody>
              <tr>
                <td colSpan={2} className={cell + ' bg-gray-100 font-bold'}>1. Công tác phí / 出差費</td>
              </tr>
              <tr>
                <td className={cell + ' pl-6'}>Số ngày × phí/ngày: {s.days} × {fmt(s.dailyRate)}</td>
                <td className={cell + ' text-right font-medium w-48'}>{fmt(s.perDiem)}</td>
              </tr>
              <tr>
                <td colSpan={2} className={cell + ' bg-gray-100 font-bold'}>2. Thu nhập khác / 其他收入</td>
              </tr>
              <tr>
                <td className={cell + ' pl-6'}>Tiền tip</td>
                <td className={cell + ' text-right w-48'}>{fmt(s.tipAmount)}</td>
              </tr>
              <tr>
                <td className={cell + ' pl-6'}>Thu nhập khác</td>
                <td className={cell + ' text-right w-48'}>{fmt(s.otherIncome)}</td>
              </tr>
              <tr>
                <td colSpan={2} className={cell + ' bg-gray-100 font-bold'}>3. Tổng tiền HDV đã chi / 導遊已付總額</td>
              </tr>
              {(s.lines ?? []).map((l: any) => (
                <tr key={l.id}>
                  <td className={cell + ' pl-6'}>{l.description}</td>
                  <td className={cell + ' text-right w-48'}>{fmt(l.amount)}</td>
                </tr>
              ))}
              <tr>
                <td className={cell + ' pl-6 font-medium'}>Cộng</td>
                <td className={cell + ' text-right font-medium w-48'}>{fmt(s.totalExpenses)}</td>
              </tr>
              <tr>
                <td colSpan={2} className={cell + ' bg-gray-100 font-bold'}>4. Các khoản trừ / 扣除項目</td>
              </tr>
              <tr>
                <td className={cell + ' pl-6'}>Tạm ứng / 預支</td>
                <td className={cell + ' text-right w-48'}>{fmt(s.advanceDeduction)}</td>
              </tr>
              <tr>
                <td className={cell + ' pl-6'}>Thuế TNCN {s.pitRate}% / 個人所得稅</td>
                <td className={cell + ' text-right w-48'}>{fmt(s.pitTax)}</td>
              </tr>
              <tr>
                <td className={cell + ' bg-yellow-100 font-bold text-base'}>TỔNG TIỀN CẦN THANH TOÁN / 應付總額 ({s.currency})</td>
                <td className={cell + ' bg-yellow-100 text-right font-bold text-base w-48'}>{fmt(s.netPayable)}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-gray-500 mb-6">
            Ghi chú: công tác phí + thu nhập khác + HDV đã chi − tạm ứng − thuế TNCN {s.pitRate}% (tính trên công tác phí) = tổng thanh toán.
            {s.notes ? ` ${s.notes}` : ''}
          </p>

          {/* 3 chữ ký */}
          <table className="w-full text-center text-[13px]">
            <tbody>
              <tr>
                <td className="w-1/3 font-medium">Người lập biểu<br /><span className="text-gray-500 font-normal">製表人</span></td>
                <td className="w-1/3 font-medium">Kế toán<br /><span className="text-gray-500 font-normal">會計</span></td>
                <td className="w-1/3 font-medium">Người phê duyệt<br /><span className="text-gray-500 font-normal">審批人</span></td>
              </tr>
              <tr>
                <td className="h-20 text-xs text-gray-400 align-bottom pb-1">(Ký, ghi rõ họ tên)</td>
                <td className="h-20 text-xs text-gray-400 align-bottom pb-1">(Ký, ghi rõ họ tên)</td>
                <td className="h-20 text-xs text-gray-400 align-bottom pb-1">(Ký, ghi rõ họ tên)</td>
              </tr>
              <tr>
                <td className="text-xs">{s.preparedBy || ''}</td>
                <td className="text-xs"></td>
                <td className="text-xs">{s.approvedBy || ''}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-right text-xs text-gray-400 mt-6">Mã phiếu: {s.code}</p>
        </div>
      </div>
    </div>
  );
}
