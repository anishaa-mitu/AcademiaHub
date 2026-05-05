import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, GraduationCap, ArrowLeft, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// Facade Pattern — all DB calls delegated to AdminFacade
import { AdminFacade } from '../../patterns/AdminFacade';
// Strategy Pattern — search tutor requests by name / expertise
import { SearchContext } from '../../patterns/SearchStrategy';
import { TutorRequest } from '../../types';

// ── Inline Strategy for tutor-request search ──────────────────────────────────
// Strategy Pattern — new algorithm added here, not inside SearchStrategy.ts,
// since TutorRequest is a distinct type.
const tutorRequestSearch = new SearchContext<TutorRequest>({
  filter(items: TutorRequest[], query: string): TutorRequest[] {
    const q = query.toLowerCase();
    return items.filter(r =>
      r.user?.full_name?.toLowerCase().includes(q) ||
      r.bio?.toLowerCase().includes(q) ||
      r.expertise?.some(e => e.toLowerCase().includes(q))
    );
  },
});

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminTutors() {
  const { permissions } = useAuth();
  const navigate        = useNavigate();

  // Factory Pattern — block non-admins
  if (!permissions.canApproveContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Access denied.</p>
      </div>
    );
  }

  const [requests, setRequests]         = useState<TutorRequest[]>([]);
  const [filtered, setFiltered]         = useState<TutorRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [actioning, setActioning]       = useState<string | null>(null);
  const [rejectNote, setRejectNote]     = useState<{ id: string; note: string } | null>(null);
  const [flash, setFlash]               = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  // Strategy Pattern — filter + search recalculate on every dependency change
  useEffect(() => {
    let result = statusFilter === 'all'
      ? requests
      : requests.filter(r => r.status === statusFilter);
    if (searchQuery.trim()) {
      result = tutorRequestSearch.execute(result, searchQuery);
    }
    setFiltered(result);
  }, [requests, searchQuery, statusFilter]);

  const load = async () => {
    setLoading(true);
    // Facade Pattern — one call, all the data
    const data = await AdminFacade.fetchTutorRequests();
    setRequests(data);
    setLoading(false);
  };

  const showFlash = (id: string, msg: string, ok: boolean) => {
    setFlash({ id, msg, ok });
    setTimeout(() => setFlash(null), 3000);
  };

  const approve = async (req: TutorRequest) => {
    setActioning(req.id);
    // Facade Pattern — promotes profile role + fires Observer notification
    const err = await AdminFacade.approveTutorRequest(req.id, req.user_id);
    setActioning(null);
    if (err) showFlash(req.id, err, false);
    else { showFlash(req.id, 'Approved! User is now a tutor.', true); load(); }
  };

  const confirmReject = async () => {
    if (!rejectNote) return;
    setActioning(rejectNote.id);
    const req = requests.find(r => r.id === rejectNote.id);
    const err = await AdminFacade.rejectTutorRequest(rejectNote.id, req?.user_id ?? '', rejectNote.note);
    setActioning(null);
    setRejectNote(null);
    if (err) showFlash(rejectNote.id, err, false);
    else { showFlash(rejectNote.id, 'Request rejected.', true); load(); }
  };

  const STATUS_TABS: { label: string; value: StatusFilter }[] = [
    { label: 'Pending',  value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'All',      value: 'all' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-white text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tutor Applications</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review and approve tutor requests</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">
                ({requests.filter(r => tab.value === 'all' ? true : r.status === tab.value).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, bio, or expertise..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <GraduationCap className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No requests in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Applicant info */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg">
                      {req.user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{req.user?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{req.user?.email}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    req.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                  }`}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>

                {/* Bio */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Bio</p>
                  <p className="text-sm text-gray-700 line-clamp-3">{req.bio}</p>
                </div>

                {/* Expertise tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {req.expertise?.map(tag => (
                    <span key={tag} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* WhatsApp */}
                {req.whatsapp_number && (
                  <p className="text-xs text-gray-400 mt-2">
                    WhatsApp: <span className="text-gray-700">{req.whatsapp_number}</span>
                  </p>
                )}

                {/* Admin note (if rejected) */}
                {req.admin_note && (
                  <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-600">
                    <span className="font-medium">Admin note:</span> {req.admin_note}
                  </div>
                )}

                {/* Flash */}
                {flash?.id === req.id && (
                  <p className={`text-xs font-medium mt-2 ${flash.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {flash.msg}
                  </p>
                )}

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => approve(req)}
                      disabled={actioning === req.id}
                      className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actioning === req.id
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectNote({ id: req.id, note: '' })}
                      disabled={actioning === req.id}
                      className="flex items-center gap-1.5 text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    {req.user?.whatsapp_number && (
                      <a
                        href={`https://wa.me/880${req.user.whatsapp_number.replace(/^0/, '')}?text=Hi%20${encodeURIComponent(req.user.full_name)}%2C%20regarding%20your%20AcademiaHub%20tutor%20application...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" /> WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject note modal */}
      {rejectNote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Reject Application</h2>
            <p className="text-sm text-gray-500 mb-4">
              Optionally add a note for the applicant explaining why.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Please complete your profile with more details..."
              value={rejectNote.note}
              onChange={e => setRejectNote(n => n ? { ...n, note: e.target.value } : null)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectNote(null)}
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!!actioning}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
              >
                {actioning ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}