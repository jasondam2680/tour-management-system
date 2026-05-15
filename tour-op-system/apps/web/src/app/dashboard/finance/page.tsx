'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { financeApi, FinanceOverview, Invoice } from '@/lib/api/finance';

const toNum = (v: any) => Number(v ?? 0);
function formatMoney(v: any, c = 'USD') { return new Intl.NumberFormat('vi-VN').format(Math.round(toNum(v))) + ' ' + c; }
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric'});
}
function getCustomerName(c?: Invoice['customer']) {
  if (!c) return '—';
  return c.type==='B2B' ? (c.companyName??'—') : [c.firstName,c.lastName].filter(Boolean).join(' ')||'—';
}

const PAYMENT_BADGE: Record<string,string> = {
  PAID:'bg-green-100 text-green-700', PARTIAL:'bg-yellow-100 text-yellow-700',
  UNPAID:'bg-gray-100 text-gray-600', OVERDUE:'bg-red-200 text-red-800 font-bold',
};
const PAYMENT_LABEL: Record<string,string> = {PAID:'Đã TT',PARTIAL:'Một phần',UNPAID:'Chưa TT',OVERDUE:'Quá hạn'};

function MetricCard({label,value,sub,accent,icon}:{label:string;value:string|number;sub?:string;accent?:string;icon:string}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 items-start">
      <div className={`text-2xl p-2.5 rounded-xl ${accent??'bg-gray-100'}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MonthlyChart({data}:{data:{month:string;revenue:number;collected:number}[]}) {
  if (!data.length) return <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
            <div className="w-full flex gap-0.5 items-end" style={{height:'90%'}}>
              <div className="flex-1 bg-blue-200 rounded-t" style={{height:`${(d.revenue/max)*100}%`}} />
              <div className="flex-1 bg-blue-500 rounded-t" style={{height:`${(d.collected/max)*100}%`}} />
            </div>
            <span className="text-xs text-gray-400">{d.month.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded-sm inline-block" /> Hoá đơn</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> Đã thu</span>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [overview, setOverview] = useState<FinanceOverview|null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    financeApi.getOverview().then(setOverview as any).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!overview) return null;

  const {ar, ap} = overview;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tài chính</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan AR (thu) · AP (chi) · Công nợ</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/finance/invoices" className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">📄 Hoá đơn</Link>
          <Link href="/dashboard/finance/invoices/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Tạo hoá đơn</Link>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">AR — Phải thu từ khách hàng</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon="💰" label="Tổng hoá đơn" accent="bg-blue-50" value={formatMoney(ar.totalAmount)} sub={`${ar.countTotal} hoá đơn`} />
          <MetricCard icon="✅" label="Đã thu"        accent="bg-green-50" value={formatMoney(ar.totalPaid)}   sub={`${ar.countPaid} hoá đơn`} />
          <MetricCard icon="⏳" label="Còn phải thu"  accent="bg-yellow-50" value={formatMoney(ar.totalDue)}  sub={`${ar.countUnpaid} hoá đơn`} />
          <MetricCard icon="🔴" label="Quá hạn"       accent="bg-red-50"  value={ar.countOverdue}             sub="hoá đơn quá hạn" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">AP — Phải trả nhà cung cấp</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard icon="🏢" label="Tổng chi phí NCC" accent="bg-orange-50" value={formatMoney(ap.totalCost,'VND')} sub={`${ap.countTotal} bookings`} />
          <MetricCard icon="✅" label="Đã thanh toán"    accent="bg-green-50" value={formatMoney(ap.totalPaid,'VND')} sub={`${ap.countPaid} bookings`} />
          <MetricCard icon="⏳" label="Còn phải trả"     accent="bg-red-50"   value={formatMoney(ap.totalDue,'VND')}  sub={`${ap.countUnpaid} chưa TT`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Doanh thu theo tháng (6 tháng)</h3>
          <MonthlyChart data={overview.monthlyAR} />
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-red-700">🔴 Hoá đơn quá hạn ({overview.overdueInvoices.length})</h3>
            <Link href="/dashboard/finance/invoices?overdue=true" className="text-xs text-red-600 hover:underline">Xem tất cả →</Link>
          </div>
          {!overview.overdueInvoices.length ? <p className="text-sm text-gray-400">Không có hoá đơn quá hạn 🎉</p> : (
            <div className="space-y-2">
              {overview.overdueInvoices.map((inv) => (
                <Link key={inv.id} href={`/dashboard/finance/invoices/${inv.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{getCustomerName(inv.customer)}</p>
                    <p className="text-xs text-gray-400">{inv.code} · Hạn: {formatDate(inv.dueDate)}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{formatMoney(inv.amountDue, inv.currency)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Hoá đơn gần nhất</h3>
          <Link href="/dashboard/finance/invoices" className="text-sm text-blue-600 hover:underline">Xem tất cả →</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Mã / Khách','Tour','Tổng tiền','Còn lại','Trạng thái',''].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-medium text-gray-500 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {overview.recentInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{getCustomerName(inv.customer)}</p>
                  <p className="text-xs text-gray-400 font-mono">{inv.code}</p>
                </td>
                <td className="px-5 py-3 text-gray-600 text-xs">{inv.tour?.code??'—'}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{formatMoney(inv.totalAmount, inv.currency)}</td>
                <td className="px-5 py-3">
                  {toNum(inv.amountDue) > 0
                    ? <span className="text-red-600 font-medium">{formatMoney(inv.amountDue, inv.currency)}</span>
                    : <span className="text-green-600">Đủ</span>}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${PAYMENT_BADGE[inv.status]??''}`}>{PAYMENT_LABEL[inv.status]??inv.status}</span>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/dashboard/finance/invoices/${inv.id}`} className="text-xs text-blue-600 hover:underline">Chi tiết →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
