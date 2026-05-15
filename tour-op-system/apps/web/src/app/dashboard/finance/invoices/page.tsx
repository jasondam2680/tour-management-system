'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { financeApi, Invoice, QueryInvoiceParams, PaymentStatus, InvoiceType } from '@/lib/api/finance';

const toNum = (v: any) => Number(v ?? 0);
const STATUS_LABEL: Record<string,string> = {PAID:'Đã TT',PARTIAL:'Một phần',UNPAID:'Chưa TT',OVERDUE:'Quá hạn'};
const STATUS_COLOR: Record<string,string> = {
  PAID:'bg-green-100 text-green-700', PARTIAL:'bg-yellow-100 text-yellow-700',
  UNPAID:'bg-gray-100 text-gray-600', OVERDUE:'bg-red-100 text-red-700',
};
const TYPE_COLOR: Record<string,string> = {RECEIVABLE:'bg-blue-100 text-blue-700', PAYABLE:'bg-orange-100 text-orange-700'};
const TYPE_LABEL: Record<string,string> = {RECEIVABLE:'Thu (AR)', PAYABLE:'Chi (AP)'};

function formatMoney(v: any, c: string) { return new Intl.NumberFormat('vi-VN').format(Math.round(toNum(v))) + ' ' + c; }
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function getCustomerName(c?: Invoice['customer']) {
  if (!c) return '—';
  return c.type==='B2B' ? (c.companyName??'—') : [c.firstName,c.lastName].filter(Boolean).join(' ')||'—';
}

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta]         = useState({total:0,page:1,totalPages:1});
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState<QueryInvoiceParams>({
    page:1, limit:20,
    overdue: searchParams.get('overdue')==='true' ? 'true' : undefined,
  });

  const load = useCallback(async (q: QueryInvoiceParams) => {
    setLoading(true);
    try {
      const result = await financeApi.getInvoices(q);
      setInvoices(result.data); setMeta(result.meta);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(query); }, [query, load]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => history.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-1 block">← Tài chính</button>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách hoá đơn</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} hoá đơn</p>
        </div>
        <Link href="/dashboard/finance/invoices/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Tạo hoá đơn
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Tìm mã, khách hàng..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setQuery((q) => ({...q, search:e.target.value||undefined, page:1}))} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setQuery((q) => ({...q, type:(e.target.value as InvoiceType)||undefined, page:1}))}>
          <option value="">Tất cả loại</option>
          <option value="RECEIVABLE">Thu (AR)</option>
          <option value="PAYABLE">Chi (AP)</option>
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setQuery((q) => ({...q, status:(e.target.value as PaymentStatus)||undefined, page:1}))}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={query.overdue==='true'}
            onChange={(e) => setQuery((q) => ({...q, overdue:e.target.checked?'true':undefined, page:1}))}
            className="rounded border-gray-300 text-red-600" />
          Chỉ quá hạn
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Đang tải...</div>
        : !invoices.length ? <div className="p-12 text-center text-gray-400">Không có hoá đơn nào</div>
        : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Mã / Khách','Loại','Tour','Tổng tiền','Đã thu','Còn lại','Hạn TT','Trạng thái',''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{getCustomerName(inv.customer)}</p>
                    <p className="text-xs text-gray-400 font-mono">{inv.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLOR[inv.type]}`}>{TYPE_LABEL[inv.type]}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {inv.tour
                      ? <Link href={`/dashboard/tours/${inv.tour.id}`} className="text-blue-600 hover:underline">{inv.tour.code}</Link>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(inv.totalAmount, inv.currency)}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{formatMoney(inv.amountPaid, inv.currency)}</td>
                  <td className="px-4 py-3">
                    {toNum(inv.amountDue) > 0
                      ? <span className="text-red-600 font-medium">{formatMoney(inv.amountDue, inv.currency)}</span>
                      : <span className="text-green-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[inv.status]??''}`}>{STATUS_LABEL[inv.status]??inv.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/finance/invoices/${inv.id}`} className="text-xs text-blue-600 hover:underline">Chi tiết →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setQuery((q) => ({...q, page:(q.page??1)-1}))} disabled={meta.page<=1}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">← Trước</button>
          <span className="text-sm text-gray-600">Trang {meta.page} / {meta.totalPages}</span>
          <button onClick={() => setQuery((q) => ({...q, page:(q.page??1)+1}))} disabled={meta.page>=meta.totalPages}
            className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">Tiếp →</button>
        </div>
      )}
    </div>
  );
}
