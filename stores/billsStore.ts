import { create } from 'zustand';
import { Bill, DashboardStats } from '../types';
import { supabase, getSupabaseClient } from '../lib/supabase';

interface BillsState {
  bills: Bill[];
  isLoading: boolean;
  error: string | null;
  clerkToken: string | null;
  setClerkToken: (token: string | null) => void;
  fetchBills: (userId: string) => Promise<void>;
  addBill: (bill: Omit<Bill, 'id' | 'created_at' | 'updated_at'>) => Promise<Bill | null>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  getDashboardStats: () => DashboardStats;
}

export const useBillsStore = create<BillsState>((set, get) => ({
  bills: [],
  isLoading: false,
  error: null,
  clerkToken: null,

  setClerkToken: (token) => set({ clerkToken: token }),

  fetchBills: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = get().clerkToken;
      const client = token ? getSupabaseClient(token) : supabase;
      const { data, error } = await client
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ bills: data || [] });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addBill: async (bill) => {
    try {
      const token = get().clerkToken;
      const client = token ? getSupabaseClient(token) : supabase;
      const { data, error } = await client
        .from('bills')
        .insert(bill)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ bills: [data, ...state.bills] }));
      return data;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  updateBill: async (id, updates) => {
    try {
      const token = get().clerkToken;
      const client = token ? getSupabaseClient(token) : supabase;
      const { error } = await client
        .from('bills')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        bills: state.bills.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  deleteBill: async (id) => {
    try {
      const token = get().clerkToken;
      const client = token ? getSupabaseClient(token) : supabase;
      const { error } = await client.from('bills').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ bills: state.bills.filter((b) => b.id !== id) }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  getDashboardStats: () => {
    const { bills } = get();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let activeReminders = 0;
    let expiringSoon = 0;
    let expired = 0;

    for (const bill of bills) {
      const dates = [bill.warranty_expiry, bill.amc_renewal_date, bill.service_due_date].filter(Boolean);
      for (const d of dates) {
        const date = new Date(d!);
        if (date < now) {
          expired++;
        } else if (date <= thirtyDaysFromNow) {
          expiringSoon++;
          activeReminders++;
        } else {
          activeReminders++;
        }
      }
    }

    return {
      totalBills: bills.length,
      activeReminders,
      expiringSoon,
      expired,
    };
  },
}));
