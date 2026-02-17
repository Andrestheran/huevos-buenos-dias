import { supabase, type ProductionRecord } from '@/lib/supabase';
import type { ProductionRecordCreate, BarnType } from '../types';

/**
 * Production records service
 */
export const productionService = {
  /**
   * Create a new production record
   */
  async createRecord(record: ProductionRecordCreate): Promise<ProductionRecord> {
    const { data, error } = await supabase
      .from('production_records')
      .insert(record as any)
      .select()
      .single();

    if (error) {
      // Handle duplicate entry error
      if (error.code === '23505') {
        throw new Error('Ya registraste la producción para este gallinero hoy');
      }
      throw error;
    }

    return data;
  },

  /**
   * Get records for current user
   */
  async getMyRecords(userId: string, limit: number = 50): Promise<ProductionRecord[]> {
    const { data, error } = await supabase
      .from('production_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  },

  /**
   * Get all records (admin only)
   */
  async getAllRecords(
    filters?: {
      startDate?: string;
      endDate?: string;
      userId?: string;
      barn?: BarnType;
    },
    limit: number = 100
  ): Promise<ProductionRecord[]> {
    // Get production records
    let query = supabase
      .from('production_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.barn) {
      query = query.eq('barn', filters.barn);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  },

  /**
   * Check if user can submit for barn today
   */
  async canSubmitToday(userId: string, barn: BarnType): Promise<boolean> {
    const { data, error } = await supabase.rpc('can_submit_today', {
      check_user_id: userId,
      check_barn: barn
    } as any);

    if (error) throw error;

    return data;
  },

  /**
   * Get production statistics
   */
  async getProductionStats(
    startDate: string,
    endDate: string,
    filters?: {
      barn?: BarnType;
      userId?: string;
    }
  ) {
    const { data, error } = await supabase.rpc('get_production_stats', {
      start_date: startDate,
      end_date: endDate,
      filter_barn: filters?.barn || null,
      filter_user: filters?.userId || null
    } as any);

    if (error) throw error;

    return data || [];
  },

  /**
   * Get daily production summary
   */
  async getDailySummary(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_production_summary')
      .select('*')
      .gte('production_date', startDate.toISOString())
      .order('production_date', { ascending: false });

    if (error) throw error;

    return data || [];
  },

  /**
   * Get worker performance summary
   */
  async getWorkerPerformance() {
    const { data, error } = await supabase.from('worker_performance').select('*');

    if (error) throw error;

    return data || [];
  },

  /**
   * Update record (admin only)
   */
  async updateRecord(
    recordId: string,
    updates: Partial<ProductionRecord>
  ): Promise<ProductionRecord> {
    const { data, error } = await (supabase
      .from('production_records')
      .update as any)(updates)
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Delete record (admin only)
   */
  async deleteRecord(recordId: string): Promise<void> {
    const { error } = await supabase.from('production_records').delete().eq('id', recordId);

    if (error) throw error;
  }
};
