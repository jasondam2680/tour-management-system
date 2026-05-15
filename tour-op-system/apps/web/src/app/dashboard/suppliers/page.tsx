'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { suppliersApi } from '@/lib/api/suppliers';
import { Supplier, SupplierCategory } from '@/types';

interface SupplierGroup {
  key: string; label: string; icon: string; color: string; bg: string;
  categories: SupplierCategory[]; description: string;
}

const GROUPS: SupplierGroup[] = [
  {key:'accommodation', label:'Lưu trú',   icon:'🏨', color:'text-blue-700',   bg:'bg-blue-50 border-blue-200',   categories:['HOTEL','RESORT'],              description:'Khách sạn, Resort, Homestay'},
  {key:'transport',     label:'Giao thông', icon:'🚌', color:'text-orange-700', bg:'bg-orange-50 border-orange-200', categories:['TRANSPORT','BOAT'],           description:'Xe, Tàu, Thuyền, Cano'},
  {key:'food',          label:'Ăn uống',   icon:'🍽️', color:'text-green-700',  bg:'bg-green-50 border-green-200',  categories:['RESTAURANT'],                 description:'Nhà hàng, Quán ăn, Café'},
  {key:'guide',         label:'HDV & Vé',  icon:'🧭', color:'text-purple-700', bg:'bg-purple-50 border-purple-200', categories:['GUIDE','ATTRACTION'],        description:'Hướng dẫn viên, Vé tham quan'},
  {key:'other',         label:'Visa & Khác',icon:'📋', color:'text-gray-700',  bg:'bg-gray-50 border-gray-200',    categories:['VISA','INSURANCE','OTHER'],   description:'Visa, Bảo hiểm, Dịch vụ khác'},
];

const CAT_ICON: Record<string,string> = {
  HOTEL:'🏨', RESORT:'🏖️', RESTAURANT:'🍽️', TRANSPORT:'🚌',
  BOAT:'⛵', GUIDE:'🧭', ATTRACTION:'🎡', VISA:'📄', INSURANCE:'🛡️', OTHER:'📦',
};

export default function SuppliersPage() {
  const router = useRouter();
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [activeCat, setActiveCat]       = useState<SupplierCategory|''>('');
  const [stats, setStats]               = useState<{total:number;preferred:number}|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, statsResult] = await Promise.all([
        suppliersApi.getAll({limit:200, search:search||undefined}),
        suppliersApi.getStats(),
      ]);
      setAllSuppliers((result as any)?.data ?? []);
      setStats(statsResult as any);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function getSuppliersForGroup(group: SupplierGroup): Supplier[] {
    return allSuppliers.filter((s) => {
      const inGroup = group.categories.includes(s.category);
      const matchCat = activeCat ? s.category === activeCat : true;
      return inGroup && matchCat;
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhà cung cấp</h1>
          <p className="text-sm text-gray-500 mt-1">{stats?.total??'—'} NCC · {stats?.preferred??'—'} ưu tiên</p>
        </div>
        <button onClick={() => router.push('/dashboard/suppliers/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Thêm NCC
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key==='Enter'&&load()}
          placeholder="Tìm tên, mã, liên hệ..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={load} className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Tìm</button>
        {activeCat && (
          <button onClick={() => setActiveCat('')} className="border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">✕ Bỏ lọc</button>
        )}
      </div>

      <div className="space-y-5">
        {GROUPS.map((group) => {
          const suppliers = getSuppliersForGroup(group);
          return (
            <div key={group.key} className={`rounded-xl border ${group.bg} overflow-hidden`}>
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <div>
                    <h3 className={`font-semibold text-base ${group.color}`}>{group.label}</h3>
                    <p className="text-xs text-gray-500">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">{suppliers.length} NCC</span>
                  <div className="flex gap-1">
                    {group.categories.map((c) => (
                      <button key={c}
                        onClick={(e) => { e.stopPropagation(); setActiveCat(activeCat===c?'':c); }}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          activeCat===c ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        }`}>
                        {CAT_ICON[c]} {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white border-t border-gray-200">
                {loading ? <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>
                : suppliers.length === 0 ? <div className="py-8 text-center text-gray-400 text-sm">Chưa có NCC nào</div>
                : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50">
                      {['Tên','Liên hệ','Địa điểm','Đánh giá','Trạng thái','Dịch vụ'].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {suppliers.map((s) => (
                        <tr key={s.id} onClick={() => router.push(`/dashboard/suppliers/${s.id}`)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{CAT_ICON[s.category]}</span>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                                <p className="text-xs text-gray-400 font-mono">{s.code}</p>
                              </div>
                              {s.isPreferred && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">⭐ Ưu tiên</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{s.contactPerson??'—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{[s.city,s.country].filter(Boolean).join(', ')||'—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-yellow-400">{'★'.repeat(s.rating)}</span>
                            <span className="text-gray-200">{'★'.repeat(5-s.rating)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                              {s.isActive?'Hoạt động':'Ngừng'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{(s._count?.resources??0)} dịch vụ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
