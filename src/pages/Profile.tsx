import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ProtectedRoute from '../components/layout/ProtectedRoute';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    whatsapp_number: profile?.whatsapp_number || '',
    expertise: profile?.expertise?.join(', ') || '',
  });

  const set = (field: string) => (e: any) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      bio: form.bio,
      whatsapp_number: form.whatsapp_number,
      expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean),
    }).eq('id', profile!.id);
    if (error) setError(error.message);
    else { setSuccess('Profile saved!'); await refreshProfile(); }
    setSaving(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-8">
          <button onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-white rounded-xl border border-gray-100 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile?.full_name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">{profile?.role}</span>
              </div>
            </div>

            {error && <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>{error}</div>}
            {success && <div className="flex gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-800 text-sm"><CheckCircle className="w-4 h-4 shrink-0 mt-0.5"/>{success}</div>}

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={form.full_name} onChange={set('full_name')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="text" value={profile?.email || ''} disabled
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input type="text" value={form.whatsapp_number} onChange={set('whatsapp_number')}
                  placeholder="+8801XXXXXXXXX"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-1">Used for buyers to contact you directly.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={form.bio} onChange={set('bio')} rows={3}
                  placeholder="Tell others about yourself..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expertise (comma separated)</label>
                <input type="text" value={form.expertise} onChange={set('expertise')}
                  placeholder="e.g., Math, Physics, Programming"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}