import { supabase } from '../lib/supabase';

// Định nghĩa Interface chuẩn theo Database của bạn
export interface Service {
  id?: string;
  created_at?: string;
  name: string;
  category: 'food' | 'laundry' | 'spa' | 'other';
  price: number;
  unit: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

export const serviceService = {
  // Lấy danh sách dịch vụ
  async getAllServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      // .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Service[];
  },

  // Thêm mới dịch vụ
  async createService(service: Omit<Service, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select()
      .single();

    if (error) throw error;
    return data as Service;
  },

  // Cập nhật dịch vụ
  async updateService(id: string, updates: Partial<Service>) {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Service;
  },

  // Xóa dịch vụ
  async deleteService(id: string) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Toggle trạng thái kích hoạt (is_active)
  async toggleActiveStatus(id: string, currentStatus: boolean) {
    const { data, error } = await supabase
      .from('services')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Service;
  }
};