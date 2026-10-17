'use client';

import { useEffect, useRef, useState } from 'react';
import {
  auditsApi, TourAudit, TourAuditLine, AuditLineStatus,
  AUDIT_STATUS_LABEL, AUDIT_STATUS_COLOR,
  AUDIT_LINE_STATUS_LABEL, AUDIT_LINE_STATUS_COLOR, AUDIT_SOURCE_LABEL,
} from '@/lib/api/audits';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/api\/v1$/, '');

function fmtMoney(v: any, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(v ?? 0))) + ' ' + currency;
}

const NEXT_ACTIONS: Record<string, { action: string; label: string; style: string }[]> = {
  OPEN: [{ action: 'submit', label: 'Trình kiểm toán', style: 'bg-amber-600 text-white' }],
  SUBMITTED: [
    { action: 'review', label: 'Xác nhận đã kiểm toán', style: 'bg-purple-600 text-white' },
    { action: 'reopen', label: 'Trả về mở', style: 'bg-gray-200' },
  ],
  REVIEWED: [
    { action: 'approve', label: 'Phê duyệt', style: 'bg-green-600 text-white' },
    { action: 'reopen', label: 'Trả về mở', style: 'bg-gray-200' },
  ],
  APPROVED: [{ action: 'close', label: 'Khóa sổ', style: 'bg-gray-800 text-white' }],
  CLOSED: [{ action: 'reopen', label: 'Mở lại', style: 'bg-gray-200' }],
};

export default function AuditSection({ tourId }: { tourId: string }) {
  const [audit, setAudit] = useState<TourAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notOpened, setNotOpened] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [showLineForm, setShowLineForm] = useState(false);
  const [lineForm, setLineForm] = useState({ description: '', claimedAmount: '', currency: 'VND', notes: '' });
  const [reviewing, setReviewing] = useState<TourAuditLine | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'APPROVED' as AuditLineStatus, auditedAmount: '', notes: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadLineId, setUploadLineId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await auditsApi.getByTour(tourId);
      setAudit(data);
      setNotOpened(false);
    } catch {
      setAudit(null);
      setNotOpened(true);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tourId]);

  async function doAction(action: string) {
    if (!audit) return;
    setActing(action);
    try { setAudit(await auditsApi.transition(audit.id, action)); }
    finally { setActing(null); }
  }

  async function openAudit() {
    setActing('open');
    try { setAudit(await auditsApi.open(tourId)); setNotOpened(false); }
    finally { setActing(null); }
  }

  async function saveLine() {
    if (!lineForm.description.trim() || !lineForm.claimedAmount) return;
    setActing('save-line');
    try {
      await auditsApi.createLine(tourId, {
        description: lineForm.description,
        claimedAmount: Number(lineForm.claimedAmount),
        currency: lineForm.currency,
        notes: lineForm.notes,
      });
      setShowLineForm(false);
      setLineForm({ description: '', claimedAmount: '', currency: 'VND', notes: '' });
      await load();
    } finally { setActing(null); }
  }

  async function saveReview() {
    if (!reviewing) return;
    setActing('review-line');
    try {
      await auditsApi.reviewLine(reviewing.id, {
        status: reviewForm.status,
        auditedAmount: reviewForm.auditedAmount ? Number(reviewForm.auditedAmount) : undefined,
        notes: reviewForm.notes,
      });
      setReviewing(null);
      await load();
    } finally { setActing(null); }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadLineId) return;
    setActing('upload');
    try { await auditsApi.uploadBill(uploadLineId, file); await load(); }
    finally { setActing(null); setUploadLineId(null); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function removeLine(id: string) {
    if (!confirm('Xóa dòng này?')) return;
    await auditsApi.removeLine(id);
    await load();
  }

  if (loading) return <div className="text-sm text-gray-500">Đang tải kiểm toán…</div>;

  if (notOpened || !audit) {
    return (
      <div className="border rounded-lg p-6 text-center bg-gray-50">
        <p className="text-sm text-gray-600 mb-3">Đoàn chưa mở kiểm toán. Mở để tự sinh dòng chi phí từ sắp xếp dịch vụ và quyết toán HDV.</p>
        <button onClick={openAudit} disabled={acting === 'open'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {acting === 'open' ? 'Đang mở…' : 'Mở kiểm toán'}
        </button>
      </div>
    );
  }

  const totalClaimed = audit.lines.reduce((s, l) => s + Number(l.claimedAmount ?? 0), 0);
  const totalAudited = audit.lines.reduce((s, l) => s + Number(l.auditedAmount ?? l.claimedAmount ?? 0), 0);
  const closed = audit.status === 'CLOSED';

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${AUDIT_STATUS_COLOR[audit.status]}`}>
            {AUDIT_STATUS_LABEL[audit.status]}
          </span>
          <span className="text-xs text-gray-500">
            Kê khai: <b>{fmtMoney(totalClaimed)}</b> · Duyệt: <b>{fmtMoney(totalAudited)}</b>
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!closed && (
            <button onClick={() => setShowLineForm(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              + Dòng thủ công
            </button>
          )}
          {(NEXT_ACTIONS[audit.status] || []).map((a) => (
            <button key={a.action} onClick={() => doAction(a.action)} disabled={!!acting}
              className={`px-3 py-1.5 text-sm rounded hover:opacity-90 disabled:opacity-50 ${a.style}`}>
              {acting === a.action ? '…' : a.label}
            </button>
          ))}
          <a href={`/dashboard/tours/${tourId}/audit/print`} target="_blank"
            className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200">🖨 核算表</a>
          <a href={`/dashboard/tours/${tourId}/settlement/print`} target="_blank"
            className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200">🖨 结算单</a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-2">Mô tả</th>
              <th className="py-2 pr-2">Nguồn</th>
              <th className="py-2 pr-2 text-right">Kê khai</th>
              <th className="py-2 pr-2 text-right">Đã duyệt</th>
              <th className="py-2 pr-2">Trạng thái</th>
              <th className="py-2 pr-2">Bill</th>
              <th className="py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {audit.lines.map((l) => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-2">{l.description}{l.notes && <div className="text-xs text-gray-400">{l.notes}</div>}</td>
                <td className="py-2 pr-2 text-xs text-gray-500">{AUDIT_SOURCE_LABEL[l.sourceType]}</td>
                <td className="py-2 pr-2 text-right">{fmtMoney(l.claimedAmount, l.currency)}</td>
                <td className="py-2 pr-2 text-right">{l.auditedAmount != null ? fmtMoney(l.auditedAmount, l.currency) : '—'}</td>
                <td className="py-2 pr-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${AUDIT_LINE_STATUS_COLOR[l.status]}`}>
                    {AUDIT_LINE_STATUS_LABEL[l.status]}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  {l.billUrl ? (
                    <a href={`${API_BASE}${l.billUrl}`} target="_blank" className="text-blue-600 text-xs underline">Xem bill</a>
                  ) : !closed ? (
                    <button onClick={() => { setUploadLineId(l.id); fileRef.current?.click(); }}
                      className="text-xs text-blue-600 underline">Upload</button>
                  ) : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="py-2">
                  {!closed && (
                    <div className="flex gap-1">
                      <button onClick={() => { setReviewing(l); setReviewForm({ status: 'APPROVED', auditedAmount: '', notes: l.notes ?? '' }); }}
                        className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Duyệt</button>
                      <button onClick={() => removeLine(l.id)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Xóa</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {audit.lines.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-center text-gray-400">Chưa có dòng chi phí</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={onFileChange} />

      {showLineForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md">
            <h3 className="font-semibold mb-3">Thêm dòng chi phí</h3>
            <input className="w-full border rounded px-3 py-2 mb-2 text-sm" placeholder="Mô tả"
              value={lineForm.description} onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })} />
            <div className="flex gap-2 mb-2">
              <input className="flex-1 border rounded px-3 py-2 text-sm" placeholder="Số tiền" type="number"
                value={lineForm.claimedAmount} onChange={(e) => setLineForm({ ...lineForm, claimedAmount: e.target.value })} />
              <select className="border rounded px-2 py-2 text-sm" value={lineForm.currency}
                onChange={(e) => setLineForm({ ...lineForm, currency: e.target.value })}>
                {['VND', 'USD', 'CNY', 'THB'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input className="w-full border rounded px-3 py-2 mb-3 text-sm" placeholder="Ghi chú"
              value={lineForm.notes} onChange={(e) => setLineForm({ ...lineForm, notes: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowLineForm(false)} className="px-3 py-1.5 text-sm bg-gray-100 rounded">Hủy</button>
              <button onClick={saveLine} disabled={acting === 'save-line'}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded disabled:opacity-50">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md">
            <h3 className="font-semibold mb-3">Duyệt dòng: {reviewing.description}</h3>
            <p className="text-sm text-gray-500 mb-2">Kê khai: {fmtMoney(reviewing.claimedAmount, reviewing.currency)}</p>
            <select className="w-full border rounded px-3 py-2 mb-2 text-sm"
              value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value as AuditLineStatus })}>
              <option value="APPROVED">Duyệt đúng số kê khai</option>
              <option value="ADJUSTED">Điều chỉnh số tiền</option>
              <option value="REJECTED">Từ chối</option>
            </select>
            {reviewForm.status === 'ADJUSTED' && (
              <input className="w-full border rounded px-3 py-2 mb-2 text-sm" placeholder="Số tiền duyệt" type="number"
                value={reviewForm.auditedAmount} onChange={(e) => setReviewForm({ ...reviewForm, auditedAmount: e.target.value })} />
            )}
            <input className="w-full border rounded px-3 py-2 mb-3 text-sm" placeholder="Ghi chú duyệt"
              value={reviewForm.notes} onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setReviewing(null)} className="px-3 py-1.5 text-sm bg-gray-100 rounded">Hủy</button>
              <button onClick={saveReview} disabled={acting === 'review-line'}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded disabled:opacity-50">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
