import { supabase } from '../lib/supabase';

// ── PasswordResetFacade ────────────────────────────────────────────────────────
// Facade Pattern — wraps the two-step Supabase password-reset flow
// (request email → update password) behind a single clean interface so
// components never import supabase directly for auth operations.
// ──────────────────────────────────────────────────────────────────────────────

export const PasswordResetFacade = {
  /**
   * Step 1 — send a magic reset link to the user's email.
   * Supabase sends the link; the user clicks it and lands on /reset-password
   * with an access token embedded in the URL hash.
   */
  async sendResetEmail(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  /**
   * Step 2 — called from the /reset-password page after Supabase has parsed
   * the token from the URL and established a session. Updates the password.
   */
  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  },
};