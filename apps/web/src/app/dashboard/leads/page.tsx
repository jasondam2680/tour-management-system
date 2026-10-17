'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Lead, LeadStatus, LeadPriority } from '@/types';
import { cn } from '@/lib/utils';

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'NEW',           label: 'New',           color: 'bg-slate-100 text-slate-700' },
  { status: 'CONTACTED',     label: 'Contacted',     color: 'bg-blue-100 text-blue-700' },
  { status: 'QUALIFIED',     label: 'Qualified',     color: 'bg-violet-100 text-violet-700' },
  { status: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-amber-100 text-amber-700' },
  { status: 'NEGOTIATING',   label: 'Negotiating',   color: 'bg-orange-100 text-orange-700' },
];

const PRIORITY_DOT: Record<LeadPriority, string> = {
  LOW:    'bg-slate-300',
  MEDIUM: 'bg-blue-400',
  HIGH:   'bg-amber-400',
  URGENT: 'bg-red-500',
};

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const displayName = lead.customer
    ? lead.customer.type === 'B2B'
      ? lead.customer.companyName
      : `${lead.customer.firstName ?? ''} ${lead.customer.lastName ?? ''}`.trim()
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer
        hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      {/* Priority + title */}
      <div className="flex items-start gap-2 mb-2">
        <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', PRIORITY_DOT[lead.priority])} />
        <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 leading-snug">
          {lead.title}
        </p>
      </div>

      {/* Customer */}
      {displayName && (
        <p className="text-xs text-slate-500 mb-2 truncate ml-4">{displayName}</p>
      )}

      {/* Details row */}
      <div className="flex items-center gap-3 ml-4 flex-wrap">
        {lead.pax && (
          <span className="text-xs text-slate-400">👥 {lead.pax} pax</span>
        )}
        {lead.destination && (
          <span className="text-xs text-slate-400 truncate">📍 {lead.destination}</span>
        )}
        {lead.budget && (
          <span className="text-xs text-slate-400">
            💰 {lead.currency} {lead.budget.toLocaleString()}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 ml-4">
        <div className="flex items-center gap-2">
          {lead._count?.activities ? (
            <span className="text-xs text-slate-400">💬 {lead._count.activities}</span>
          ) : null}
          {lead._count?.quotations ? (
            <span className="text-xs text-slate-400">📋 {lead._count.quotations}</span>
          ) : null}
        </div>
        {lead.assignedTo && (
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 text-xs font-bold">
              {lead.assignedTo.firstName[0]}
            </span>
          </div>
        )}
      </div>

      {/* Follow-up alert */}
      {lead.followUpAt && new Date(lead.followUpAt) <= new Date() && (
        <div className="mt-2 ml-4 text-xs text-amber-600 font-medium">
          ⏰ Follow-up overdue
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const router  = useRouter();
  const [kanban, setKanban] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState<'kanban' | 'list'>('kanban');

  const fetchKanban = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Record<string, Lead[]>>('/leads/kanban');
      setKanban(data as unknown as Record<string, Lead[]>);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKanban(); }, [fetchKanban]);

  const totalLeads = Object.values(kanban).flat().length;

  return (
    <div className="p-8 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-500 text-sm mt-0.5">{totalLeads} active leads</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['kanban', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  view === v ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {v === 'kanban' ? '⊞ Kanban' : '☰ List'}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push('/dashboard/leads/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
              font-medium rounded-lg transition-colors"
          >
            + New Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center flex-1 text-slate-400 text-sm">
          Loading pipeline...
        </div>
      ) : (
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const leads = kanban[col.status] ?? [];
            return (
              <div key={col.status} className="flex-shrink-0 w-72 flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', col.color)}>
                      {col.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{leads.length}</span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto min-h-24
                  rounded-xl bg-slate-50 p-3 border border-slate-200">
                  {leads.length === 0 && (
                    <div className="flex items-center justify-center h-16 text-slate-300 text-xs">
                      No leads
                    </div>
                  )}
                  {leads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                    />
                  ))}
                </div>

                {/* Column total if has budget data */}
                {leads.some((l) => l.estimatedValue) && (
                  <div className="mt-2 text-xs text-slate-400 text-right">
                    Est. value:{' '}
                    <span className="font-medium text-slate-600">
                      ${leads.reduce((s, l) => s + (l.estimatedValue ?? 0), 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Won / Lost summary column */}
          <div className="flex-shrink-0 w-60 flex flex-col gap-3">
            {/* WON */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  WON
                </span>
              </div>
              <p className="text-xs text-emerald-600">
                Click any lead card to change its status to WON
              </p>
            </div>
            {/* LOST */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  LOST
                </span>
              </div>
              <p className="text-xs text-red-500">
                Mark lost leads with a reason for tracking
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
