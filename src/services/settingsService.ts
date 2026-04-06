import { supabase } from '../lib/supabase';

// Export Interface để dùng chung cho cả UI
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  bookingAlerts: boolean;
  paymentAlerts: boolean;
}

export interface SettingsState {
  language: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  notifications: NotificationSettings;
  sound: boolean;
  autoLogout: string;
}

export const settingsService = {
  // 1. Lấy cài đặt của người dùng hiện tại
 // 1. Lấy cài đặt của người dùng hiện tại
  getUserSettings: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', userId)
        .maybeSingle(); // 👈 Thay .single() bằng .maybeSingle()

      if (error) throw error; // Không cần check mã PGRST116 nữa

      return { success: true, data: data?.settings as SettingsState || null };
    } catch (error: any) {
      console.error('Lỗi khi lấy Settings:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 2. Lưu hoặc Cập nhật cài đặt (Upsert)
  saveUserSettings: async (userId: string, settings: SettingsState) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          settings: settings, // Supabase sẽ tự động convert object này thành JSONB
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }); // Ghi đè nếu user_id đã tồn tại

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Lỗi khi lưu Settings:', error.message);
      return { success: false, error: error.message };
    }
  }
};