'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { guidesApi } from '@/lib/api/guides';
import { toursApi } from '@/lib/api/tours';

type Tab = 'profile' | 'assignments' | 'advances' | 'settlements';

const ADV_STATUS: Record<string, string> = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', PAID: 'Đã chi', SETTLED: 'Đã quyết toán', CANCELLED: 'Đã hủy',
};
const STT_STATUS: Record<string, string> = {
  DRAFT: 'Nháp', SUBMITTED: 'Đã trình', APPROVED: 'Đã duyệt', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy',
};

export default function GuideDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState<Tab>('profile');
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, t] = await Promise.all([
        guidesApi.getOne(id),
        toursApi.getAll({ limit: 200 }).catch(() => ({ data: [] })),
      ]);
      setGuide(g);
      setTours((t as any)?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: any) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('vi-VN'));
  const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('vi-VN') : '—');

  if (loading) return <div className="p-6 text-sm text-gray-400">Đang tải...</div>;
  if (!guide) return <div className="p-6 text-sm text-gray-400">Không tìm thấy HDV</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Hồ sơ' },
    { key: 'assignments', label: `Phân công (${guide.assignments?.length ?? 0})` },
    { key: 'advances', label: `Tạm ứng (${guide.advances?.length ?? 0})` },
    { key: 'settlements', label: `Quyết toán (${guide.settlements?.length ?? 0})` },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <button onClick={() => router.push('/dashboard/guides')} className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← Danh sách HDV</button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{guide.fullName}</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">{guide.code} · {guide.phone || '—'} · {guide.licenseNo || 'chưa có thẻ HDV'}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full ${guide.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {guide.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          </span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab guide={guide} onSaved={load} fmt={fmt} />}

      {tab === 'assignments' && (
        <AssignmentsTab guideId={id} assignments={guide.assignments ?? []} tours={tours} onChanged={load} fmt={fmt} fmtDate={fmtDate} />
      )}

      {tab === 'advances' && (
        <AdvancesTab guideId={id} advances={guide.advances ?? []} tours={tours} onChanged={load} fmt={fmt} fmtDate={fmtDate} />
      )}

      {tab === 'settlements' && (
        <SettlementsTab guideId={id} settlements={guide.settlements ?? []} tours={tours} onChanged={load} fmt={fmt} fmtDate={fmtDate} router={router} />
      )}
    </div>
  );
}

// ================= PROFILE =================
function ProfileTab({ guide, onSaved, fmt }: any) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: guide.fullName ?? '', phone: guide.phone ?? '', idCard: guide.idCard ?? '',
    licenseNo: guide.licenseNo ?? '', languages: (guide.languages ?? []).join(', '),
    bankName: guide.bankName ?? '', bankAccount: guide.bankAccount ?? '', accountName: guide.accountName ?? '',
    defaultDailyRate: guide.defaultDailyRate ?? '', status: guide.status, notes: guide.notes ?? '',
  });

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function save() {
    setSaving(true);
    try {
      await guidesApi.update(guide.id, {
        ...form,
        languages: form.languages.split(',').map((s: string) => s.trim()).filter(Boolean),
        defaultDailyRate: form.defaultDailyRate === '' ? undefined : Number(form.defaultDailyRate),
      });
      setEditing(false);
      onSaved();
    } finally { setSaving(false); }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const row = (label: string, value: any) => (
    <div className="flex py-2 border-b border-gray-50 last:border-0">
      <div className="w-44 text-sm text-gray-500 flex-shrink-0">{label}</div>
      <div className="text-sm text-gray-900">{value || '—'}</div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">Hồ sơ hướng dẫn viên</h2>
        {!editing
          ? <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:text-blue-800">✎ Sửa</button>
          : <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-3 py-1.5 border rounded-lg">Hủy</button>
              <button onClick={save} disabled={saving} className="text-sm text-white bg-blue-600 px-3 py-1.5 rounded-lg disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>}
      </div>
      {!editing ? (
        <div>
          {row('Mã HDV', <span className="font-mono text-xs">{guide.code}</span>)}
          {row('Họ tên', guide.fullName)}
          {row('SĐT', guide.phone)}
          {row('CMND/CCCD', guide.idCard)}
          {row('Số thẻ HDV', guide.licenseNo)}
          {row('Ngôn ngữ', (guide.languages ?? []).join(', '))}
          {row('Ngân hàng', guide.bankName)}
          {row('Số TK', guide.bankAccount)}
          {row('Chủ TK', guide.accountName)}
          {row('Giá mặc định/ngày', fmt(guide.defaultDailyRate))}
          {row('Ghi chú', guide.notes)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-500 mb-1">Họ tên</label><input name="fullName" value={form.fullName} onChange={ch} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">SĐT</label><input name="phone" value={form.phone} onChange={ch} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">CMND/CCCD</label><input name="idCard" value={form.idCard} onChange={ch} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Số thẻ HDV</label><input name="licenseNo" value={form.licenseNo} onChange={ch} className={inputCls} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Ngôn ngữ (cách nhau dấu phẩy)</label><input name="languages" value={form.languages} onChange={ch} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Ngân hàng</label><input name="bankName" value={form.bankName} onChange={ch} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Số TK</label><input name="bankAccount" value={form.bankAccount} onChange={ch} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Chủ TK</label><input name="accountName" value={form.accountName} onChange={ch} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Giá mặc định/ngày</label><input name="defaultDailyRate" type="number" min="0" value={form.defaultDailyRate} onChange={ch} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
            <select name="status" value={form.status} onChange={ch} className={inputCls}>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Ghi chú</label><textarea name="notes" value={form.notes} onChange={ch} rows={2} className={inputCls} /></div>
        </div>
      )}
    </div>
  );
}

// ================= ASSIGNMENTS =================
function AssignmentsTab({ guideId, assignments, tours, onChanged, fmt, fmtDate }: any) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tourId: '', role: 'GUIDE', startAt: '', endAt: '', days: '', dailyRate: '', notes: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tourId) return;
    setSaving(true);
    try {
      await guidesApi.createAssignment(guideId, {
        ...form,
        days: form.days === '' ? undefined : Number(form.days),
        dailyRate: form.dailyRate === '' ? undefined : Number(form.dailyRate),
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
      });
      setShowForm(false);
      setForm({ tourId: '', role: 'GUIDE', startAt: '', endAt: '', days: '', dailyRate: '', notes: '' });
      onChanged();
    } finally { setSaving(false); }
  }

  async function remove(aid: string) {
    if (!confirm('Xóa phân công này?')) return;
    await guidesApi.removeAssignment(guideId, aid);
    onChanged();
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Phân công đoàn
        </button>
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Đoàn *</label>
            <select value={form.tourId} onChange={(e) => setForm({ ...form, tourId: e.target.value })} className={inputCls} required>
              <option value="">— Chọn đoàn —</option>
              {tours.map((t: any) => <option key={t.id} value={t.id}>{t.code} — {t.title}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Số ngày</label>
            <input type="number" min="0" step="0.5" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Giá/ngày (VND)</label>
            <input type="number" min="0" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Giờ lên đoàn</label>
            <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Giờ xuống đoàn</label>
            <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className={inputCls} /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
          <div className="col-span-2">
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {saving ? 'Đang lưu...' : 'Lưu phân công'}
            </button>
          </div>
        </form>
      )}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            {['Đoàn', 'Vai trò', 'Số ngày', 'Giá/ngày', 'Phí HDV', 'Lên/xuống đoàn', ''].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa phân công đoàn nào</td></tr>}
            {assignments.map((a: any) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><span className="font-mono text-xs text-blue-700">{a.tour?.code}</span><div className="text-xs text-gray-500">{a.tour?.title}</div></td>
                <td className="px-4 py-3">{a.role}</td>
                <td className="px-4 py-3">{a.days ?? '—'}</td>
                <td className="px-4 py-3">{fmt(a.dailyRate)}</td>
                <td className="px-4 py-3 font-medium">{fmt(a.fee)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{a.startAt ? fmtDate(a.startAt) : '—'} → {a.endAt ? fmtDate(a.endAt) : '—'}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-700 text-xs">Xóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================= ADVANCES =================
function AdvancesTab({ guideId, advances, tours, onChanged, fmt, fmtDate }: any) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tourId: '', amount: '', currency: 'VND', method: 'bank_transfer', advanceDate: '', bankAccount: '', notes: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) return;
    setSaving(true);
    try {
      await guidesApi.createAdvance(guideId, {
        ...form,
        amount: Number(form.amount),
        tourId: form.tourId || undefined,
        advanceDate: form.advanceDate || undefined,
      });
      setShowForm(false);
      setForm({ tourId: '', amount: '', currency: 'VND', method: 'bank_transfer', advanceDate: '', bankAccount: '', notes: '' });
      onChanged();
    } finally { setSaving(false); }
  }

  async function act(id: string, fn: (x: string) => Promise<any>) {
    await fn(id);
    onChanged();
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Tạm ứng mới
        </button>
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Đoàn (tùy chọn)</label>
            <select value={form.tourId} onChange={(e) => setForm({ ...form, tourId: e.target.value })} className={inputCls}>
              <option value="">— Không gắn đoàn —</option>
              {tours.map((t: any) => <option key={t.id} value={t.id}>{t.code} — {t.title}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Số tiền *</label>
            <input type="number" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tiền tệ</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
              <option value="VND">VND</option><option value="USD">USD</option><option value="CNY">CNY</option>
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Hình thức</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputCls}>
              <option value="bank_transfer">Chuyển khoản</option><option value="cash">Tiền mặt</option><option value="other">Khác</option>
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạm ứng</label>
            <input type="date" value={form.advanceDate} onChange={(e) => setForm({ ...form, advanceDate: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">TK cá nhân nhận</label>
            <input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
          <div className="col-span-2">
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {saving ? 'Đang lưu...' : 'Lưu tạm ứng'}
            </button>
          </div>
        </form>
      )}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            {['Mã', 'Ngày', 'Đoàn', 'Số tiền', 'Trạng thái', 'Thao tác'].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {advances.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa có tạm ứng</td></tr>}
            {advances.map((a: any) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                <td className="px-4 py-3">{fmtDate(a.advanceDate)}</td>
                <td className="px-4 py-3 text-xs">{a.tour ? <span className="font-mono text-blue-700">{a.tour.code}</span> : '—'}</td>
                <td className="px-4 py-3 font-medium">{fmt(a.amount)} {a.currency}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{ADV_STATUS[a.status]}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 text-xs">
                    {a.status === 'PENDING' && <button onClick={() => act(a.id, guidesApi.approveAdvance)} className="text-blue-600 hover:text-blue-800">Duyệt</button>}
                    {a.status === 'APPROVED' && <button onClick={() => act(a.id, guidesApi.markAdvancePaid)} className="text-green-600 hover:text-green-800">Đã chi</button>}
                    {(a.status === 'PENDING' || a.status === 'APPROVED') && <button onClick={() => act(a.id, guidesApi.cancelAdvance)} className="text-red-500 hover:text-red-700">Hủy</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================= SETTLEMENTS (list + create) =================
function SettlementsTab({ guideId, settlements, tours, onChanged, fmt, fmtDate, router }: any) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tourId: '', days: '', dailyRate: '', tipAmount: '', otherIncome: '', advanceDeduction: '', pitRate: '10', notes: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const s = await guidesApi.createSettlement({
        guideId,
        tourId: form.tourId || undefined,
        days: form.days === '' ? undefined : Number(form.days),
        dailyRate: form.dailyRate === '' ? undefined : Number(form.dailyRate),
        tipAmount: form.tipAmount === '' ? undefined : Number(form.tipAmount),
        otherIncome: form.otherIncome === '' ? undefined : Number(form.otherIncome),
        advanceDeduction: form.advanceDeduction === '' ? undefined : Number(form.advanceDeduction),
        pitRate: Number(form.pitRate),
        notes: form.notes || undefined,
      });
      router.push(`/dashboard/guides/settlements/${(s as any).id}`);
    } finally { setSaving(false); }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Quyết toán mới
        </button>
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-3 gap-4">
          <div className="col-span-3"><label className="block text-sm font-medium text-gray-700 mb-1">Đoàn (tùy chọn)</label>
            <select value={form.tourId} onChange={(e) => setForm({ ...form, tourId: e.target.value })} className={inputCls}>
              <option value="">— Không gắn đoàn —</option>
              {tours.map((t: any) => <option key={t.id} value={t.id}>{t.code} — {t.title}</option>)}
            </select></div>
          {[
            ['days', 'Số ngày'], ['dailyRate', 'Phí/ngày (VND)'], ['tipAmount', 'Tiền tip (VND)'],
            ['otherIncome', 'Thu nhập khác (VND)'], ['advanceDeduction', 'Trừ tạm ứng (VND)'], ['pitRate', 'Thuế TNCN (%)'],
          ].map(([k, label]) => (
            <div key={k}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="number" min="0" value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={inputCls} /></div>
          ))}
          <div className="col-span-3"><label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
          <div className="col-span-3">
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {saving ? 'Đang tạo...' : 'Tạo quyết toán'}
            </button>
          </div>
        </form>
      )}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            {['Mã', 'Ngày tạo', 'Đoàn', 'Tổng thanh toán', 'Trạng thái', ''].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {settlements.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa có quyết toán</td></tr>}
            {settlements.map((s: any) => (
              <tr key={s.id} onClick={() => router.push(`/dashboard/guides/settlements/${s.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.code}</td>
                <td className="px-4 py-3">{fmtDate(s.createdAt)}</td>
                <td className="px-4 py-3 text-xs">{s.tour ? <span className="font-mono text-blue-700">{s.tour.code}</span> : '—'}</td>
                <td className="px-4 py-3 font-medium">{fmt(s.netPayable)} {s.currency}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{STT_STATUS[s.status]}</span></td>
                <td className="px-4 py-3 text-right text-blue-600 text-xs">Chi tiết →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
