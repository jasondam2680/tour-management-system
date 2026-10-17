'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { suppliersApi } from '@/lib/api/suppliers';

const CATEGORIES = [
  {value:'HOTEL',      label:'🏨 Khách sạn',          group:'Lưu trú'},
  {value:'RESORT',     label:'🏖️ Resort',              group:'Lưu trú'},
  {value:'TRANSPORT',  label:'🚌 Giao thông (xe)',      group:'Giao thông'},
  {value:'BOAT',       label:'⛵ Tàu / Thuyền',        group:'Giao thông'},
  {value:'RESTAURANT', label:'🍽️ Nhà hàng / Ăn uống', group:'Ăn uống'},
  {value:'GUIDE',      label:'🧭 Hướng dẫn viên',      group:'HDV & Vé'},
  {value:'ATTRACTION', label:'🎡 Điểm tham quan',      group:'HDV & Vé'},
  {value:'VISA',       label:'📄 Visa',                group:'Visa & Khác'},
  {value:'INSURANCE',  label:'🛡️ Bảo hiểm',            group:'Visa & Khác'},
  {value:'OTHER',      label:'📦 Khác',                group:'Visa & Khác'},
];

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm] = useState({
    category:'HOTEL', name:'', contactPerson:'', email:'', phone:'',
    address:'', city:'', country:'Vietnam', website:'', taxCode:'',
    currency:'VND', paymentTerms:'', bankName:'', bankAccount:'',
    rating:3, isPreferred:false, notes:'',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) {
    const {name,value,type} = e.target;
    setForm((f) => ({
      ...f,
      [name]: type==='checkbox' ? (e.target as HTMLInputElement).checked
             : type==='number' ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.category) { setError('Vui lòng điền tên và loại nhà cung cấp'); return; }
    setLoading(true); setError('');
    try {
      const supplier = await suppliersApi.create(form);
      router.push(`/dashboard/suppliers/${(supplier as any).id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← Quay lại</button>
        <h1 className="text-2xl font-bold text-gray-900">Thêm nhà cung cấp mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Thông tin cơ bản</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại NCC <span className="text-red-500">*</span></label>
            <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label} — {c.group}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên NCC <span className="text-red-500">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="VD: Khách sạn Caravelle" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
              <input name="contactPerson" value={form.contactPerson} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input name="website" value={form.website} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Địa chỉ</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input name="address" value={form.address} onChange={handleChange} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
              <input name="city" value={form.city} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
              <input name="country" value={form.country} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Thanh toán</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tệ</label>
              <select name="currency" value={form.currency} onChange={handleChange} className={inputCls}>
                {['VND','USD','EUR','THB','CNY','SGD'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điều khoản TT</label>
              <input name="paymentTerms" value={form.paymentTerms} onChange={handleChange} placeholder="VD: 30 ngày, Đặt cọc 50%" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
              <input name="bankName" value={form.bankName} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
              <input name="bankAccount" value={form.bankAccount} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Đánh giá & Ghi chú</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((star) => (
                <button type="button" key={star} onClick={() => setForm((f) => ({...f,rating:star}))}
                  className={`text-2xl transition-colors ${star<=form.rating?'text-yellow-400':'text-gray-200 hover:text-yellow-200'}`}>★</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="isPreferred" checked={form.isPreferred} onChange={handleChange} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium text-gray-700">⭐ Đánh dấu là NCC ưu tiên</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú nội bộ</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={inputCls} />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Huỷ</button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
            {loading ? 'Đang lưu...' : 'Tạo nhà cung cấp'}
          </button>
        </div>
      </form>
    </div>
  );
}
