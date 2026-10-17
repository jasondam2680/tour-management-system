'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Quotation, QuotationStatus, PaginatedResult } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<QuotationStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-cyan-100 text-cyan-700',
  NEGOTIATING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-slate-100 text-slate-500',
  CONVERTED: 'bg-violet-100 text-violet-700',
};

const ALL_STATUSES: QuotationStatus[] = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'NEGOTIATING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CONVERTED',
];

export default function QuotationsPage() {
  const router = useRouter();
  const [result, setResult] = useState<PaginatedResult<Quotation> | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuotationStatus | ''>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResult<Quotation>>('/quotations', {
        search: search || undefined,
        status: status || undefined,
        page,
        limit: 20,
      });
      setResult(data as unknown as PaginatedResult<Quotation>);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const displayName = (q: Quotation) => {
    if (!q.customer) return '—';
    return q.customer.type === 'B2B'
      ? q.customer.companyName
      : `${q.customer.firstName ?? ''} ${q.customer.lastName ?? ''}`.trim();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
          <p className="text-slate-500 text-sm mt-0.5">{result?.meta.total ?? '—'} total</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/quotations/new')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
            font-medium rounded-lg transition-colors"
        >
          + New Quotation
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => {
            setStatus('');
            setPage(1);
          }}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            status === ''
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300',
          )}
        >
          All
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              status === s
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              fetch();
            }
          }}
          placeholder="Search by title, code, destination..."
          className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm
            text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => {
            setPage(1);
            fetch();
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            Loading...
          </div>
        ) : !result?.data.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-lg font-medium">No quotations found</p>
            <p className="text-sm mt-1">Create your first quotation to get started</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Code', 'Title', 'Customer', 'Pax', 'Total', 'Profit', 'Status', 'Date'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.data.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/dashboard/quotations/${q.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {q.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900 truncate max-w-48">{q.title}</p>
                      {q.destination && (
                        <p className="text-xs text-slate-400 truncate">{q.destination}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700 truncate max-w-32">{displayName(q)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{q.pax}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">
                        {formatCurrency(q.totalAmount, q.currency)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p
                        className={cn(
                          'font-medium text-sm',
                          Number(q.profitMargin) >= 20
                            ? 'text-emerald-600'
                            : Number(q.profitMargin) >= 10
                              ? 'text-amber-600'
                              : 'text-red-600',
                        )}
                      >
                        {Number(q.profitMargin).toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(q.profitAmount, q.currency)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          STATUS_STYLE[q.status],
                        )}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {formatDate(q.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Page {page} of {result.meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === result.meta.totalPages}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
