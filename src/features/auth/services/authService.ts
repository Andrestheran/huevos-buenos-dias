import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends LoginCredentials {
  fullName: string;
  role?: 'admin' | 'worker';
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Sign in with email and password
   */
  async login({ email, password }: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Fetch user profile
    if (data.user) {
      const profile = await this.getProfile(data.user.id);
      return { user: data.user, profile };
    }

    return { user: data.user, profile: null };
  },

  /**
   * Sign up new user (admin only in production)
   */
  async signUp({ email, password, fullName, role = 'worker' }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role
        }
      }
    });

    if (error) throw error;

    // Create profile
    if (data.user) {
      await this.createProfile({
        id: data.user.id,
        email,
        full_name: fullName,
        role
      });
    }

    return data;
  },

  /**
   * Sign out current user
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Get user profile from database
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Create user profile
   */
  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>) {
    const { error } = await supabase.from('profiles').insert(profile as any);

    if (error) throw error;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }
};
