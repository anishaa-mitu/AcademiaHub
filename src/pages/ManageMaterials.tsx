import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, CheckCircle, XCircle, Eye, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Material } from '../types';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import { supabase } from '../lib/supabase';

// ── Design Patterns ────────────────────────────────────────────────────────────
import { MaterialFacade } from '../patterns/MaterialFacade';           // Facade
import { enrichMaterial } from '../patterns/MaterialDecorator';        // Decorator
import { materialTitleSearch } from '../patterns/SearchStrategy';      // Strategy

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'approved') return <CheckCircle className="w-4 h-4" />;
  if (status === 'rejected') return <XCircle className="w-4 h-4" />;
  return <Clock className="w-4 h-4" />;
};

export default function ManageMaterials() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => { fetchMaterials(); }, [user]);

  const fetchMaterials = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    setMaterials(data ?? []);
    setLoading(false);
  };

  // Strategy Pattern — search/filter by title or description
  const filtered = useMemo(
    () => materialTitleSearch.execute(materials, query),
    [materials, query]
  );

  // Decorator Pattern — enrich each material with computed display fields
  const enriched = useMemo(() => filtered.map(enrichMaterial), [filtered]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    // Facade Pattern — delegates delete + ownership check
    const { error } = await MaterialFacade.deleteMaterial(id, user!.id);
    if (!error) setMaterials(prev => prev.filter(m => m.id !== id));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Materials</h1>
            <Link to="/materials/upload"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Upload New
            </Link>
          </div>

          {/* Strategy Pattern — search input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search your materials..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : enriched.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-400 mb-4">
                {query ? 'No materials match your search.' : "You haven't uploaded any materials yet."}
              </p>
              {!query && (
                <Link to="/materials/upload" className="text-blue-600 font-medium hover:underline">
                  Upload your first material →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {enriched.map(m => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
                  {/* Decorator — typeIcon from enrichMaterial */}
                  <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
                    {m.image_url
                      ? <img src={m.image_url} alt={m.title} className="w-full h-full object-cover" />
                      : <span className="text-2xl">{m.typeIcon}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{m.title}</h3>
                        {/* Decorator — isNew badge */}
                        {m.isNew && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded shrink-0">New</span>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border font-medium shrink-0 ${statusColors[m.status]}`}>
                        <StatusIcon status={m.status} />
                        {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{m.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      {/* Decorator — priceLabel and conditionLabel */}
                      <span className="font-medium text-gray-700">{m.priceLabel}</span>
                      <span>•</span>
                      <span>{m.conditionLabel}</span>
                      <span>•</span>
                      <span>{m.category}</span>
                      <span>•</span>
                      <span>👁 {m.view_count} views</span>
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {m.status === 'approved' && (
                      <Link to={`/materials/${m.id}`}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                    )}
                    <button onClick={() => handleDelete(m.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}