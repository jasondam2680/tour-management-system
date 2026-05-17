'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

function formatMoney(v: any, currency = 'USD') {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(v ?? 0))) + ' ' + currency;
}

export default function GroupToursPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/group-tours/templates', {
        search,
        page,
        limit: 20,
        isActive: true,
      });
      setTemplates(res?.data ?? []);
      setMeta(res?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Xóa template này?')) return;
    try {
      await api.delete(`/group-tours/templates/${id}`);
      load();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Tour Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các template tour nhóm để báo giá nhanh
          </p>
        </div>
        <Link
          href="/dashboard/group-tours/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          + New Template
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="🔍 Tìm theo tên, code..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Code</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Template Name</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-600">Duration</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-600">Min Pax</th>
              <th className="text-right px-5 py-3 font-semibold text-gray-600">Package Price</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-600">Days</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && templates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                  <p className="text-2xl mb-2">🗺️</p>
                  <p className="font-medium">Chưa có template nào</p>
                  <p className="text-sm mt-1">Tạo Group Tour Template đầu tiên để bắt đầu</p>
                </td>
              </tr>
            )}
            {templates.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{t.code}</td>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{t.templateName || t.title}</p>
                  <p className="text-xs text-gray-400 truncate max-w-xs">
                    {t.currentVersion?.overview || '—'}
                  </p>
                </td>
                <td className="px-5 py-3 text-center">
                  {t.duration || '—'}N{t.duration ? t.duration - 1 : '—'}Đ
                </td>
                <td className="px-5 py-3 text-center">{t.minPax || '—'}</td>
                <td className="px-5 py-3 text-right font-semibold text-blue-600">
                  {t.packagePrice
                    ? formatMoney(t.packagePrice, t.packagePriceCurrency || 'USD')
                    : '—'}
                </td>
                <td className="px-5 py-3 text-center">
                  {t.currentVersion?._count?.days || t.currentVersion?.days?.length || '—'}
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/dashboard/group-tours/${t.id}`}
                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/group-tours/${t.id}/edit`}
                      className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {meta.total} templates · Page {meta.page}/{meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              Prev
            </button>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
