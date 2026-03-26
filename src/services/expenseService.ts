import { supabase } from '../lib/supabase';

export const expenseService = {
  async getExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    return error ? { success: false, error: error.message } : { success: true, data };
  },

  async addExpense(expense: any) {
    const { data, error } = await supabase.from('expenses').insert([expense]);
    return error ? { success: false, error: error.message } : { success: true, data };
  }
};