import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Material } from '../types';
import { enrichMaterials } from '../patterns/MaterialDecorator';
import { materialTitleSearch } from '../patterns/SearchStrategy';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filtered, setFiltered] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [materials, searchQuery, filterType, filterCategory, sortBy]);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('materials')
      .select('*, seller:profiles(*)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMaterials(data as Material[]);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let result = [...materials];

    if (filterType !== 'all') {
      result = result.filter(m => m.type === filterType);
    }

    if (filterCategory !== 'all') {
      result = result.filter(m => m.category === filterCategory);
    }

    if (searchQuery.trim()) {
      result = materialTitleSearch.execute(result, searchQuery);
    }

    switch (sortBy) {
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        result.sort((a, b) => b.view_count - a.view_count);
        break;
    }

    setFiltered(result);
  };

  const categories = ['General', 'Math', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Engineering', 'Literature'];
  const types = ['pdf', 'book', 'project', 'notes', 'other'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
            <p className="text-gray-600 mt-1">Browse {filtered.length} materials available</p>
          </div>
          {user && (
            <Link
              to="/materials/upload"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Upload
            </Link>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Sort:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Recent</option>
              <option value="price_low">Price Low</option>
              <option value="price_high">Price High</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
              <div className="flex flex-wrap gap-2">
                {['all', ...types].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['all', ...categories.map(c => c.toLowerCase())].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium text-center ${filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterCategory('all');
                setSortBy('recent');
              }}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No materials found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {enrichMaterials(filtered).map(material => (
              <Link
                key={material.id}
                to={`/materials/${material.id}`}
                className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="h-40 bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center text-4xl overflow-hidden">
                  {material.image_url
                    ? <img src={material.image_url} alt={material.title} className="w-full h-full object-cover" />
                    : material.typeIcon
                  }
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-2">{material.title}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{material.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{material.priceLabel}</span>
                    <span className="text-xs text-gray-400">{material.view_count} views</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
