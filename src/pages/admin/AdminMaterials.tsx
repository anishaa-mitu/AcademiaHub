import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, Loader, PackageOpen, ArrowLeft, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// Facade Pattern — all DB calls go through AdminFacade
import { AdminFacade } from '../../patterns/AdminFacade';
// Decorator Pattern — enrich materials with computed display properties
import { enrichMaterials } from '../../patterns/MaterialDecorator';
// Strategy Pattern — search across all materials
import { materialTitleSearch } from '../../patterns/SearchStrategy';
import { Material } from '../../types';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminMaterials() {
  const { permissions } = useAuth();
  const navigate        = useNavigate();

  // Factory Pattern — block non-admins at render time
  if (!permissions.canApproveContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Access denied.</p>
      </div>
    );
  }

  const [materials, setMaterials]     = useState<Material[]>([]);
  const [filtered, setFiltered]       = useState<Material[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [actionMsg, setActionMsg]     = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [actioning, setActioning]     = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  // Strategy Pattern — re-runs on every filter/search change
  useEffect(() => {
    let result = statusFilter === 'all'
      ? materials
      : materials.filter(m => m.status === statusFilter);
    if (searchQuery.trim()) {
      result = materialTitleSearch.execute(result, searchQuery);
    }
    setFiltered(result);
  }, [materials, searchQuery, statusFilter]);

  const load = async () => {
    setLoading(true);
    // Facade Pattern — single call fetches all materials with seller profiles
    const data = await AdminFacade.fetchAllMaterials();
    setMaterials(data);
    setLoading(false);
  };

  const flash = (id: string, msg: string, ok: boolean) => {
    setActionMsg({ id, msg, ok });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const approve = async (id: string) => {
    setActioning(id);
    // Facade Pattern — approval + Observer notifications handled inside
    const err = await AdminFacade.approveMaterial(id);
    setActioning(null);
    if (err) flash(id, err, false);
    else { flash(id, 'Approved!', true); load(); }
  };

  const reject = async (id: string) => {
    setActioning(id);
    const err = await AdminFacade.rejectMaterial(id);
    setActioning(null);
    if (err) flash(id, err, false);
    else { flash(id, 'Rejected.', true); load(); }
  };

  const STATUS_TABS: { label: string; value: StatusFilter; color: string }[] = [
    { label: 'Pending',  value: 'pending',  color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Approved', value: 'approved', color: 'text-green-600 bg-green-50 border-green-200' },
    { label: 'Rejected', value: 'rejected', color: 'text-red-600 bg-red-50 border-red-200' },
    { label: 'All',      value: 'all',      color: 'text-gray-600 bg-gray-50 border-gray-200' },
  ];

  const enriched = enrichMaterials(filtered);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Materials Review</h1>
            <p className="text-sm text-gray-500 mt-0.5">Approve or reject user-submitted materials</p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                statusFilter === tab.value
                  ? tab.color
                  : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">
                ({materials.filter(m => tab.value === 'all' ? true : m.status === tab.value).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : enriched.length === 0 ? (
          <div className="text-center py-20">
            <PackageOpen className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No materials in this category.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {enriched.map(mat => (
              <div
                key={mat.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Type icon banner */}
                <div className="h-24 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-4xl">
                  {mat.typeIcon}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      mat.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                      mat.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                  'bg-red-100 text-red-700'
                    }`}>
                      {mat.status.charAt(0).toUpperCase() + mat.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">{mat.typeIcon} {mat.type}</span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{mat.title}</h3>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{mat.description}</p>

                  <div className="text-xs text-gray-400 mb-1">
                    Seller: <span className="text-gray-700 font-medium">{mat.seller?.full_name ?? '—'}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    Price: <span className="text-gray-700 font-medium">{mat.priceLabel}</span>
                    &nbsp;·&nbsp;Condition: <span className="text-gray-700 font-medium">{mat.conditionLabel}</span>
                  </div>

                  {/* Inline flash message */}
                  {actionMsg?.id === mat.id && (
                    <p className={`text-xs font-medium mb-2 ${actionMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                      {actionMsg.msg}
                    </p>
                  )}

                  {/* Action buttons — only shown for pending items */}
                  <div className="flex gap-2 mt-auto">
                    {mat.file_url && (
                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </a>
                    )}
                    {mat.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approve(mat.id)}
                          disabled={actioning === mat.id}
                          className="flex-1 flex items-center justify-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actioning === mat.id
                            ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button
                          onClick={() => reject(mat.id)}
                          disabled={actioning === mat.id}
                          className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}