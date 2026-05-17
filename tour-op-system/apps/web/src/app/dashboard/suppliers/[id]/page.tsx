'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { suppliersApi, SupplierDetail, Resource } from '@/lib/api/suppliers';

const CAT_ICON: Record<string, string> = {
  HOTEL: '🏨',
  RESORT: '🏖️',
  RESTAURANT: '🍽️',
  TRANSPORT: '🚌',
  BOAT: '⛵',
  GUIDE: '🧭',
  ATTRACTION: '🎡',
  VISA: '📄',
  INSURANCE: '🛡️',
  OTHER: '📦',
};
const UNIT_LABEL: Record<string, string> = {
  per_person: '/ người',
  per_room: '/ phòng',
  per_trip: '/ chuyến',
  per_day: '/ ngày',
  per_vehicle: '/ xe',
  per_table: '/ bàn',
  per_bed: '/ giường',
};

function formatMoney(v: number | string, c: string) {
  return new Intl.NumberFormat('vi-VN').format(Number(v)) + ' ' + c;
}
function InfoRow({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-xs">{value ?? '—'}</span>
    </div>
  );
}

function ResourceModal({
  supplierId,
  category,
  onClose,
  onSaved,
  editing,
}: {
  supplierId: string;
  category: string;
  onClose: () => void;
  onSaved: () => void;
  editing: Resource | null;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? '',
    description: editing?.description ?? '',
    basePrice: editing?.basePrice ?? 0,
    currency: editing?.currency ?? 'VND',
    unit: editing?.unit ?? 'per_person',
    capacity: editing?.capacity ?? '',
    location: editing?.location ?? '',
    category: editing?.category ?? category,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) {
        await suppliersApi.updateResource(supplierId, editing.id, {
          ...form,
          basePrice: Number(form.basePrice),
          capacity: form.capacity ? Number(form.capacity) : undefined,
        });
      } else {
        await suppliersApi.createResource(supplierId, {
          ...form,
          basePrice: Number(form.basePrice),
          capacity: form.capacity ? Number(form.capacity) : undefined,
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg space-y-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-gray-900 text-lg">
          {editing ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ / sản phẩm'}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tên dịch vụ <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Giá cơ bản <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tiền tệ</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className={inputCls}
              >
                {['VND', 'USD', 'EUR', 'THB', 'CNY'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Đơn vị tính</label>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className={inputCls}
              >
                {Object.entries(UNIT_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sức chứa</label>
              <input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                placeholder="VD: 45"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Địa điểm</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="VD: Tầng 5, Tòa nhà A"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm dịch vụ'}
          </button>
        </div>
      </div>
    </div>
  );
}

type Tab = 'info' | 'resources';

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('resources');
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await suppliersApi.getOne(id);
      setSupplier(data);
    } catch {
      router.push('/dashboard/suppliers');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRemoveResource(resourceId: string) {
    if (!confirm('Xoá dịch vụ này?')) return;
    await suppliersApi.removeResource(id, resourceId);
    load();
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!supplier) return null;

  const activeResources = supplier.resources.filter((r) => r.isActive);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard/suppliers')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2 block"
          >
            ← Danh sách NCC
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{CAT_ICON[supplier.category]}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-gray-400">{supplier.code}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {supplier.category}
                </span>
                {supplier.isPreferred && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    ⭐ Ưu tiên
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {supplier.isActive ? 'Hoạt động' : 'Ngừng'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(
          [
            ['resources', `🛎️ Dịch vụ (${activeResources.length})`],
            ['info', 'ℹ️ Thông tin'],
          ] as [Tab, string][]
        ).map(([t, l]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'resources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Sản phẩm / dịch vụ của <strong>{supplier.name}</strong>
            </p>
            <button
              onClick={() => {
                setEditingResource(null);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Thêm dịch vụ
            </button>
          </div>

          {activeResources.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-sm">Chưa có dịch vụ nào</p>
              <button
                onClick={() => {
                  setEditingResource(null);
                  setShowModal(true);
                }}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Thêm dịch vụ đầu tiên →
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Tên dịch vụ', 'Đơn vị', 'Giá cơ bản', 'Sức chứa', 'Địa điểm', ''].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 font-medium text-gray-500 text-xs"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeResources.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.name}</p>
                        {r.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{UNIT_LABEL[r.unit] ?? r.unit}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatMoney(r.basePrice, r.currency)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.capacity ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.location ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingResource(r);
                              setShowModal(true);
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleRemoveResource(r.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Thông tin cơ bản</h2>
            <InfoRow label="Loại" value={supplier.category} />
            <InfoRow label="Liên hệ" value={supplier.contactPerson} />
            <InfoRow label="Email" value={supplier.email} />
            <InfoRow label="Điện thoại" value={supplier.phone} />
            <InfoRow
              label="Đánh giá"
              value={`${'★'.repeat(supplier.rating)}${'☆'.repeat(5 - supplier.rating)}`}
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Địa chỉ & Thanh toán</h2>
            <InfoRow label="Địa chỉ" value={supplier.address} />
            <InfoRow label="Thành phố" value={supplier.city} />
            <InfoRow label="Quốc gia" value={supplier.country} />
            <InfoRow label="Tiền tệ" value={supplier.currency} />
            <InfoRow label="Điều khoản TT" value={supplier.paymentTerms} />
          </div>
        </div>
      )}

      {showModal && supplier && (
        <ResourceModal
          supplierId={supplier.id}
          category={supplier.category}
          editing={editingResource}
          onClose={() => {
            setShowModal(false);
            setEditingResource(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditingResource(null);
            load();
          }}
        />
      )}
    </div>
  );
}
