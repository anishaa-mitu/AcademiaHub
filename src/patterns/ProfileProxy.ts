import { supabase } from '../lib/supabase';
import { Profile } from '../types';

// Proxy Pattern - caches profile fetches to avoid redundant DB calls
class ProfileService {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) return null;
    return data;
  }
}

class ProfileProxy {
  private service = new ProfileService();
  private cache = new Map<string, { profile: Profile; expiresAt: number }>();
  private TTL = 5 * 60 * 1000; // 5 minutes

  async getProfile(userId: string): Promise<Profile | null> {
    const cached = this.cache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.profile;
    }
    const profile = await this.service.getProfile(userId);
    if (profile) {
      this.cache.set(userId, { profile, expiresAt: Date.now() + this.TTL });
    }
    return profile;
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const profileProxy = new ProfileProxy();
