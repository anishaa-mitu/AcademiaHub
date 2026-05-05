import { useState, useEffect } from 'react';
import {
  Search, GraduationCap, Star, Clock,
  Plus, Loader, Filter, Phone, X, ChevronDown, BookOpen, Trash2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TutorSession } from '../types';

// ── Design Patterns ────────────────────────────────────────────
import { tutorTopicSearch } from '../patterns/SearchStrategy';     // Strategy
import { whatsAppAdapter } from '../patterns/WhatsAppAdapter';     // Adapter
import { UserFactory } from '../patterns/UserFactory';             // Factory
import { notificationBus } from '../patterns/NotificationObserver'; // Observer

import { useAuth } from '../context/AuthContext';

// ── TutorFacade — Facade Pattern ───────────────────────────────
const TutorFacade = {
  async fetchApproved(): Promise<TutorSession[]> {
    const { data, error } = await supabase
      .from('tutor_sessions')
      .select(`*, tutor:profiles!tutor_sessions_tutor_id_fkey(id, full_name, email, bio, expertise, whatsapp_number, role)`)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) console.error('fetchApproved error:', error.message);
    return (data as TutorSession[]) ?? [];
  },

  async postSession(payload: {
    tutor_id: string;
    title: string;
    description: string;
    topics: string[];
    hourly_rate: number;
    availability: string;
  }): Promise<string | null> {
    const { error } = await supabase
      .from('tutor_sessions')
      .insert({ ...payload, status: 'pending' });
    return error ? error.message : null;
  },

  async deleteSession(sessionId: string): Promise<string | null> {
    const { error } = await supabase
      .from('tutor_sessions')
      .delete()
      .eq('id', sessionId);
    return error ? error.message : null;
  },

  async submitApplication(payload: {
    user_id: string;
    bio: string;
    expertise: string[];
    whatsapp_number: string;
  }): Promise<string | null> {
    const { error } = await supabase
      .from('tutor_requests')
      .insert({ ...payload, status: 'pending' });
    if (error) return error.message;
    await supabase
      .from('profiles')
      .update({
        bio: payload.bio,
        expertise: payload.expertise,
        whatsapp_number: payload.whatsapp_number,
      })
      .eq('id', payload.user_id);
    return null;
  },
};

// ── Page ───────────────────────────────────────────────────────
export default function Tutors() {
  const { user, profile, refreshProfile } = useAuth();

  // Factory Pattern — permissions derived from role
  const permissions = UserFactory.getPermissions(profile);

  const [sessions, setSessions]             = useState<TutorSession[]>([]);
  const [filtered, setFiltered]             = useState<TutorSession[]>([]);
  const [loading, setLoading]               = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [showFilters, setShowFilters]       = useState(false);
  const [maxRate, setMaxRate]               = useState<number | ''>('');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showApplyModal, setShowApplyModal]     = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: '', description: '', topics: '', hourly_rate: '', availability: '',
  });
  const [applyForm, setApplyForm] = useState({
    bio: '', expertise: '', whatsapp_number: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState('');

  useEffect(() => { load(); }, []);

  // Strategy Pattern — re-filter whenever sessions, query or maxRate changes
  useEffect(() => {
    let result = tutorTopicSearch.execute(sessions, searchQuery);
    if (maxRate !== '') result = result.filter(s => s.hourly_rate <= Number(maxRate));
    setFiltered(result);
  }, [sessions, searchQuery, maxRate]);

  const load = async () => {
    setLoading(true);
    setSessions(await TutorFacade.fetchApproved());
    setLoading(false);
  };

  const handlePostSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true); setSubmitMsg('');
    const err = await TutorFacade.postSession({
      tutor_id:     user.id,
      title:        sessionForm.title,
      description:  sessionForm.description,
      topics:       sessionForm.topics.split(',').map(t => t.trim()).filter(Boolean),
      hourly_rate:  parseFloat(sessionForm.hourly_rate) || 0,
      availability: sessionForm.availability,
    });
    if (err) {
      setSubmitMsg('Error: ' + err);
    } else {
      // Observer Pattern — notify the bus
      notificationBus.notify({
        event: 'general',
        title: 'Session Submitted',
        body: `Your session "${sessionForm.title}" is pending approval.`,
        link: '/dashboard',
        targetUserId: user.id,
      });
      setSubmitMsg('Session submitted! Admin will approve shortly.');
      setSessionForm({ title: '', description: '', topics: '', hourly_rate: '', availability: '' });
      load();
      setTimeout(() => { setShowSessionModal(false); setSubmitMsg(''); }, 2500);
    }
    setSubmitting(false);
  };

  const handleApplyAsTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true); setSubmitMsg('');
    const expertiseArr = applyForm.expertise.split(',').map(t => t.trim()).filter(Boolean);
    const err = await TutorFacade.submitApplication({
      user_id: user.id,
      bio: applyForm.bio,
      expertise: expertiseArr,
      whatsapp_number: applyForm.whatsapp_number,
    });
    if (err) {
      setSubmitMsg('Error: ' + err);
    } else {
      // Observer Pattern
      notificationBus.notify({
        event: 'tutor_approved',
        title: 'New Tutor Application',
        body: 'A new tutor application is waiting for review.',
        link: '/admin',
        targetUserId: user.id,
      });
      await refreshProfile();
      setSubmitMsg('Application submitted! Admin will review within 24 hours.');
      setApplyForm({ bio: '', expertise: '', whatsapp_number: '' });
      setTimeout(() => { setShowApplyModal(false); setSubmitMsg(''); }, 3000);
    }
    setSubmitting(false);
  };

  // Facade Pattern — delete session, then remove from local state
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session?')) return;
    const err = await TutorFacade.deleteSession(sessionId);
    if (!err) setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // Adapter Pattern — delegate to whatsAppAdapter
  const contactViaWhatsApp = (phone: string, name: string, title: string) => {
    whatsAppAdapter.sendMessage(
      `880${phone.replace(/^0/, '')}`,
      `Hi ${name}, I found your profile on AcademiaHub and I am interested in your "${title}" session.`
    );
  };

  // Factory Pattern — canOfferTutoring is true for tutor + admin
  const isTutor = permissions.canOfferTutoring;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Find a Tutor</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-xl mb-6">
            Connect with expert tutors for personalised help. Are you an expert? Join our tutor network!
          </p>

          <div className="flex gap-3 max-w-2xl flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by topic, name, subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl font-medium transition-colors"
            >
              <Filter className="w-4 h-4" /> Filter
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 flex gap-4 max-w-2xl items-center">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
                <label className="text-sm font-medium text-blue-100">Max Rate:</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={maxRate}
                  onChange={e => setMaxRate(e.target.value ? Number(e.target.value) : '')}
                  className="w-20 bg-transparent border-b border-blue-300 text-white text-sm focus:outline-none placeholder-blue-200"
                />
                <span className="text-blue-200 text-sm">৳/hr</span>
              </div>
              {maxRate !== '' && (
                <button onClick={() => setMaxRate('')} className="text-blue-200 hover:text-white text-sm underline">
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-gray-500 text-sm">
            {loading ? 'Loading tutors...' : `${filtered.length} session${filtered.length !== 1 ? 's' : ''} available`}
          </p>

          {/* Factory Pattern — button depends on role */}
          {isTutor ? (
            <button
              onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Post a Session
            </button>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              <GraduationCap className="w-4 h-4" /> Register as Tutor
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tutors found</h3>
            <p className="text-gray-500">Try a different search or clear your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(session => (
              <TutorCard
                key={session.id}
                session={session}
                currentUserId={user?.id}
                currentUserRole={profile?.role}
                onWhatsApp={() => contactViaWhatsApp(
                  session.tutor?.whatsapp_number ?? '',
                  session.tutor?.full_name ?? 'Tutor',
                  session.title,
                )}
                onDelete={() => handleDeleteSession(session.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal: Post a Session */}
      {showSessionModal && (
        <Modal title="Post a Tutor Session" onClose={() => setShowSessionModal(false)}>
          <form onSubmit={handlePostSession} className="space-y-4">
            <Field label="Title *">
              <input required value={sessionForm.title}
                onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Data Structures & Algorithms" className={inp} />
            </Field>
            <Field label="Description">
              <textarea rows={3} value={sessionForm.description}
                onChange={e => setSessionForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What will you teach? Your background..." className={inp} />
            </Field>
            <Field label="Topics (comma separated) *">
              <input required value={sessionForm.topics}
                onChange={e => setSessionForm(f => ({ ...f, topics: e.target.value }))}
                placeholder="e.g. C++, Sorting, Trees" className={inp} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hourly Rate (৳) *">
                <input required type="number" min="0" value={sessionForm.hourly_rate}
                  onChange={e => setSessionForm(f => ({ ...f, hourly_rate: e.target.value }))}
                  placeholder="500" className={inp} />
              </Field>
              <Field label="Availability">
                <input value={sessionForm.availability}
                  onChange={e => setSessionForm(f => ({ ...f, availability: e.target.value }))}
                  placeholder="e.g. Weekends 2-6pm" className={inp} />
              </Field>
            </div>
            <Msg text={submitMsg} />
            <Btns onCancel={() => setShowSessionModal(false)} submitting={submitting} label="Submit for Approval" />
          </form>
        </Modal>
      )}

      {/* Modal: Register as Tutor */}
      {showApplyModal && (
        <Modal title="Register as a Tutor" onClose={() => setShowApplyModal(false)}>
          <p className="text-sm text-gray-500 mb-4">
            Fill in your details. An admin will review and approve your profile, then you can post sessions.
          </p>
          <form onSubmit={handleApplyAsTutor} className="space-y-4">
            <Field label="Your Bio *">
              <textarea required rows={4} value={applyForm.bio}
                onChange={e => setApplyForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Describe your education, experience, and what you can teach..."
                className={inp} />
            </Field>
            <Field label="Areas of Expertise (comma separated) *">
              <input required value={applyForm.expertise}
                onChange={e => setApplyForm(f => ({ ...f, expertise: e.target.value }))}
                placeholder="e.g. Python, Machine Learning, Data Science" className={inp} />
            </Field>
            <Field label="WhatsApp Number *">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input required value={applyForm.whatsapp_number}
                  onChange={e => setApplyForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                  placeholder="01XXXXXXXXX" className={`${inp} pl-9`} />
              </div>
            </Field>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
              Your application will be reviewed within 24 hours. You will be notified once approved.
            </div>
            <Msg text={submitMsg} />
            <Btns onCancel={() => setShowApplyModal(false)} submitting={submitting} label="Submit Application" />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Shared primitives ──────────────────────────────────────────
const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Msg({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className={`text-sm font-medium ${text.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
      {text}
    </p>
  );
}

function Btns({ onCancel, submitting, label }: { onCancel: () => void; submitting: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" disabled={submitting}
        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {submitting ? 'Submitting...' : label}
      </button>
    </div>
  );
}

// ── TutorCard ──────────────────────────────────────────────────
const AVATAR_COLOURS = [
  'bg-blue-600', 'bg-indigo-600', 'bg-violet-600',
  'bg-emerald-600', 'bg-rose-600', 'bg-amber-600',
];

function TutorCard({ session, currentUserId, currentUserRole, onWhatsApp, onDelete }: {
  session: TutorSession;
  currentUserId?: string;
  currentUserRole?: string;
  onWhatsApp: () => void;
  onDelete: () => void;
}) {
  const hasWhatsApp = !!session.tutor?.whatsapp_number;
  const colourIdx   = (session.tutor?.full_name?.charCodeAt(0) ?? 65) % AVATAR_COLOURS.length;

  // Factory Pattern — only owner or admin can delete
  const canDelete = currentUserRole === 'admin' || currentUserId === session.tutor_id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 ${AVATAR_COLOURS[colourIdx]} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
            {session.tutor?.full_name?.charAt(0)?.toUpperCase() ?? 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 leading-tight">{session.tutor?.full_name ?? 'Tutor'}</h3>
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3 h-3 ${i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
              <span className="text-gray-400 text-xs ml-1">Verified</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-blue-700 font-bold text-xl leading-none">৳{session.hourly_rate}</p>
            <p className="text-gray-400 text-xs mt-0.5">/hr</p>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h4 className="font-semibold text-gray-900 mb-2 leading-snug">{session.title}</h4>
        {session.description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{session.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {session.topics.slice(0, 4).map(topic => (
            <span key={topic} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {topic}
            </span>
          ))}
          {session.topics.length > 4 && (
            <span className="text-gray-400 text-xs py-1">+{session.topics.length - 4} more</span>
          )}
        </div>

        {session.availability && (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{session.availability}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-auto">
          {/* Adapter Pattern — WhatsApp contact */}
          {hasWhatsApp && (
            <button
              onClick={onWhatsApp}
              className="w-full flex items-center justify-center gap-1.5 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Phone className="w-4 h-4" /> Contact via WhatsApp
            </button>
          )}

          {/* Factory Pattern — delete only for owner or admin */}
          {canDelete && (
            <button
              onClick={onDelete}
              className="w-full flex items-center justify-center gap-1.5 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors border border-red-100"
            >
              <Trash2 className="w-4 h-4" /> Delete Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}