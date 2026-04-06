import { supabase } from '../lib/supabase';

export const profileService = {
  // 1. Lấy thông tin chi tiết hồ sơ (Join với bảng roles để lấy tên chức vụ)
  getProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, fullName, email, phone, address, avatar_url, role,
          role_info:roles(name, description)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 2. Cập nhật thông tin cơ bản
  updateProfile: async (userId: string, payload: any) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          fullName: payload.name,
          phone: payload.phone,
          address: payload.address,
          avatar_url: payload.avatar
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 3. Đổi mật khẩu tài khoản
  updatePassword: async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};