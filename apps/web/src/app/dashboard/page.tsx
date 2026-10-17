'use client';

import { useAuthStore } from '@/store/auth.store';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SALES: 'Sales',
  OP: 'Operation',
  FINANCE: 'Finance',
  GUIDE: 'Tour Guide',
};

const STAT_CARDS = [
  { label: 'Active Tours',     value: '12',   change: '+2 this week',  color: 'bg-blue-500' },
  { label: 'Total Customers',  value: '248',  change: '+18 this month', color: 'bg-violet-500' },
  { label: 'Pending Bookings', value: '34',   change: '8 need action',  color: 'bg-amber-500' },
  { label: 'Monthly Revenue',  value: '$84K', change: '+12% vs last',   color: 'bg-emerald-500' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {ROLE_LABELS[user?.role ?? ''] ?? user?.role} ·{' '}
          {user?.organization?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 ${card.color} rounded-lg mb-4`} />
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm font-medium text-slate-600 mt-0.5">{card.label}</p>
            <p className="text-xs text-slate-400 mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'New Customer',   icon: '👤', href: '/dashboard/customers/new' },
            { label: 'New Quotation',  icon: '📋', href: '/dashboard/quotations/new' },
            { label: 'Add Supplier',   icon: '🏭', href: '/dashboard/suppliers/new' },
            { label: 'Create Tour',    icon: '✈️', href: '/dashboard/tours/new' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200
                hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-sm font-medium text-slate-700">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
