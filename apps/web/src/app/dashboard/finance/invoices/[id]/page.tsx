'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { financeApi, Invoice, Receipt } from '@/lib/api/finance';

const toNum = (v: any) => Number(v ?? 0);
const STATUS_COLOR: Record<string,string> = {
  PAID:'bg-green-100 text-green-700', PARTIAL:'bg-yellow-100 text-yellow-700',
  UNPAID:'bg-gray-100 text-gray-600', OVERDUE:'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string,string> = {
  PAID:'Đã thanh toán', PARTIAL:'Thanh toán một phần', UNPAID:'Chưa thanh toán', OVERDUE:'Quá hạn',
};

function formatMoney(v: any, c: string) { return new Intl.NumberFormat('vi-VN').format(Math.round(toNum(v))) + ' ' + c; }
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function getCustomerName(c?: Invoice['customer']) {
  if (!c) return '—';
  return c.type==='B2B' ? (c.companyName??'—') : [c.firstName,c.lastName].filter(Boolean).join(' ')||'—';
}
function InfoRow({label,value}:{label:string;value?:any}) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value??'—'}</span>
    </div>
  );
}

function ReceiptModal({invoiceId,currency,amountDue,onClose,onSaved}:{
  invoiceId:string;currency:string;amountDue:number;onClose:()=>void;onSaved:()=>void;
}) {
  const [form, setForm] = useState({amount:amountDue,currency,exchangeRate:1,method:'bank_transfer',reference:'',notes:''});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSave() {
    if (!form.amount) { setError('Nhập số tiền'); return; }
    setSaving(true); setError('');
    try {
      await financeApi.addReceipt(invoiceId,{
        amount:Number(form.amount), currency:form.currency as any,
        exchangeRate:Number(form.exchangeRate), method:form.method,
        reference:form.reference||undefined, notes:form.notes||undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 text-lg">💳 Ghi nhận thanh toán</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Số tiền <span className="text-red-500">*</span></label>
            <input type="number" min={0.01} value={form.amount}
              onChange={(e) => setForm((f) => ({...f,amount:Number(e.target.value)}))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tiền tệ</label>
            <select value={form.currency} onChange={(e) => setForm((f) => ({...f,currency:e.target.value}))} className={inputCls}>
              {['USD','VND','EUR','THB','CNY'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phương thức</label>
            <select value={form.method} onChange={(e) => setForm((f) => ({...f,method:e.target.value}))} className={inputCls}>
              <option value="bank_transfer">Chuyển khoản</option>
              <option value="cash">Tiền mặt</option>
              <option value="card">Thẻ</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tỷ giá</label>
            <input type="number" min={1} step={0.0001} value={form.exchangeRate}
              onChange={(e) => setForm((f) => ({...f,exchangeRate:Number(e.target.value)}))} className={inputCls} />
          </div>
        </div>
        <input value={form.reference} onChange={(e) => setForm((f) => ({...f,reference:e.target.value}))}
          placeholder="Số tham chiếu / mã giao dịch" className={inputCls} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Huỷ</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Xác nhận thu tiền'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const {id}   = useParams<{id:string}>();
  const router = useRouter();
  const [invoice, setInvoice]         = useState<Invoice|null>(null);
  const [loading, setLoading]         = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  async function load() {
    setLoading(true);
    try { setInvoice(await financeApi.getInvoice(id)); }
    catch { router.push('/dashboard/finance/invoices'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!invoice) return null;

  const isAR      = invoice.type === 'RECEIVABLE';
  const canReceipt = isAR && invoice.status !== 'PAID';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/dashboard/finance/invoices')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← Danh sách hoá đơn</button>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.code}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${isAR?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-700'}`}>
              {isAR?'💙 Thu (AR)':'🟠 Chi (AP)'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[invoice.status]??''}`}>
              {STATUS_LABEL[invoice.status]??invoice.status}
            </span>
          </div>
        </div>
        {canReceipt && (
          <button onClick={() => setShowReceipt(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            💳 Ghi nhận thanh toán
          </button>
        )}
      </div>

      {showReceipt && (
        <ReceiptModal
          invoiceId={invoice.id} currency={invoice.currency} amountDue={invoice.amountDue}
          onClose={() => setShowReceipt(false)} onSaved={() => { setShowReceipt(false); load(); }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200"><h2 className="font-semibold text-gray-800">Chi tiết tài chính</h2></div>
            <div className="p-5 space-y-0">
              <InfoRow label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} />
              <InfoRow label={`Thuế (${toNum(invoice.taxPct)}%)`} value={formatMoney(invoice.taxAmount, invoice.currency)} />
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-800">Tổng cộng</span>
                <span className="text-lg font-bold text-blue-600">{formatMoney(invoice.totalAmount, invoice.currency)}</span>
              </div>
              <InfoRow label="Đã thanh toán" value={<span className="text-green-600 font-bold">{formatMoney(invoice.amountPaid, invoice.currency)}</span>} />
              <InfoRow label="Còn phải thu" value={<span className={toNum(invoice.amountDue)>0?'text-red-600 font-bold':'text-green-600'}>{formatMoney(invoice.amountDue, invoice.currency)}</span>} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Lịch sử thanh toán ({invoice.receipts?.length??0})</h2>
            </div>
            {!invoice.receipts?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">Chưa có thanh toán nào</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-gray-50">
                  {['Ngày','Số tiền','Phương thức','Tham chiếu'].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.receipts.map((r: Receipt) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-600">{formatDate(r.receivedAt)}</td>
                      <td className="px-5 py-3 font-medium text-green-600">{formatMoney(r.amount, r.currency)}</td>
                      <td className="px-5 py-3 text-gray-600 capitalize">{r.method.replace('_',' ')}</td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{r.reference??'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Khách hàng</h2>
            <InfoRow label="Tên"  value={getCustomerName(invoice.customer)} />
            <InfoRow label="Loại" value={invoice.customer?.type} />
          </div>

          {invoice.tour && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Tour liên kết</h2>
              <Link href={`/dashboard/tours/${invoice.tour.id}`} className="text-sm font-medium text-blue-600 hover:underline">{invoice.tour.code}</Link>
              <p className="text-sm text-gray-600 mt-1">{invoice.tour.title}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Thời hạn</h2>
            <InfoRow label="Ngày phát hành" value={formatDate(invoice.issuedAt)} />
            <InfoRow label="Hạn thanh toán" value={formatDate(invoice.dueDate)} />
          </div>

          {invoice.notes && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-2">Ghi chú</h2>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
