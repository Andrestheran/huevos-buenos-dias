import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Database types (auto-generated via Supabase CLI: supabase gen types typescript)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'worker';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'admin' | 'worker';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'admin' | 'worker';
          created_at?: string;
          updated_at?: string;
        };
      };
      production_records: {
        Row: {
          id: string;
          user_id: string;
          barn: 'A' | 'B';
          a: number;
          aa: number;
          b: number;
          extra: number;
          jumbo: number;
          total: number;
          synced: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          barn: 'A' | 'B';
          a?: number;
          aa?: number;
          b?: number;
          extra?: number;
          jumbo?: number;
          synced?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          barn?: 'A' | 'B';
          a?: number;
          aa?: number;
          b?: number;
          extra?: number;
          jumbo?: number;
          synced?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      daily_production_summary: {
        Row: {
          production_date: string;
          barn: 'A' | 'B';
          record_count: number;
          total_a: number;
          total_aa: number;
          total_b: number;
          total_extra: number;
          total_jumbo: number;
          total_eggs: number;
        };
      };
      worker_performance: {
        Row: {
          user_id: string;
          full_name: string;
          total_submissions: number;
          total_eggs_recorded: number;
          avg_eggs_per_submission: number;
          last_submission: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      is_worker: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      can_submit_today: {
        Args: { check_user_id: string; check_barn: 'A' | 'B' };
        Returns: boolean;
      };
      get_production_stats: {
        Args: {
          start_date: string;
          end_date: string;
          filter_barn?: 'A' | 'B';
          filter_user?: string;
        };
        Returns: Array<{
          date: string;
          barn: 'A' | 'B';
          total_eggs: number;
          total_a: number;
          total_aa: number;
          total_b: number;
          total_extra: number;
          total_jumbo: number;
          record_count: number;
        }>;
      };
    };
  };
}

// Create Supabase client with type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// Export types for use in application
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProductionRecord = Database['public']['Tables']['production_records']['Row'];
export type ProductionRecordInsert = Database['public']['Tables']['production_records']['Insert'];
export type DailyProductionSummary = Database['public']['Views']['daily_production_summary']['Row'];
export type WorkerPerformance = Database['public']['Views']['worker_performance']['Row'];
