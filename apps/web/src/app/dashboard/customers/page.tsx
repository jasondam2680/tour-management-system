'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Customer, CustomerType } from '@/types';
import { PaginatedData } from '@/lib/api-client';

const TYPE_BADGE: Record<CustomerType, string> = {
  B2B: 'bg-blue-100 text-blue-700',
  B2C: 'bg-green-100 text-green-700',
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const result = await api.get<PaginatedData<Customer>>('/customers', {
        search: search || undefined,
        type: typeFilter || undefined,
        page,
        limit: 20,
      });
      const paginated = result as unknown as PaginatedData<Customer>;
      setCustomers(paginated.data);
      setMeta(paginated.meta);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [page, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const getDisplayName = (c: Customer) =>
    c.type === 'B2B' ? c.companyName : `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 text-sm mt-0.5">{meta.total} total</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/customers/new')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
            font-medium rounded-lg transition-colors"
        >
          + New Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900
              placeholder:text-slate-400"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CustomerType | '')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="B2B">B2B (Agency/Corporate)</option>
            <option value="B2C">B2C (Individual)</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg
              hover:bg-slate-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            Loading...
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-lg">No customers found</p>
            <p className="text-sm mt-1">Create your first customer to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Customer</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Type</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Contact</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Country</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Tours</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center
                        justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-bold">
                          {getDisplayName(customer)?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{getDisplayName(customer)}</p>
                        <p className="text-xs text-slate-400">{customer.code}</p>
                      </div>
                      {customer.isVip && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                          VIP
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${TYPE_BADGE[customer.type]}`}>
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-slate-700">{customer.email ?? '—'}</p>
                    <p className="text-xs text-slate-400">{customer.phone ?? ''}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{customer.country ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-600">{customer.totalTours}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${customer.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'}`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page === 1}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg
                  disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page === meta.totalPages}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg
                  disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
