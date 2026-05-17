'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';

const CURRENCIES = ['USD', 'VND', 'EUR', 'CNY', 'THB', 'SGD', 'JPY'];
const MEALS = [
  { key: 'B', label: 'Sáng' },
  { key: 'L', label: 'Trưa' },
  { key: 'D', label: 'Tối' },
];

const activitySchema = z.object({
  time: z.string().default(''),
  title: z.string().min(1, 'Bắt buộc'),
  description: z.string().optional(),
  location: z.string().optional(),
  duration: z.coerce.number().min(0).optional(),
  sortOrder: z.coerce.number().default(0),
  notes: z.string().optional(),
});

const daySchema = z.object({
  dayNumber: z.coerce.number().min(1),
  title: z.string().default(''),
  description: z.string().optional(),
  meals: z.array(z.string()).default([]),
  accommodation: z.string().optional(),
  activities: z.array(activitySchema).default([]),
});

const schema = z.object({
  templateName: z.string().min(1, 'Bắt buộc'),
  title: z.string().min(1, 'Bắt buộc'),
  duration: z.coerce.number().min(1),
  minPax: z.coerce.number().min(1).default(2),
  packagePrice: z.coerce.number().min(0),
  packagePriceCurrency: z.string().default('USD'),
  overview: z.string().optional(),
  notes: z.string().optional(),
  packageIncludes: z
    .object({
      hotels: z.array(z.string()).default([]),
      transport: z.array(z.string()).default([]),
      meals: z.array(z.string()).default([]),
      guide: z.string().default(''),
      flights: z.array(z.string()).default([]),
    })
    .optional(),
  days: z.array(daySchema).default([]),
});

type FormData = z.infer<typeof schema>;
type DayData = z.infer<typeof daySchema>;
type ActivityData = z.infer<typeof activitySchema>;

const inputCls =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

export default function NewGroupTourPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'itinerary' | 'includes'>('info');

  const {
    register,
    control,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      minPax: 2,
      packagePriceCurrency: 'USD',
      packageIncludes: { hotels: [], transport: [], meals: [], guide: '', flights: [] },
      days: [],
    },
  });

  const {
    fields: dayFields,
    append: appendDay,
    remove: removeDay,
  } = useFieldArray({ control, name: 'days' });

  const watchedDays = watch('days');

  const addDay = () => {
    const num = dayFields.length + 1;
    appendDay({ dayNumber: num, title: `Day ${num}`, meals: [], activities: [] });
  };

  const addActivity = (dayIdx: number) => {
    const activities = watchedDays[dayIdx]?.activities || [];
    setValue(`days.${dayIdx}.activities`, [
      ...activities,
      { time: '', title: '', description: '', sortOrder: activities.length },
    ]);
  };

  const removeActivity = (dayIdx: number, actIdx: number) => {
    const activities = [...(watchedDays[dayIdx]?.activities || [])];
    activities.splice(actIdx, 1);
    setValue(`days.${dayIdx}.activities`, activities);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...data,
        overview: data.overview?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        packageIncludes: data.packageIncludes || undefined,
      };
      const result = await api.post<{ id: string }>('/group-tours/templates', payload);
      router.push(`/dashboard/group-tours/${(result as any).id}`);
    } catch (e) {
      const err = e as AxiosError<{ message: string }>;
      setError(err.response?.data?.message ?? 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-700 text-sm"
          >
            ← Back
          </button>
          <span className="text-slate-200">|</span>
          <h1 className="font-semibold text-slate-900 text-sm">New Group Tour Template</h1>
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-600 max-w-xs truncate">{error}</p>}
          <button
            onClick={handleSubmit(onSubmit as any)}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving...' : '💾 Save Template'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-6 flex gap-1 flex-shrink-0">
        {(['info', 'itinerary', 'includes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'info'
              ? '📝 Thông tin'
              : tab === 'itinerary'
                ? `🗺️ Itinerary (${dayFields.length} ngày)`
                : '📦 Package Includes'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-5">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('templateName')}
                    placeholder="VD: Vietnam Explorer 7D6N"
                    className={inputCls}
                  />
                  {errors.templateName && (
                    <p className="mt-1 text-xs text-red-600">{errors.templateName.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('title')}
                    placeholder="VD: Vietnam Explorer - 7 Days 6 Nights"
                    className={inputCls}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Duration (days) *</label>
                  <input {...register('duration')} type="number" min={1} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Min Pax</label>
                  <input {...register('minPax')} type="number" min={1} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Package Price</label>
                  <input
                    {...register('packagePrice')}
                    type="number"
                    min={0}
                    step={0.01}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select {...register('packagePriceCurrency')} className={inputCls}>
                    {CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Overview</label>
                <textarea
                  {...register('overview')}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="Mô tả tổng quan về tour..."
                />
              </div>
            </>
          )}

          {/* Itinerary Tab */}
          {activeTab === 'itinerary' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">{dayFields.length} ngày trong chương trình</p>
                <button
                  type="button"
                  onClick={addDay}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Thêm ngày
                </button>
              </div>

              {dayFields.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-2xl mb-2">🗺️</p>
                  <p className="font-medium">Chưa có ngày nào</p>
                  <p className="text-sm mt-1">Nhấn "Thêm ngày" để bắt đầu xây dựng itinerary</p>
                </div>
              )}

              {dayFields.map((field, dayIdx) => {
                const day = watchedDays[dayIdx];
                return (
                  <div
                    key={field.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📅</span>
                        <span className="text-sm font-semibold text-slate-700">
                          Ngày {day?.dayNumber || dayIdx + 1}
                        </span>
                        <input
                          {...register(`days.${dayIdx}.title`)}
                          placeholder="Tiêu đề ngày"
                          className="px-2 py-1 border border-slate-200 rounded text-xs w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addActivity(dayIdx)}
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                        >
                          + Activity
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDay(dayIdx)}
                          className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <label className={labelCls}>Mô tả</label>
                        <textarea
                          {...register(`days.${dayIdx}.description`)}
                          rows={2}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      {/* Meals */}
                      <div>
                        <label className={labelCls}>Bữa ăn</label>
                        <div className="flex gap-3">
                          {MEALS.map((m) => (
                            <label
                              key={m.key}
                              className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={(day?.meals || []).includes(m.key)}
                                onChange={(e) => {
                                  const meals = [...(day?.meals || [])];
                                  if (e.target.checked) meals.push(m.key);
                                  else {
                                    const idx = meals.indexOf(m.key);
                                    if (idx >= 0) meals.splice(idx, 1);
                                  }
                                  setValue(`days.${dayIdx}.meals`, meals);
                                }}
                                className="rounded"
                              />
                              {m.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Lưu trú</label>
                        <input
                          {...register(`days.${dayIdx}.accommodation`)}
                          placeholder="VD: Hanoi La Siesta Hotel"
                          className={inputCls}
                        />
                      </div>

                      {/* Activities */}
                      <div>
                        <label className={labelCls}>
                          Hoạt động ({(day?.activities || []).length})
                        </label>
                        <div className="space-y-2 mt-2">
                          {(day?.activities || []).map((act: ActivityData, actIdx: number) => (
                            <div
                              key={actIdx}
                              className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100"
                            >
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <input
                                  {...register(`days.${dayIdx}.activities.${actIdx}.time`)}
                                  placeholder="Giờ (VD: 08:00)"
                                  className={inputCls}
                                />
                                <input
                                  {...register(`days.${dayIdx}.activities.${actIdx}.title`)}
                                  placeholder="Tên hoạt động"
                                  className={inputCls}
                                />
                                <input
                                  {...register(`days.${dayIdx}.activities.${actIdx}.location`)}
                                  placeholder="Địa điểm"
                                  className={inputCls}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeActivity(dayIdx, actIdx)}
                                className="text-red-400 hover:text-red-600 text-lg"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Package Includes Tab */}
          {activeTab === 'includes' && (
            <>
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-slate-800 text-sm">🏨 Khách sạn bao gồm</h3>
                <textarea
                  {...register('packageIncludes.hotels')}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Mỗi dòng 1 khách sạn..."
                />
                <p className="text-xs text-slate-400">Gợi ý: Mỗi dòng 1 tên khách sạn</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-slate-800 text-sm">🚌 Vận chuyển bao gồm</h3>
                <textarea
                  {...register('packageIncludes.transport')}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Mỗi dòng 1 dịch vụ vận chuyển..."
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-slate-800 text-sm">🍽️ Bữa ăn bao gồm</h3>
                <div className="flex gap-3 flex-wrap">
                  {MEALS.map((m) => (
                    <label
                      key={m.key}
                      className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(watch('packageIncludes.meals') || []).includes(m.key)}
                        onChange={(e) => {
                          const meals = [...(watch('packageIncludes.meals') || [])];
                          if (e.target.checked) meals.push(m.key);
                          else {
                            const idx = meals.indexOf(m.key);
                            if (idx >= 0) meals.splice(idx, 1);
                          }
                          setValue('packageIncludes.meals', meals);
                        }}
                        className="rounded"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-slate-800 text-sm">🧭 HDV</h3>
                <input
                  {...register('packageIncludes.guide')}
                  placeholder="VD: HDV tiếng Việt suốt tuyến"
                  className={inputCls}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
