'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { itinerariesApi } from '@/lib/api/itineraries';
import type { Itinerary, ItineraryVersion } from '@/types';

export default function ItinerariesPage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchItineraries = async () => {
    setIsLoading(true);
    try {
      const result = await itinerariesApi.getAll({
        search: search || undefined,
        page,
        limit: 20,
      });
      const paginated = result as any;
      setItineraries(paginated.data || []);
      setMeta(paginated.meta || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch itineraries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItineraries(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchItineraries();
  };

  const openDetail = async (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const detail = await itinerariesApi.getOne(itinerary.id);
      setSelectedItinerary(detail as any);
    } catch (err) {
      console.error('Failed to fetch itinerary detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedItinerary(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this itinerary?')) return;
    try {
      await itinerariesApi.remove(id);
      fetchItineraries();
      if (selectedItinerary?.id === id) closeDetail();
    } catch (err) {
      console.error('Failed to delete itinerary:', err);
      alert('Failed to delete itinerary');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Itineraries</h1>
          <p className="text-slate-500 text-sm mt-0.5">{meta.total} total</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/itineraries/new')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
            font-medium rounded-lg transition-colors"
        >
          + New Itinerary
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or title..."
            className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900
              placeholder:text-slate-400"
          />
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
        ) : itineraries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-lg">No itineraries found</p>
            <p className="text-sm mt-1">Create your first itinerary to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Code</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Title</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Current Version</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Versions</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Created</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itineraries.map((itinerary) => (
                <tr
                  key={itinerary.id}
                  onClick={() => openDetail(itinerary)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {itinerary.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900">{itinerary.title}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {itinerary.currentVersion ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                        v{itinerary.currentVersion.versionNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {itinerary._count?.versions ?? 0}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {new Date(itinerary.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(e) => handleDelete(itinerary.id, e)}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors"
                    >
                      Delete
                    </button>
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

      {/* Detail Modal */}
      {showDetailModal && selectedItinerary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetail} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">{selectedItinerary.title}</h2>
                  <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {selectedItinerary.code}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  Created {new Date(selectedItinerary.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={closeDetail}
                className="text-slate-400 hover:text-slate-600 text-xl transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {detailLoading ? (
                <div className="flex items-center justify-center h-32 text-slate-400">Loading...</div>
              ) : (
                <div>
                  {/* Current Version Info */}
                  {selectedItinerary.currentVersion ? (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Current Version (v{selectedItinerary.currentVersion.versionNumber})
                      </h3>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="font-medium text-slate-900">{selectedItinerary.currentVersion.title}</p>
                        {selectedItinerary.currentVersion.overview && (
                          <p className="text-sm text-slate-600 mt-1">{selectedItinerary.currentVersion.overview}</p>
                        )}
                        {selectedItinerary.currentVersion.days && selectedItinerary.currentVersion.days.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              {selectedItinerary.currentVersion.days.length} days
                            </p>
                            <div className="mt-2 space-y-2">
                              {selectedItinerary.currentVersion.days.map((day) => (
                                <div key={day.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                      Day {day.dayNumber}
                                    </span>
                                    {day.title && (
                                      <span className="text-sm font-medium text-slate-800">{day.title}</span>
                                    )}
                                  </div>
                                  {day.description && (
                                    <p className="text-xs text-slate-500 mt-1">{day.description}</p>
                                  )}
                                  {day.activities && day.activities.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {day.activities.map((activity) => (
                                        <div key={activity.id} className="flex items-center gap-2 text-xs">
                                          {activity.time && (
                                            <span className="text-slate-400 font-mono">{activity.time}</span>
                                          )}
                                          <span className="text-slate-700">{activity.title}</span>
                                          {activity.location && (
                                            <span className="text-slate-400">· {activity.location}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-700">No versions created yet.</p>
                    </div>
                  )}

                  {/* Version History */}
                  {selectedItinerary.versions && selectedItinerary.versions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">Version History</h3>
                      <div className="space-y-2">
                        {selectedItinerary.versions.map((version) => (
                          <div
                            key={version.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              version.isActive
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono font-medium text-slate-700">
                                v{version.versionNumber}
                              </span>
                              <span className="text-sm text-slate-600">{version.title}</span>
                              {version.isActive && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(version.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={closeDetail}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg
                  hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeDetail();
                  router.push(`/dashboard/itineraries/${selectedItinerary.id}/edit`);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700 transition-colors"
              >
                Edit Itinerary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
