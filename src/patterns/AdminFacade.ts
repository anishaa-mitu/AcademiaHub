import { supabase } from '../lib/supabase';
import { Material, TutorRequest, Profile } from '../types';
import { MaterialFacade } from './MaterialFacade';
import { notificationBus } from './NotificationObserver';

// ── AdminFacade ────────────────────────────────────────────────────────────────
// Facade Pattern — groups every admin DB operation behind one clean interface.
// Components call AdminFacade methods; they never touch supabase directly for
// admin actions. This keeps all privilege-requiring logic in one place and makes
// it easy to audit / test.
// ──────────────────────────────────────────────────────────────────────────────

export const AdminFacade = {

  // ── Materials ──────────────────────────────────────────────────────────────

  async fetchPendingMaterials(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*, seller:profiles(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as Material[];
  },

  async fetchAllMaterials(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*, seller:profiles(*)')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as Material[];
  },

  async approveMaterial(materialId: string): Promise<string | null> {
    // Delegate to MaterialFacade so the Observer notification logic is reused
    const { data: allUsers } = await supabase.from('profiles').select('id');
    const ids = (allUsers ?? []).map((u: { id: string }) => u.id);
    const { error } = await MaterialFacade.approveMaterial(materialId, ids);
    return error;
  },

  async rejectMaterial(materialId: string): Promise<string | null> {
    const { error } = await MaterialFacade.rejectMaterial(materialId);
    return error;
  },

  // ── Tutor Requests ─────────────────────────────────────────────────────────

  async fetchTutorRequests(): Promise<TutorRequest[]> {
    const { data, error } = await supabase
      .from('tutor_requests')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as TutorRequest[];
  },

  async approveTutorRequest(requestId: string, userId: string): Promise<string | null> {
    // 1. Mark the request approved
    const { error: reqErr } = await supabase
      .from('tutor_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);
    if (reqErr) return reqErr.message;

    // 2. Promote the user's role to 'tutor' in profiles
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ role: 'tutor' })
      .eq('id', userId);
    if (profileErr) return profileErr.message;

    // 3. Observer Pattern — fire notification so the user is informed
    notificationBus.notify({
      event: 'tutor_approved',
      title: 'Tutor Application Approved',
      body: 'Congratulations! You are now a verified tutor on AcademiaHub.',
      link: '/tutors',
      targetUserId: userId,
    });

    // 4. Persist notification to DB
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Tutor Application Approved',
      body: 'Congratulations! You are now a verified tutor on AcademiaHub.',
      type: 'tutor_approved',
      link: '/tutors',
    });

    return null;
  },

  async rejectTutorRequest(
    requestId: string,
    userId: string,
    adminNote: string
  ): Promise<string | null> {
    const { error } = await supabase
      .from('tutor_requests')
      .update({ status: 'rejected', admin_note: adminNote })
      .eq('id', requestId);
    if (error) return error.message;

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Tutor Application Not Approved',
      body: adminNote || 'Your tutor application was not approved at this time.',
      type: 'general',
      link: '/dashboard',
    });

    return null;
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  async fetchAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as Profile[];
  },

  async setUserRole(userId: string, role: 'student' | 'tutor' | 'admin'): Promise<string | null> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    return error ? error.message : null;
  },

  async toggleUserActive(userId: string, isActive: boolean): Promise<string | null> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    return error ? error.message : null;
  },
};