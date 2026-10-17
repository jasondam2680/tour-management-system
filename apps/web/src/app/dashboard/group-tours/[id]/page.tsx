'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

function formatMoney(v: any, currency = 'USD') {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(v ?? 0))) + ' ' + currency;
}

const MEAL_LABEL: Record<string, string> = { B: '🍳 Sáng', L: '🍲 Trưa', D: '🍽️ Tối' };

export default function GroupTourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<any>(`/group-tours/templates/${id}`);
      setTemplate(data);
    } catch {
      router.push('/dashboard/group-tours');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!confirm('Xóa template này?')) return;
    try {
      await api.delete(`/group-tours/templates/${id}`);
      router.push('/dashboard/group-tours');
    } catch {
      /* ignore */
    }
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Đang tải...</div>;
  if (!template) return null;

  const days = template.currentVersion?.days || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard/group-tours')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2 block"
          >
            ← Danh sách templates
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {template.templateName || template.title}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm font-mono text-gray-400">{template.code}</span>
            <span className="text-sm text-gray-500">
              {template.duration}N{template.duration - 1}Đ
            </span>
            {template.packagePrice && (
              <span className="text-sm font-semibold text-blue-600">
                {formatMoney(template.packagePrice, template.packagePriceCurrency || 'USD')} / người
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/dashboard/group-tours/${id}/edit`}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium"
          >
            ✏️ Chỉnh sửa
          </Link>
          <button
            onClick={handleDelete}
            className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium"
          >
            🗑️ Xóa
          </button>
        </div>
      </div>

      {/* Overview */}
      {template.overview && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">📋 Tổng quan</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{template.overview}</p>
        </div>
      )}

      {/* Package Includes */}
      {template.packageIncludes && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">📦 Package Includes</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {template.packageIncludes.hotels?.length > 0 && (
              <div>
                <p className="font-medium text-gray-700">🏨 Khách sạn</p>
                <ul className="text-gray-500 list-disc list-inside">
                  {template.packageIncludes.hotels.map((h: string, i: number) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
            {template.packageIncludes.transport?.length > 0 && (
              <div>
                <p className="font-medium text-gray-700">🚌 Vận chuyển</p>
                <ul className="text-gray-500 list-disc list-inside">
                  {template.packageIncludes.transport.map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {template.packageIncludes.meals?.length > 0 && (
              <div>
                <p className="font-medium text-gray-700">🍽️ Bữa ăn</p>
                <p className="text-gray-500">
                  {template.packageIncludes.meals.map((m: string) => MEAL_LABEL[m] || m).join(', ')}
                </p>
              </div>
            )}
            {template.packageIncludes.guide && (
              <div>
                <p className="font-medium text-gray-700">🧭 HDV</p>
                <p className="text-gray-500">{template.packageIncludes.guide}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Itinerary */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-sm">
            🗺️ Chương trình ({days.length} ngày)
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {days.map((day: any) => (
            <div key={day.id} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-blue-600">Ngày {day.dayNumber}</span>
                {day.title && (
                  <span className="text-sm font-medium text-gray-700">— {day.title}</span>
                )}
                {day.meals?.length > 0 && (
                  <span className="text-xs text-gray-400 ml-2">
                    {day.meals.map((m: string) => MEAL_LABEL[m] || m).join(' · ')}
                  </span>
                )}
              </div>
              {day.description && <p className="text-sm text-gray-500 mb-2">{day.description}</p>}
              {day.accommodation && <p className="text-xs text-gray-400">🏨 {day.accommodation}</p>}
              {day.activities?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {day.activities.map((act: any) => (
                    <div key={act.id} className="flex items-start gap-2 text-sm">
                      {act.time && (
                        <span className="text-xs font-mono text-blue-500 w-12 flex-shrink-0">
                          {act.time}
                        </span>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">{act.title}</span>
                        {act.location && (
                          <span className="text-xs text-gray-400 ml-1">📍 {act.location}</span>
                        )}
                        {act.description && (
                          <p className="text-xs text-gray-400">{act.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">ℹ️ Thông tin</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Min Pax</span>
              <span className="font-medium">{template.minPax || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium">{template.duration} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created</span>
              <span className="font-medium">
                {new Date(template.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
