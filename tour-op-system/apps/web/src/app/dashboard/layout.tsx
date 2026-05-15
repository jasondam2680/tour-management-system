'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard',            icon: '⊞' },
  { label: 'Customers',   href: '/dashboard/customers',  icon: '👥', roles: ['SUPER_ADMIN','ADMIN','SALES','OP','FINANCE'] },
  { label: 'Suppliers',   href: '/dashboard/suppliers',  icon: '🏭', roles: ['SUPER_ADMIN','ADMIN','OP'] },
  { label: 'Leads',       href: '/dashboard/leads',      icon: '🎯', roles: ['SUPER_ADMIN','ADMIN','SALES'] },
  { label: 'Quotations',  href: '/dashboard/quotations', icon: '📋', roles: ['SUPER_ADMIN','ADMIN','SALES'] },
  { label: 'Tours',       href: '/dashboard/tours',      icon: '✈️' },
  { label: 'Bookings',    href: '/dashboard/bookings',   icon: '📅', roles: ['SUPER_ADMIN','ADMIN','OP'] },
  { label: 'Finance',     href: '/dashboard/finance',    icon: '💰', roles: ['SUPER_ADMIN','ADMIN','FINANCE'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 min-h-screen bg-slate-900 flex flex-col fixed left-0 top-0 bottom-0 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm truncate">Tour OP System</p>
            <p className="text-slate-400 text-xs truncate">{user.organization?.name}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                )}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-xs font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-slate-400 text-xs">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-white transition-colors text-xs flex-shrink-0"
              title="Sign out"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
