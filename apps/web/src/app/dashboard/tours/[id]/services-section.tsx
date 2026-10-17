'use client';

import { useEffect, useState } from 'react';
import {
  arrangementsApi, ServiceArrangement, ServiceType,
  SERVICE_TYPE_LABEL, SERVICE_TYPE_ORDER, PAY_BY_LABEL,
  ARR_STATUS_LABEL, ARR_STATUS_COLOR,
} from '@/lib/api/arrangements';
import { api } from '@/lib/api-client';

const CURRENCIES = ['VND', 'USD', 'CNY', 'THB', 'EUR'];

function fmtMoney(v: any, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(v ?? 0))) + ' ' + currency;
}
function fmtDate(v?: string) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
}

const EMPTY_FORM = {
  serviceType: 'HOTEL' as ServiceType,
  supplierId: '', serviceDate: '', description: '',
  quantity: '1', unitPrice: '', currency: 'VND',
  payBy: 'COMPANY_DIRECT', notes: '',
};

export default function ServicesSection({ tourId }: { tourId: string }) {
  const [items, setItems] = useState<ServiceArrangement[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceArrangement | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await arrangementsApi.list(tourId, filterType ? { serviceType: filterType } : undefined);
      setItems(data);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tourId, filterType]);
  useEffect(() => {
    api.get<any[]>('/suppliers', { limit: 100 }).then(setSuppliers).catch(() => {});
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }
  function openEdit(item: ServiceArrangement) {
    setEditing(item);
    setForm({
      serviceType: item.serviceType,
      supplierId: item.supplierId ?? '',
      serviceDate: item.serviceDate ? item.serviceDate.slice(0, 10) : '',
      description: item.description ?? '',
      quantity: String(item.quantity ?? 1),
      unitPrice: String(item.unitPrice ?? ''),
      currency: item.currency ?? 'VND',
      payBy: item.payBy,
      notes: item.notes ?? '',
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.unitPrice) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: form.quantity === '' ? undefined : Number(form.quantity),
        unitPrice: Number(form.unitPrice),
      };
      if (editing) await arrangementsApi.update(editing.id, payload);
      else await arrangementsApi.create(tourId, payload);
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  }

  async function doAction(id: string, fn: () => Promise<any>) {
    setActing(id);
    try { await fn(); await load(); }
    finally { setActing(null); }
  }

  async function handlePayment(item: ServiceArrangement) {
    if (!confirm(`Tạo đề nghị thanh toán NCC cho "${item.description || SERVICE_TYPE_LABEL[item.serviceType]}" — ${fmtMoney(item.totalAmount, item.currency)}?`)) return;
    await doAction(item.id, async () => {
      const p = await arrangementsApi.createPayment(item.id);
      alert(`Đã tạo thanh toán NCC: ${fmtMoney(p.amount, p.currency)}${p.supplierId ? '' : ' (chưa gắn NCC)'}`);
    });
  }

  const grouped = SERVICE_TYPE_ORDER
    .map((t) => ({ type: t, rows: items.filter((i) => i.serviceType === t) }))
    .filter((g) => g.rows.length > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">🧩 Sắp xếp dịch vụ ({items.length})</h2>
        <div className="flex items-center gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5">
            <option value="">Tất cả loại</option>
            {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
              <option key={t} value={t}>{SERVICE_TYPE_LABEL[t]}</option>
            ))}
          </select>
          <button onClick={openAdd}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium">
            + Thêm dịch vụ
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-400">Đang tải...</p>
      : !items.length ? (
        <p className="text-sm text-gray-400 text-center py-4">Chưa sắp xếp dịch vụ nào</p>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <div key={g.type}>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">
                {SERVICE_TYPE_LABEL[g.type]} ({g.rows.length})
              </p>
              <div className="space-y-1.5">
                {g.rows.map((it) => (
                  <div key={it.id}
                    className="flex items-center justify-between gap-2 py-2 px-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {it.description || SERVICE_TYPE_LABEL[it.serviceType]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ARR_STATUS_COLOR[it.status]}`}>
                          {ARR_STATUS_LABEL[it.status]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {it.supplier?.name && <span>{it.supplier.name} · </span>}
                        {it.serviceDate && <span>{fmtDate(it.serviceDate)} · </span>}
                        <span>{PAY_BY_LABEL[it.payBy]}</span>
                        {it.quantity != null && Number(it.quantity) !== 1 && (
                          <span> · SL {Number(it.quantity)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-semibold text-gray-900 mr-1">
                        {fmtMoney(it.totalAmount, it.currency)}
                      </span>
                      {it.status === 'PENDING' && (
                        <button disabled={acting === it.id}
                          onClick={() => doAction(it.id, () => arrangementsApi.confirm(it.id))}
                          className="text-xs border border-blue-300 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md">
                          ✓ Xác nhận
                        </button>
                      )}
                      {it.status !== 'PAID' && it.status !== 'CANCELLED' && (
                        <button disabled={acting === it.id}
                          onClick={() => doAction(it.id, () => arrangementsApi.markPaid(it.id))}
                          className="text-xs border border-green-300 text-green-600 hover:bg-green-50 px-2 py-1 rounded-md">
                          Đã TT
                        </button>
                      )}
                      {it.status !== 'CANCELLED' && (
                        <button disabled={acting === it.id} title="Tạo đề nghị thanh toán NCC"
                          onClick={() => handlePayment(it)}
                          className="text-xs border border-amber-300 text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-md font-bold">
                          $
                        </button>
                      )}
                      {it.status !== 'PAID' && (
                        <>
                          <button onClick={() => openEdit(it)}
                            className="text-xs text-gray-500 hover:text-gray-800 px-1.5 py-1">Sửa</button>
                          <button onClick={() => { if (confirm('Xoá dòng này?')) doAction(it.id, () => arrangementsApi.remove(it.id)); }}
                            className="text-xs text-red-400 hover:text-red-600 px-1.5 py-1">Xoá</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 text-lg">
              {editing ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Loại dịch vụ
                <select value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value as ServiceType })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {(Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]).map((t) => (
                    <option key={t} value={t}>{SERVICE_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">Nhà cung cấp
                <select value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">— Chưa chọn —</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm col-span-2">Mô tả
                <input value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="VD: Khách sạn Muong Thanh, vé Bà Nà Hills..."
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">Ngày dùng
                <input type="date" value={form.serviceDate}
                  onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">Phương thức TT
                <select value={form.payBy}
                  onChange={(e) => setForm({ ...form, payBy: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="COMPANY_DIRECT">Cty trả trực tiếp</option>
                  <option value="COMPANY_TOPUP">Cty topup</option>
                  <option value="GUIDE_SELF">HDV tự thanh toán</option>
                </select>
              </label>
              <label className="text-sm">Số lượng
                <input type="number" min="0" step="0.5" value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">Đơn giá *
                <input type="number" min="0" value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">Tiền tệ
                <select value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-sm">Ghi chú
                <input value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </label>
            </div>
            {form.unitPrice && (
              <p className="text-sm text-gray-600">
                Thành tiền (server tự tính): <b>{fmtMoney(Number(form.quantity || 1) * Number(form.unitPrice), form.currency)}</b>
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">Đóng</button>
              <button onClick={handleSave} disabled={saving || !form.unitPrice}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
