import { useState, useEffect } from 'react';
import { Search, List, Plus, Loader, Tag, DollarSign, MessageSquare, CheckCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WantedItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { notificationBus } from '../patterns/NotificationObserver';

const CATEGORIES = ['all', 'CSE', 'EEE', 'BBA', 'English', 'Physics', 'Chemistry', 'Math', 'Other'];

export default function Wanted() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<WantedItem[]>([]);
  const [filtered, setFiltered] = useState<WantedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'fulfilled'>('open');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', category: 'CSE', budget: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    let result = [...items];
    if (filterStatus !== 'all') result = result.filter(i => i.status === filterStatus);
    if (filterCategory !== 'all') result = result.filter(i => i.category === filterCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [items, searchQuery, filterCategory, filterStatus]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wanted_list')
      .select('*, requester:profiles(*)')
      .order('created_at', { ascending: false });

    if (!error && data) setItems(data as WantedItem[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSubmitMsg('');

    const { error } = await supabase.from('wanted_list').insert({
      requester_id: user.id,
      title: form.title,
      description: form.description,
      category: form.category,
      budget: parseFloat(form.budget) || 0,
      status: 'open',
    });

    if (error) {
      setSubmitMsg('Error: ' + error.message);
    } else {
      setSubmitMsg('Request posted!');
      setForm({ title: '', description: '', category: 'CSE', budget: '' });
      fetchItems();
      // Observer Pattern: notify listeners
      notificationBus.notify({
        event: 'wanted_match',
        title: 'New Wanted Request',
        body: `Someone is looking for: ${form.title}`,
        targetUserId: user.id,
      });
      setTimeout(() => { setShowModal(false); setSubmitMsg(''); }, 1500);
    }
    setSubmitting(false);
  };

  const handleMarkFulfilled = async (id: string) => {
    await supabase.from('wanted_list').update({ status: 'fulfilled' }).eq('id', id);
    fetchItems();
  };

  const contactRequester = async (requesterId: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from('chats')
      .select('id')
      .or(`and(participant_one.eq.${user.id},participant_two.eq.${requesterId}),and(participant_one.eq.${requesterId},participant_two.eq.${user.id})`)
      .single();

    if (existing) { window.location.href = `/chat?id=${existing.id}`; return; }

    const { data } = await supabase
      .from('chats')
      .insert({ participant_one: user.id, participant_two: requesterId })
      .select('id').single();
    if (data) window.location.href = `/chat?id=${data.id}`;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <List className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Wanted Materials</h1>
          </div>
          <p className="text-emerald-100 text-lg max-w-xl">
            Looking for a specific book, notes, or project? Post it here and let sellers find you.
          </p>

          <div className="mt-6 flex gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search wanted items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            {user && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-white text-emerald-700 font-semibold px-5 py-3 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Post Request
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Status filter */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1 gap-1">
            {(['all', 'open', 'fulfilled'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded text-sm font-medium capitalize transition-colors ${
                  filterStatus === s ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>

          <p className="ml-auto text-gray-500 text-sm self-center">
            {filtered.length} request{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Items */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No requests found</h3>
            <p className="text-gray-500 mb-4">Be the first to post a request!</p>
            {user && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Post a Request
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <WantedCard
                key={item.id}
                item={item}
                currentUserId={user?.id}
                onMarkFulfilled={handleMarkFulfilled}
                onContact={contactRequester}
                timeAgo={timeAgo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Post a Wanted Request</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What are you looking for? *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Signals & Systems textbook by Oppenheim"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Edition, condition preference, format (PDF/physical)..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    {CATEGORIES.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (৳)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="0 = flexible"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
              </div>

              {submitMsg && (
                <p className={`text-sm font-medium ${submitMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                  {submitMsg}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function WantedCard({
  item,
  currentUserId,
  onMarkFulfilled,
  onContact,
  timeAgo,
}: {
  item: WantedItem;
  currentUserId?: string;
  onMarkFulfilled: (id: string) => void;
  onContact: (uid: string) => void;
  timeAgo: (d: string) => string;
}) {
  const isOwner = currentUserId === item.requester_id;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
      item.status === 'fulfilled' ? 'border-emerald-200 opacity-75' : 'border-gray-100'
    }`}>
      <div className="p-5">
        {/* Status badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            item.status === 'fulfilled'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {item.status === 'fulfilled' ? (
              <><CheckCircle className="w-3 h-3" /> Fulfilled</>
            ) : (
              <><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Open</>
            )}
          </span>
          <span className="text-xs text-gray-400">{timeAgo(item.created_at)}</span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
        {item.description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            {item.category}
          </span>
          {item.budget > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              Budget: ৳{item.budget}
            </span>
          )}
        </div>

        {/* Requester */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-xs font-bold">
            {item.requester?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <span className="text-sm text-gray-600">{item.requester?.full_name ?? 'Unknown'}</span>
        </div>

        {/* Actions */}
        {item.status === 'open' && (
          <div className="flex gap-2">
            {isOwner ? (
              <button
                onClick={() => onMarkFulfilled(item.id)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-200 text-emerald-700 py-2 rounded-lg text-xs font-medium hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark Fulfilled
              </button>
            ) : currentUserId ? (
              <button
                onClick={() => onContact(item.requester_id)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                I Have This!
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
