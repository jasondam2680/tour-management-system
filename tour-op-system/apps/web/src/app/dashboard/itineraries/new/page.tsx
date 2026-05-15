'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { itinerariesApi } from '@/lib/api/itineraries';

interface Activity {
  sortOrder: number;
  time: string;
  title: string;
  description: string;
  location: string;
  duration: number | '';
  notes: string;
}

interface Day {
  dayNumber: number;
  title: string;
  description: string;
  meals: string[];
  accommodation: string;
  activities: Activity[];
}

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner'];

export default function NewItineraryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [notes, setNotes] = useState('');
  const [days, setDays] = useState<Day[]>([]);

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  function addDay() {
    setDays((prev) => [
      ...prev,
      {
        dayNumber: prev.length + 1,
        title: '',
        description: '',
        meals: [],
        accommodation: '',
        activities: [],
      },
    ]);
  }

  function removeDay(index: number) {
    setDays((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((d, i) => ({ ...d, dayNumber: i + 1 })),
    );
  }

  function updateDay(index: number, field: keyof Day, value: any) {
    setDays((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function toggleMeal(index: number, meal: string) {
    setDays((prev) => {
      const copy = [...prev];
      const meals = copy[index].meals;
      copy[index] = {
        ...copy[index],
        meals: meals.includes(meal)
          ? meals.filter((m) => m !== meal)
          : [...meals, meal],
      };
      return copy;
    });
  }

  function addActivity(dayIndex: number) {
    setDays((prev) => {
      const copy = [...prev];
      const day = copy[dayIndex];
      copy[dayIndex] = {
        ...day,
        activities: [
          ...day.activities,
          {
            sortOrder: day.activities.length,
            time: '',
            title: '',
            description: '',
            location: '',
            duration: '',
            notes: '',
          },
        ],
      };
      return copy;
    });
  }

  function removeActivity(dayIndex: number, actIndex: number) {
    setDays((prev) => {
      const copy = [...prev];
      const day = copy[dayIndex];
      copy[dayIndex] = {
        ...day,
        activities: day.activities
          .filter((_, i) => i !== actIndex)
          .map((a, i) => ({ ...a, sortOrder: i })),
      };
      return copy;
    });
  }

  function updateActivity(
    dayIndex: number,
    actIndex: number,
    field: keyof Activity,
    value: any,
  ) {
    setDays((prev) => {
      const copy = [...prev];
      const day = copy[dayIndex];
      copy[dayIndex] = {
        ...day,
        activities: day.activities.map((a, i) =>
          i === actIndex ? { ...a, [field]: value } : a,
        ),
      };
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề itinerary');
      return;
    }

    if (days.length === 0) {
      setError('Vui lòng thêm ít nhất 1 ngày');
      return;
    }

    for (const day of days) {
      if (!day.activities.length) {
        setError(`Ngày ${day.dayNumber} cần ít nhất 1 hoạt động`);
        return;
      }
      for (const act of day.activities) {
        if (!act.title.trim()) {
          setError(`Ngày ${day.dayNumber}: Hoạt động không được để trống tên`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      await itinerariesApi.create({
        title: title.trim(),
        overview: overview.trim() || undefined,
        notes: notes.trim() || undefined,
        days: days.map((d) => ({
          dayNumber: d.dayNumber,
          title: d.title.trim() || undefined,
          description: d.description.trim() || undefined,
          meals: d.meals.length ? d.meals : undefined,
          accommodation: d.accommodation.trim() || undefined,
          activities: d.activities.map((a) => ({
            sortOrder: a.sortOrder,
            time: a.time || undefined,
            title: a.title.trim(),
            description: a.description.trim() || undefined,
            location: a.location.trim() || undefined,
            duration: a.duration ? Number(a.duration) : undefined,
            notes: a.notes.trim() || undefined,
          })),
        })),
      });
      router.push('/dashboard/itineraries');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Có lỗi xảy ra, thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tạo Itinerary mới</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tạo lịch trình với các ngày và hoạt động
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Thông tin cơ bản</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Vietnam Heritage Tour 7N6Đ"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tổng quan
            </label>
            <textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Mô tả ngắn gọn về lịch trình..."
              rows={3}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú nội bộ..."
              rows={2}
              className={inputCls}
            />
          </div>
        </div>

        {/* Days */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Lịch trình chi tiết ({days.length} ngày)
            </h2>
            <button
              type="button"
              onClick={addDay}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Thêm ngày
            </button>
          </div>

          {days.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-400 text-lg">Chưa có ngày nào</p>
              <p className="text-sm text-gray-400 mt-1">
                Nhấn "Thêm ngày" để bắt đầu tạo lịch trình
              </p>
            </div>
          )}

          {days.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">
                  Ngày {day.dayNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => removeDay(dayIndex)}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  Xóa ngày
                </button>
              </div>

              {/* Day Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề ngày
                  </label>
                  <input
                    value={day.title}
                    onChange={(e) =>
                      updateDay(dayIndex, 'title', e.target.value)
                    }
                    placeholder="VD: Khám phá Hà Nội"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nơi lưu trú
                  </label>
                  <input
                    value={day.accommodation}
                    onChange={(e) =>
                      updateDay(dayIndex, 'accommodation', e.target.value)
                    }
                    placeholder="VD: Hanoi La Siesta Hotel"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={day.description}
                  onChange={(e) =>
                    updateDay(dayIndex, 'description', e.target.value)
                  }
                  placeholder="Mô tả hoạt động trong ngày..."
                  rows={2}
                  className={inputCls}
                />
              </div>

              {/* Meals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bữa ăn
                </label>
                <div className="flex gap-4">
                  {MEAL_OPTIONS.map((meal) => (
                    <label
                      key={meal}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={day.meals.includes(meal)}
                        onChange={() => toggleMeal(dayIndex, meal)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{meal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Hoạt động ({day.activities.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => addActivity(dayIndex)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    + Thêm hoạt động
                  </button>
                </div>

                {day.activities.map((act, actIndex) => (
                  <div
                    key={actIndex}
                    className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        Hoạt động {actIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeActivity(dayIndex, actIndex)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Xóa
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Giờ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={act.time}
                          onChange={(e) =>
                            updateActivity(
                              dayIndex,
                              actIndex,
                              'time',
                              e.target.value,
                            )
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tên hoạt động <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={act.title}
                          onChange={(e) =>
                            updateActivity(
                              dayIndex,
                              actIndex,
                              'title',
                              e.target.value,
                            )
                          }
                          placeholder="VD: Tham quan Văn Miếu"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Địa điểm
                        </label>
                        <input
                          value={act.location}
                          onChange={(e) =>
                            updateActivity(
                              dayIndex,
                              actIndex,
                              'location',
                              e.target.value,
                            )
                          }
                          placeholder="VD: Văn Miếu Quốc Tử Giám"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Thời lượng (phút)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={act.duration}
                          onChange={(e) =>
                            updateActivity(
                              dayIndex,
                              actIndex,
                              'duration',
                              e.target.value ? Number(e.target.value) : '',
                            )
                          }
                          placeholder="VD: 60"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Mô tả
                      </label>
                      <textarea
                        value={act.description}
                        onChange={(e) =>
                          updateActivity(
                            dayIndex,
                            actIndex,
                            'description',
                            e.target.value,
                          )
                        }
                        placeholder="Chi tiết hoạt động..."
                        rows={2}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Ghi chú
                      </label>
                      <input
                        value={act.notes}
                        onChange={(e) =>
                          updateActivity(
                            dayIndex,
                            actIndex,
                            'notes',
                            e.target.value,
                          )
                        }
                        placeholder="Ghi chú thêm..."
                        className={inputCls}
                      />
                    </div>
                  </div>
                ))}

                {day.activities.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Chưa có hoạt động nào
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Đang tạo...' : 'Tạo Itinerary'}
          </button>
        </div>
      </form>
    </div>
  );
}
