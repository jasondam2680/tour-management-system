'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { Currency } from '@/types';
import { AxiosError } from 'axios';

const toNum = (v: any) => Number(v ?? 0);
function formatCurrency(v: number, currency = 'USD') {
  return new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' ' + currency;
}

interface SupplierOption {
  id: string;
  name: string;
  rating: number;
}
interface ResourceOption {
  id: string;
  name: string;
  basePrice: number;
  currency: string;
  unit: string;
}
interface CustomerResult {
  id: string;
  code: string;
  type: 'B2B' | 'B2C';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  city?: string;
  isVip: boolean;
}

const itemSchema = z.object({
  day: z.coerce.number().optional(),
  category: z.string().min(1),
  name: z.string().default(''),
  quantity: z.coerce.number().min(0).default(1),
  unit: z.string().default('per_person'),
  sellingPrice: z.coerce.number().min(0).default(0),
  buyingPrice: z.coerce.number().min(0).default(0),
  currency: z.string().default('USD'),
  isOptional: z.boolean().default(false),
  isIncluded: z.boolean().default(true),
  description: z.string().optional(),
  notes: z.string().optional(),
  resourceId: z.string().optional(),
  supplierId: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  numRooms: z.coerce.number().min(1).optional(),
  serviceDate: z.string().optional(),
  numDays: z.coerce.number().min(1).optional(),
  tipsPerPerson: z.coerce.number().min(0).optional(),
  buyTipsPerPerson: z.coerce.number().min(0).optional(),
});

const schema = z.object({
  title: z.string().min(1, 'Bắt buộc'),
  customerId: z.string().min(1, 'Bắt buộc'),
  leadId: z.string().optional(),
  pax: z.coerce.number().min(1).default(2),
  paxAdult: z.coerce.number().min(0).optional(),
  paxChild: z.coerce.number().min(0).optional(),
  travelDateFrom: z.string().optional(),
  travelDateTo: z.string().optional(),
  destination: z.string().optional(),
  duration: z.coerce.number().min(1).optional(),
  tourQuotationType: z.enum(['GROUP', 'PRIVATE', '']).optional(),
  groupTourTemplateId: z.string().optional(),
  discountPct: z.coerce.number().min(0).max(100).default(0),
  taxPct: z.coerce.number().min(0).max(100).default(0),
  currency: z.string().default('USD'),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(itemSchema).default([]),
});

type FormData = z.infer<typeof schema>;
type ItemData = z.infer<typeof itemSchema>;

const CATEGORIES = [
  { key: 'hotel', icon: '🏨', label: 'Khách sạn' },
  { key: 'resort', icon: '🏖️', label: 'Resort' },
  { key: 'transport', icon: '🚌', label: 'Xe/Tàu' },
  { key: 'boat', icon: '⛵', label: 'Thuyền' },
  { key: 'restaurant', icon: '🍽️', label: 'Ăn uống' },
  { key: 'guide', icon: '🧭', label: 'HDV' },
  { key: 'attraction', icon: '🎡', label: 'Vé tham quan' },
  { key: 'visa', icon: '📄', label: 'Visa' },
  { key: 'insurance', icon: '🛡️', label: 'Bảo hiểm' },
  { key: 'other', icon: '📦', label: 'Khác' },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
const CURRENCIES: Currency[] = ['USD', 'VND', 'EUR', 'CNY', 'THB', 'SGD', 'JPY'];

function getNights(ci?: string, co?: string) {
  if (!ci || !co) return 1;
  return Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000));
}

function calcTotals(items: ItemData[], discountPct: number, taxPct: number) {
  let subtotal = 0,
    totalCost = 0;
  for (const item of items) {
    if (!item.isIncluded) continue;
    subtotal += toNum(item.sellingPrice) * toNum(item.quantity);
    totalCost += toNum(item.buyingPrice) * toNum(item.quantity);
  }
  const discountAmt = (subtotal * discountPct) / 100;
  const afterDisc = subtotal - discountAmt;
  const taxAmt = (afterDisc * taxPct) / 100;
  const total = afterDisc + taxAmt;
  const profit = total - totalCost;
  const margin = total > 0 ? (profit / total) * 100 : 0;
  return { subtotal, totalCost, discountAmt, taxAmt, total, profit, margin };
}

function transformItem(item: ItemData, pax: number) {
  const {
    supplierId,
    checkIn,
    checkOut,
    numRooms,
    serviceDate,
    numDays,
    tipsPerPerson,
    buyTipsPerPerson,
    ...base
  } = item;
  const cat = item.category;
  if (cat === 'hotel' || cat === 'resort') {
    const nights = getNights(checkIn, checkOut);
    const rooms = numRooms ?? 1;
    return {
      ...base,
      quantity: rooms * nights,
      unit: 'per_room',
      description: checkIn
        ? `Check-in: ${checkIn} | Check-out: ${checkOut} | ${rooms} phòng × ${nights} đêm`
        : item.description,
    };
  }
  if (cat === 'guide') {
    const days = numDays ?? toNum(item.quantity);
    return {
      ...base,
      quantity: days,
      unit: 'per_day',
      notes:
        (tipsPerPerson ?? 0) > 0
          ? `Tips: ${tipsPerPerson} sell / ${buyTipsPerPerson} buy × ${pax} khách`
          : item.notes,
    };
  }
  return {
    ...base,
    description: item.description || (serviceDate ? `Ngày: ${serviceDate}` : undefined),
  };
}

const inputCls = `w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`;
const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

function CustomerSearch({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (id: string, c: CustomerResult | null) => void;
  error?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CustomerResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<any>('/customers', { search: query, limit: 8 });
        setResults((res as any)?.data ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const displayName = (c: CustomerResult) =>
    c.type === 'B2B'
      ? (c.companyName ?? '—')
      : [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';

  function handleSelect(c: CustomerResult) {
    setSelected(c);
    setQuery('');
    setOpen(false);
    onChange(c.id, c);
  }
  function handleClear() {
    setSelected(null);
    setQuery('');
    onChange('', null);
  }

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        <div className="flex items-center justify-between px-3 py-2.5 border border-blue-400 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-bold ${selected.type === 'B2B' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}
            >
              {selected.type}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {displayName(selected)}
                {selected.isVip && ' ⭐'}
              </p>
              <p className="text-xs text-slate-400">
                {selected.code}
                {selected.email && ` · ${selected.email}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-red-500 text-lg ml-3"
          >
            ×
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          placeholder="🔍 Tìm tên, công ty, email..."
          className={`${inputCls} ${error ? 'border-red-400' : ''}`}
        />
      )}
      {open && results.length > 0 && !selected && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 flex items-center gap-3"
            >
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${c.type === 'B2B' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}
              >
                {c.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {displayName(c)}
                  {c.isVip && ' ⭐'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {c.code}
                  {c.email && ` · ${c.email}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SmartItemRow({
  idx,
  register,
  watch,
  setValue,
  remove,
  pax,
  quotationCurrency,
}: {
  idx: number;
  register: any;
  watch: any;
  setValue: any;
  remove: () => void;
  pax: number;
  quotationCurrency: string;
}) {
  const item = watch(`items.${idx}`) as ItemData;
  const cat = item?.category ?? '';
  const icon = CAT_MAP[cat]?.icon ?? '📦';
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [resources, setResources] = useState<ResourceOption[]>([]);

  useEffect(() => {
    if (!cat) return;
    api
      .get<any>('/suppliers', { category: cat.toUpperCase(), limit: 100, isActive: true })
      .then((res: any) => setSuppliers(res?.data ?? []))
      .catch(() => {});
  }, [cat]);

  const supplierId = item?.supplierId;
  useEffect(() => {
    if (!supplierId) {
      setResources([]);
      return;
    }
    api
      .get<any>(`/suppliers/${supplierId}`)
      .then((res: any) => setResources(res?.resources ?? []))
      .catch(() => {});
  }, [supplierId]);

  function handleResourceChange(resourceId: string) {
    const res = resources.find((r) => r.id === resourceId);
    if (!res) return;
    setValue(`items.${idx}.resourceId`, res.id);
    setValue(`items.${idx}.name`, res.name);
    setValue(`items.${idx}.buyingPrice`, toNum(res.basePrice));
    setValue(`items.${idx}.unit`, res.unit);
    setValue(`items.${idx}.sellingPrice`, Math.round(toNum(res.basePrice) * 1.2));
  }

  const rowTotal = (() => {
    if (cat === 'hotel' || cat === 'resort')
      return (
        toNum(item?.sellingPrice) * (item?.numRooms ?? 1) * getNights(item?.checkIn, item?.checkOut)
      );
    return toNum(item?.sellingPrice) * toNum(item?.quantity);
  })();

  const margin =
    toNum(item?.buyingPrice) > 0
      ? (
          ((toNum(item?.sellingPrice) - toNum(item?.buyingPrice)) / toNum(item?.buyingPrice)) *
          100
        ).toFixed(0)
      : '—';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {CAT_MAP[cat]?.label ?? cat}
          </span>
          <input
            {...register(`items.${idx}.day`)}
            type="number"
            min={1}
            placeholder="Ngày #"
            className="w-16 px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${Number(margin) >= 20 ? 'bg-emerald-100 text-emerald-700' : Number(margin) >= 10 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}
          >
            Markup: {margin}%
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {formatCurrency(rowTotal, item?.currency || quotationCurrency)}
          </span>
          <button
            type="button"
            onClick={remove}
            className="text-slate-300 hover:text-red-500 text-xl"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nhà cung cấp</label>
            <select
              value={item?.supplierId ?? ''}
              onChange={(e) => {
                setValue(`items.${idx}.supplierId`, e.target.value);
                setValue(`items.${idx}.resourceId`, '');
                setValue(`items.${idx}.name`, '');
              }}
              className={inputCls}
            >
              <option value="">-- Chọn NCC --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {'★'.repeat(s.rating)} {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Dịch vụ</label>
            {resources.length > 0 ? (
              <select
                value={item?.resourceId ?? ''}
                onChange={(e) => handleResourceChange(e.target.value)}
                className={inputCls}
              >
                <option value="">-- Chọn dịch vụ --</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {toNum(r.basePrice).toLocaleString()} {r.currency}
                  </option>
                ))}
              </select>
            ) : (
              <input
                {...register(`items.${idx}.name`)}
                placeholder="Tên dịch vụ"
                className={inputCls}
              />
            )}
          </div>
        </div>

        {resources.length > 0 && item?.resourceId && (
          <div>
            <label className={labelCls}>Tên hiển thị</label>
            <input {...register(`items.${idx}.name`)} className={inputCls} />
          </div>
        )}

        {(cat === 'hotel' || cat === 'resort') && (
          <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-700">🏨 Lưu trú</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Check-in</label>
                <input type="date" {...register(`items.${idx}.checkIn`)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Check-out</label>
                <input type="date" {...register(`items.${idx}.checkOut`)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Số phòng</label>
                <input
                  type="number"
                  min={1}
                  {...register(`items.${idx}.numRooms`)}
                  placeholder="1"
                  className={inputCls}
                />
              </div>
            </div>
            {item?.checkIn && item?.checkOut && (
              <div className="text-xs text-blue-600 bg-blue-100 rounded px-3 py-1.5">
                {getNights(item.checkIn, item.checkOut)} đêm × {item?.numRooms ?? 1} phòng ={' '}
                <strong>{getNights(item.checkIn, item.checkOut) * (item?.numRooms ?? 1)}</strong>{' '}
                room-nights →{' '}
                <strong>
                  {formatCurrency(
                    toNum(item?.sellingPrice) *
                      getNights(item.checkIn, item.checkOut) *
                      (item?.numRooms ?? 1),
                    item?.currency || quotationCurrency,
                  )}
                </strong>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Giá vốn/phòng/đêm</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.buyingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Giá bán/phòng/đêm</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.sellingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tiền tệ</label>
                <select {...register(`items.${idx}.currency`)} className={inputCls}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {(cat === 'transport' || cat === 'boat') && (
          <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-xs font-semibold text-orange-700">🚌 Vận chuyển</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Ngày</label>
                <input type="date" {...register(`items.${idx}.serviceDate`)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Số lượng</label>
                <input
                  type="number"
                  min={1}
                  {...register(`items.${idx}.quantity`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Đơn vị</label>
                <select {...register(`items.${idx}.unit`)} className={inputCls}>
                  <option value="per_trip">/ chuyến</option>
                  <option value="per_vehicle">/ xe</option>
                  <option value="per_day">/ ngày</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Lộ trình</label>
              <input
                {...register(`items.${idx}.description`)}
                placeholder="VD: Sân bay → Khách sạn"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Giá vốn</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.buyingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Giá bán</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.sellingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tiền tệ</label>
                <select {...register(`items.${idx}.currency`)} className={inputCls}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {cat === 'restaurant' && (
          <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-xs font-semibold text-green-700">🍽️ Ăn uống</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Ngày</label>
                <input type="date" {...register(`items.${idx}.serviceDate`)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Số người</label>
                <input
                  type="number"
                  min={1}
                  {...register(`items.${idx}.quantity`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Đơn vị</label>
                <select {...register(`items.${idx}.unit`)} className={inputCls}>
                  <option value="per_person">/ người</option>
                  <option value="per_table">/ bàn</option>
                  <option value="per_trip">/ buổi</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Giá vốn/người</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.buyingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Giá bán/người</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.sellingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tiền tệ</label>
                <select {...register(`items.${idx}.currency`)} className={inputCls}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {cat === 'guide' && (
          <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-xs font-semibold text-purple-700">🧭 HDV</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Số ngày</label>
                <input
                  type="number"
                  min={1}
                  {...register(`items.${idx}.numDays`)}
                  onChange={(e) => {
                    setValue(`items.${idx}.numDays`, Number(e.target.value));
                    setValue(`items.${idx}.quantity`, Number(e.target.value));
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Công tác phí/ngày (bán)</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.sellingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Công tác phí/ngày (vốn)</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.buyingPrice`)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tips/người (bán)</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.tipsPerPerson`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tips/người (vốn)</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.buyTipsPerPerson`)}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tiền tệ</label>
              <select {...register(`items.${idx}.currency`)} className={`${inputCls} w-40`}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {cat === 'attraction' && (
          <div className="space-y-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-xs font-semibold text-yellow-700">🎡 Vé tham quan</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Ngày</label>
                <input type="date" {...register(`items.${idx}.serviceDate`)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Số người</label>
                <input
                  type="number"
                  min={1}
                  {...register(`items.${idx}.quantity`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Đơn vị</label>
                <select {...register(`items.${idx}.unit`)} className={inputCls}>
                  <option value="per_person">/ người</option>
                  <option value="per_trip">/ đoàn</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Giá vốn/vé</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.buyingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Giá bán/vé</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.sellingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tiền tệ</label>
                <select {...register(`items.${idx}.currency`)} className={inputCls}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {(cat === 'visa' || cat === 'insurance' || cat === 'other') && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Số lượng</label>
                <input
                  type="number"
                  min={1}
                  {...register(`items.${idx}.quantity`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Đơn vị</label>
                <select {...register(`items.${idx}.unit`)} className={inputCls}>
                  <option value="per_person">/ người</option>
                  <option value="per_trip">/ chuyến</option>
                  <option value="per_day">/ ngày</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Giá vốn</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.buyingPrice`)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Giá bán</label>
                <input
                  type="number"
                  min={0}
                  {...register(`items.${idx}.sellingPrice`)}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Mô tả</label>
              <input {...register(`items.${idx}.description`)} className={inputCls} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              {...register(`items.${idx}.isIncluded`)}
              className="rounded"
              defaultChecked
            />
            Bao gồm trong giá
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" {...register(`items.${idx}.isOptional`)} className="rounded" />
            Dịch vụ tùy chọn
          </label>
        </div>
      </div>
    </div>
  );
}

export default function NewQuotationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'items' | 'notes'>('info');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

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
      pax: 2,
      currency: 'USD',
      discountPct: 0,
      taxPct: 0,
      items: [],
      tourQuotationType: '',
      groupTourTemplateId: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');
  const watchedDiscPct = Number(watch('discountPct') ?? 0);
  const watchedTaxPct = Number(watch('taxPct') ?? 0);
  const watchedCurrency = watch('currency') ?? 'USD';
  const watchedPax = Number(watch('pax') ?? 1);
  const tourType = watch('tourQuotationType');
  const totals = calcTotals(watchedItems, watchedDiscPct, watchedTaxPct);

  // Load templates when GROUP is selected
  useEffect(() => {
    if (tourType === 'GROUP' && templates.length === 0 && !loadingTemplates) {
      setLoadingTemplates(true);
      api
        .get<any>('/group-tours/templates', { isActive: true, limit: 100 })
        .then((res: any) => setTemplates(res?.data ?? []))
        .catch(() => {})
        .finally(() => setLoadingTemplates(false));
    }
  }, [tourType]);

  const addItem = useCallback(
    (category: string) => {
      append({
        category,
        name: '',
        quantity: 1,
        unit: 'per_person',
        sellingPrice: 0,
        buyingPrice: 0,
        currency: watchedCurrency,
        isOptional: false,
        isIncluded: true,
        numRooms: 1,
        numDays: 1,
      });
      setActiveTab('items');
    },
    [append, watchedCurrency],
  );

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...data,
        tourQuotationType: data.tourQuotationType || undefined,
        groupTourTemplateId: data.groupTourTemplateId || undefined,
        duration: data.duration || undefined,
        leadId: data.leadId?.trim() || undefined,
        destination: data.destination?.trim() || undefined,
        travelDateFrom: data.travelDateFrom?.trim() || undefined,
        travelDateTo: data.travelDateTo?.trim() || undefined,
        validUntil: data.validUntil?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        internalNotes: data.internalNotes?.trim() || undefined,
        items: data.items.map((item) => transformItem(item as ItemData, data.pax)),
      };
      const result = await api.post<{ id: string }>('/quotations', payload);
      router.push(`/dashboard/quotations/${(result as any).id}`);
    } catch (e) {
      const err = e as AxiosError<{ message: string }>;
      setError(err.response?.data?.message ?? 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-700 text-sm"
          >
            ← Back
          </button>
          <span className="text-slate-200">|</span>
          <h1 className="font-semibold text-slate-900 text-sm">New Quotation</h1>
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-600 max-w-xs truncate">{error}</p>}
          <button
            onClick={handleSubmit(onSubmit as any)}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving...' : '💾 Save Quotation'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-slate-200 bg-white px-6 flex gap-1 flex-shrink-0">
            {(['info', 'items', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {tab === 'info'
                  ? '📝 Thông tin'
                  : tab === 'items'
                    ? `📦 Items (${fields.length})`
                    : '📌 Ghi chú'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl space-y-5">
              {activeTab === 'info' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('title')}
                      placeholder="VD: Vietnam Classic 7N6Đ – Hana Travel – 10 khách"
                      className={inputCls}
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Tour Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Loại báo giá
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          value: '',
                          label: 'Dịch vụ lẻ',
                          icon: '📦',
                          desc: 'Hotel, transport, v.v.',
                        },
                        {
                          value: 'GROUP',
                          label: 'Group Tour',
                          icon: '👥',
                          desc: 'Chọn từ template',
                        },
                        {
                          value: 'PRIVATE',
                          label: 'Private Tour',
                          icon: '🎯',
                          desc: 'Tùy chỉnh itinerary',
                        },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setValue('tourQuotationType', type.value as any, {
                              shouldValidate: true,
                            });
                            if (!type.value) setValue('groupTourTemplateId', '');
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${watch('tourQuotationType') === type.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <span className="text-2xl">{type.icon}</span>
                          <p className="text-sm font-semibold text-slate-900 mt-1">{type.label}</p>
                          <p className="text-xs text-slate-500">{type.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Group Tour Template Selector */}
                  {tourType === 'GROUP' && (
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        👥 Chọn Group Tour Template
                      </label>
                      <select
                        value={watch('groupTourTemplateId') || ''}
                        onChange={(e) => {
                          setValue('groupTourTemplateId', e.target.value, { shouldValidate: true });
                          const tpl = templates.find((t: any) => t.id === e.target.value);
                          if (tpl) {
                            setValue('title', tpl.title);
                            if (tpl.duration) setValue('duration', tpl.duration);
                            const pkgItem = {
                              category: 'tour_package',
                              name: tpl.templateName || tpl.title,
                              description: tpl.currentVersion?.overview || 'Group tour package',
                              quantity: watchedPax,
                              unit: 'per_person',
                              sellingPrice: Number(tpl.packagePrice) || 0,
                              buyingPrice: Number(tpl.packagePrice || 0) * 0.7,
                              currency: tpl.packagePriceCurrency || watchedCurrency,
                              isIncluded: true,
                              isOptional: false,
                            };
                            const exists = watchedItems.some(
                              (i: any) => i.category === 'tour_package',
                            );
                            if (!exists) append(pkgItem);
                          }
                        }}
                        className={inputCls}
                      >
                        <option value="">-- Chọn template --</option>
                        {loadingTemplates && <option disabled>Đang tải...</option>}
                        {templates.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.templateName || t.title} ({t.duration}N{t.duration - 1}Đ) —{' '}
                            {t.packagePrice} {t.packagePriceCurrency || 'USD'}/person
                          </option>
                        ))}
                      </select>
                      {watch('groupTourTemplateId') && (
                        <p className="text-xs text-blue-600 mt-2">
                          ✓ Itinerary và dịch vụ đã được tự động thêm
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Khách hàng <span className="text-red-500">*</span>
                      </label>
                      <CustomerSearch
                        value={watch('customerId') ?? ''}
                        onChange={(id) => setValue('customerId', id, { shouldValidate: true })}
                        error={errors.customerId?.message}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Lead ID (tuỳ chọn)
                      </label>
                      <input {...register('leadId')} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Tổng khách *
                      </label>
                      <input {...register('pax')} type="number" min={1} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Người lớn
                      </label>
                      <input {...register('paxAdult')} type="number" min={0} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Trẻ em
                      </label>
                      <input {...register('paxChild')} type="number" min={0} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Ngày đi
                      </label>
                      <input {...register('travelDateFrom')} type="date" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Ngày về
                      </label>
                      <input {...register('travelDateTo')} type="date" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Điểm đến
                      </label>
                      <input {...register('destination')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Tiền tệ
                      </label>
                      <select {...register('currency')} className={inputCls}>
                        {CURRENCIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Giảm giá %
                      </label>
                      <input
                        {...register('discountPct')}
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Thuế %
                      </label>
                      <input
                        {...register('taxPct')}
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Hiệu lực đến
                      </label>
                      <input {...register('validUntil')} type="date" className={inputCls} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'items' && (
                <>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      + Thêm dịch vụ
                    </p>
                    {[
                      { group: 'Lưu trú', keys: ['hotel', 'resort'] },
                      { group: 'Di chuyển', keys: ['transport', 'boat'] },
                      { group: 'Ăn uống', keys: ['restaurant'] },
                      { group: 'Dịch vụ', keys: ['guide', 'attraction'] },
                      { group: 'Khác', keys: ['visa', 'insurance', 'other'] },
                    ].map(({ group, keys }) => (
                      <div key={group} className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 w-20 flex-shrink-0">{group}</span>
                        {keys.map((key) => {
                          const cat = CAT_MAP[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => addItem(key)}
                              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 flex items-center gap-1.5"
                            >
                              {cat.icon} {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {fields.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-2xl mb-2">🗂️</p>
                        <p className="font-medium">Chưa có dịch vụ nào</p>
                        <p className="text-sm mt-1">Chọn loại dịch vụ ở trên để thêm vào báo giá</p>
                      </div>
                    )}
                    {fields.map((field, idx) => (
                      <SmartItemRow
                        key={field.id}
                        idx={idx}
                        register={register}
                        watch={watch}
                        setValue={setValue}
                        remove={() => remove(idx)}
                        pax={watchedPax}
                        quotationCurrency={watchedCurrency}
                      />
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'notes' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Ghi chú cho khách hàng
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={6}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Ghi chú nội bộ{' '}
                      <span className="text-slate-400 font-normal text-xs ml-1">
                        (không hiển thị với khách)
                      </span>
                    </label>
                    <textarea
                      {...register('internalNotes')}
                      rows={5}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-72 border-l border-slate-200 bg-white flex-shrink-0 overflow-y-auto">
          <div className="p-5">
            <h2 className="font-semibold text-slate-900 mb-5 text-sm">Tổng báo giá</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({fields.length} items)</span>
                <span className="font-medium">
                  {formatCurrency(totals.subtotal, watchedCurrency)}
                </span>
              </div>
              {watchedDiscPct > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Giảm ({watchedDiscPct}%)</span>
                  <span>−{formatCurrency(totals.discountAmt, watchedCurrency)}</span>
                </div>
              )}
              {watchedTaxPct > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Thuế ({watchedTaxPct}%)</span>
                  <span>{formatCurrency(totals.taxAmt, watchedCurrency)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2.5 flex justify-between font-bold text-slate-900 text-base">
                <span>Tổng cộng</span>
                <span>{formatCurrency(totals.total, watchedCurrency)}</span>
              </div>
            </div>
            {watchedPax > 0 && totals.total > 0 && (
              <div className="mt-4 bg-blue-50 rounded-xl p-3.5">
                <p className="text-xs text-blue-500 font-medium">Giá / người</p>
                <p className="text-xl font-bold text-blue-700 mt-0.5">
                  {formatCurrency(totals.total / watchedPax, watchedCurrency)}
                </p>
              </div>
            )}
            <div className="mt-6 pt-5 border-t border-dashed border-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                🔒 Nội bộ
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Tổng vốn</span>
                  <span>{formatCurrency(totals.totalCost, watchedCurrency)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Lợi nhuận</span>
                  <span className={totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {formatCurrency(totals.profit, watchedCurrency)}
                  </span>
                </div>
              </div>
              <div
                className={`mt-4 rounded-xl p-4 text-center ${totals.margin >= 20 ? 'bg-emerald-50' : totals.margin >= 10 ? 'bg-amber-50' : 'bg-red-50'}`}
              >
                <p
                  className={`text-3xl font-black ${totals.margin >= 20 ? 'text-emerald-600' : totals.margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}
                >
                  {totals.margin.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 mt-1">biên lợi nhuận</p>
                <p
                  className={`text-xs font-medium mt-1 ${totals.margin >= 20 ? 'text-emerald-600' : totals.margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}
                >
                  {totals.margin >= 20 ? '✓ Tốt' : totals.margin >= 10 ? '⚠ Thấp' : '✗ Quá thấp'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
