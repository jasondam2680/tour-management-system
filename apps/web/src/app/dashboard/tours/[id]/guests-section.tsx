'use client';

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  arrangementsApi, TourGuest, ImportResult,
} from '@/lib/api/arrangements';

function fmtDate(v?: string) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
}

const EMPTY_FORM = {
  fullName: '', gender: '', nationality: '', passportNo: '',
  birthDate: '', birthPlace: '', issueDate: '', issuePlace: '',
  expiryDate: '', issueAuthority: '', roomType: '', phone: '', notes: '',
};

const TEMPLATE_HEADERS = [
  'Họ tên', 'Số hộ chiếu', 'Giới tính', 'Quốc tịch', 'Ngày sinh', 'Nơi sinh',
  'Ngày cấp', 'Nơi cấp', 'Hiệu lực', 'Cơ quan cấp', 'SĐT', 'Loại phòng',
];

export default function GuestsSection({ tourId }: { tourId: string }) {
  const [guests, setGuests] = useState<TourGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TourGuest | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try { setGuests(await arrangementsApi.listGuests(tourId)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tourId]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }
  function openEdit(g: TourGuest) {
    setEditing(g);
    setForm({
      fullName: g.fullName ?? '',
      gender: g.gender ?? '',
      nationality: g.nationality ?? '',
      passportNo: g.passportNo ?? '',
      birthDate: g.birthDate ? g.birthDate.slice(0, 10) : '',
      birthPlace: g.birthPlace ?? '',
      issueDate: g.issueDate ? g.issueDate.slice(0, 10) : '',
      issuePlace: g.issuePlace ?? '',
      expiryDate: g.expiryDate ? g.expiryDate.slice(0, 10) : '',
      issueAuthority: g.issueAuthority ?? '',
      roomType: g.roomType ?? '',
      phone: g.phone ?? '',
      notes: g.notes ?? '',
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.fullName.trim()) return;
    setSaving(true);
    try {
      if (editing) await arrangementsApi.updateGuest(editing.id, form);
      else await arrangementsApi.createGuest(tourId, form);
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ['Nguyễn Văn A', 'B1234567', 'Nam', 'Việt Nam', '01/01/1990', 'TP.HCM',
       '01/01/2020', 'TP.HCM', '01/01/2030', 'Cục QLXNC', '0901234567', 'TWIN'],
    ]);
    ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachKhach');
    XLSX.writeFile(wb, 'mau-danh-sach-khach.xlsx');
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await arrangementsApi.importGuests(tourId, file);
      setImportResult(res);
      await load();
    } catch (err: any) {
      setImportResult({
        total: 0, created: 0, updated: 0, skipped: 0,
        errors: [{ row: 0, reason: err?.response?.data?.message || err?.message || 'Import thất bại' }],
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const set = (k: string) => ({
    value: (form as any)[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: e.target.value }),
    className: 'mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm',
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-semibold text-gray-800">👥 Danh sách khách ({guests.length})</h2>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={handleFile} />
          <button onClick={downloadTemplate}
            className="text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg">
            ⬇ Tải mẫu Excel
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="text-xs border border-emerald-300 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg font-medium disabled:opacity-60">
            {importing ? 'Đang import...' : '⬆ Import Excel'}
          </button>
          <button onClick={openAdd}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium">
            + Thêm khách
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${
          importResult.errors.length ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
        }`}>
          Import: {importResult.created} thêm mới · {importResult.updated} cập nhật ·
          {importResult.skipped} bỏ qua / {importResult.total} dòng
          {importResult.errors.slice(0, 5).map((e, i) => (
            <div key={i}>• Dòng {e.row}: {e.reason}</div>
          ))}
        </div>
      )}

      {loading ? <p className="text-sm text-gray-400">Đang tải...</p>
      : !guests.length ? (
        <p className="text-sm text-gray-400 text-center py-4">Chưa có khách nào</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-2 font-medium">Họ tên</th>
                <th className="py-2 pr-2 font-medium">Số HC</th>
                <th className="py-2 pr-2 font-medium">GT</th>
                <th className="py-2 pr-2 font-medium">Quốc tịch</th>
                <th className="py-2 pr-2 font-medium">Ngày sinh</th>
                <th className="py-2 pr-2 font-medium">Ngày cấp</th>
                <th className="py-2 pr-2 font-medium">Hiệu lực</th>
                <th className="py-2 pr-2 font-medium">SĐT</th>
                <th className="py-2 pr-2 font-medium">Phòng</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g, i) => (
                <tr key={g.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-2 pr-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 pr-2 font-medium text-gray-900">{g.fullName}</td>
                  <td className="py-2 pr-2 font-mono text-xs">{g.passportNo || '—'}</td>
                  <td className="py-2 pr-2">{g.gender || '—'}</td>
                  <td className="py-2 pr-2">{g.nationality || '—'}</td>
                  <td className="py-2 pr-2">{fmtDate(g.birthDate)}</td>
                  <td className="py-2 pr-2">{fmtDate(g.issueDate)}</td>
                  <td className="py-2 pr-2">{fmtDate(g.expiryDate)}</td>
                  <td className="py-2 pr-2">{g.phone || '—'}</td>
                  <td className="py-2 pr-2">{g.roomType || '—'}</td>
                  <td className="py-2 whitespace-nowrap">
                    <button onClick={() => openEdit(g)}
                      className="text-xs text-gray-500 hover:text-gray-800 mr-2">Sửa</button>
                    <button onClick={async () => {
                      if (confirm(`Xoá khách ${g.fullName}?`)) {
                        await arrangementsApi.removeGuest(g.id); await load();
                      }
                    }} className="text-xs text-red-400 hover:text-red-600">Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 text-lg">
              {editing ? 'Sửa thông tin khách' : 'Thêm khách'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="text-sm col-span-2 md:col-span-1">Họ tên *
                <input {...set('fullName')} /></label>
              <label className="text-sm">Số hộ chiếu
                <input {...set('passportNo')} /></label>
              <label className="text-sm">Giới tính
                <input {...set('gender')} placeholder="Nam/Nữ" /></label>
              <label className="text-sm">Quốc tịch
                <input {...set('nationality')} /></label>
              <label className="text-sm">Ngày sinh
                <input type="date" {...set('birthDate')} /></label>
              <label className="text-sm">Nơi sinh
                <input {...set('birthPlace')} /></label>
              <label className="text-sm">Ngày cấp
                <input type="date" {...set('issueDate')} /></label>
              <label className="text-sm">Nơi cấp
                <input {...set('issuePlace')} /></label>
              <label className="text-sm">Hiệu lực
                <input type="date" {...set('expiryDate')} /></label>
              <label className="text-sm">Cơ quan cấp
                <input {...set('issueAuthority')} /></label>
              <label className="text-sm">SĐT
                <input {...set('phone')} /></label>
              <label className="text-sm">Loại phòng
                <input {...set('roomType')} placeholder="TWIN/SINGLE" /></label>
              <label className="text-sm col-span-2 md:col-span-3">Ghi chú
                <input {...set('notes')} /></label>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">Đóng</button>
              <button onClick={handleSave} disabled={saving || !form.fullName.trim()}
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
