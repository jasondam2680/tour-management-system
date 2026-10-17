'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { guidesApi, Guide } from '@/lib/api/guides';

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động' };

export default function GuidesPage() {
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await guidesApi.getAll({
        limit: 200,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setGuides((result as any)?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: any) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('vi-VN'));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hướng dẫn viên</h1>
          <p className="text-sm text-gray-500 mt-1">{guides.length} HDV trong danh sách</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/guides/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Thêm HDV
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Tìm tên, mã, SĐT, số thẻ HDV..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng hoạt động</option>
        </select>
        <button onClick={load} className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">
          Tìm
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : guides.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Chưa có HDV nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Mã', 'Họ tên', 'SĐT', 'Thẻ HDV', 'Ngôn ngữ', 'Giá/ngày', 'Trạng thái'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guides.map((g) => (
                <tr
                  key={g.id}
                  onClick={() => router.push(`/dashboard/guides/${g.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-700">{g.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{g.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{g.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{g.licenseNo || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{g.languages?.join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(g.defaultDailyRate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        g.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {STATUS_LABEL[g.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
