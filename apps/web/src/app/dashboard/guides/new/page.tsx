'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { guidesApi } from '@/lib/api/guides';

export default function NewGuidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '', phone: '', idCard: '', licenseNo: '', languages: '',
    bankName: '', bankAccount: '', accountName: '', defaultDailyRate: '', notes: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Vui lòng nhập họ tên HDV'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        defaultDailyRate: form.defaultDailyRate === '' ? undefined : Number(form.defaultDailyRate),
      };
      const guide = await guidesApi.create(payload);
      router.push(`/dashboard/guides/${(guide as any).id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← Quay lại</button>
        <h1 className="text-2xl font-bold text-gray-900">Thêm hướng dẫn viên</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Thông tin cá nhân</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
              <input name="fullName" value={form.fullName} onChange={handleChange} className={inputCls} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CMND / CCCD</label>
              <input name="idCard" value={form.idCard} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số thẻ HDV</label>
              <input name="licenseNo" value={form.licenseNo} onChange={handleChange} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ (cách nhau bằng dấu phẩy)</label>
              <input name="languages" value={form.languages} onChange={handleChange} className={inputCls} placeholder="中文, Tiếng Việt, English" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Tài khoản ngân hàng & giá</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
              <input name="bankName" value={form.bankName} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
              <input name="bankAccount" value={form.bankAccount} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chủ tài khoản</label>
              <input name="accountName" value={form.accountName} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá mặc định / ngày (VND)</label>
              <input name="defaultDailyRate" type="number" min="0" value={form.defaultDailyRate} onChange={handleChange} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={inputCls} />
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium"
        >
          {loading ? 'Đang lưu...' : 'Lưu hồ sơ HDV'}
        </button>
      </form>
    </div>
  );
}
