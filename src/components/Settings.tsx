import React, { useState, useEffect } from 'react';
import { Bell, Globe, Lock, Palette, Save, Moon, Sun, Volume2, Check, ChevronRight } from 'lucide-react';

// --- 1. Định nghĩa các Kiểu dữ liệu (Interfaces) ---
interface NotificationSettings {
  email: boolean;
  push: boolean;
  bookingAlerts: boolean;
  paymentAlerts: boolean;
}

interface SettingsState {
  language: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  notifications: NotificationSettings;
  sound: boolean;
  autoLogout: string;
}

interface ToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
}

// --- 2. Component nhỏ: Toggle Switch (Đã fix lỗi TS) ---
const Toggle: React.FC<ToggleProps> = ({ enabled, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={enabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer 
      peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
      after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
      after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
      peer-checked:bg-blue-600">
    </div>
  </label>
);

// --- 3. Component chính: Settings ---
export function Settings() {
  // Khởi tạo state từ LocalStorage
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('app-settings');
    return saved ? JSON.parse(saved) : {
      language: 'vi',
      theme: 'light',
      primaryColor: 'blue',
      fontSize: 'medium',
      notifications: {
        email: true,
        push: true,
        bookingAlerts: true,
        paymentAlerts: true,
      },
      sound: true,
      autoLogout: '30',
    };
  });

  // Xử lý Dark Mode toàn trang
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Hàm cập nhật Notification (Đã fix lỗi TS)
  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    alert('Cài đặt đã được lưu thành công!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cài Đặt Chung */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cài Đặt Chung</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ngôn ngữ</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Giao diện (Theme)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    settings.theme === 'light'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Sun className="w-5 h-5" /> <span className="font-medium">Sáng</span>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Moon className="w-5 h-5" /> <span className="font-medium">Tối</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thông Báo */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thông Báo</h3>
          </div>

          <div className="space-y-4">
            {[
              { id: 'email', label: 'Thông báo Email', sub: 'Nhận báo cáo qua mail cá nhân' },
              { id: 'push', label: 'Thông báo đẩy', sub: 'Nhận trên trình duyệt web' },
              { id: 'bookingAlerts', label: 'Đặt phòng', sub: 'Cảnh báo khi có khách mới' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.sub}</p>
                </div>
                <Toggle
                  enabled={settings.notifications[item.id as keyof NotificationSettings]}
                  onChange={(val) => updateNotification(item.id as keyof NotificationSettings, val)}
                />
              </div>
            ))}
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mt-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white">Âm thanh</p>
              </div>
              <Toggle enabled={settings.sound} onChange={(val) => setSettings({...settings, sound: val})} />
            </div>
          </div>
        </div>

        {/* Bảo Mật */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bảo Mật</h3>
          </div>
          <div className="space-y-3">
            {['Đổi mật khẩu', 'Xác thực 2 bước', 'Thiết bị đăng nhập'].map((item) => (
              <button key={item} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group">
                <span className="font-medium text-gray-900 dark:text-gray-200">{item}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Cá nhân hóa */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Giao Diện</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Màu chủ đạo</label>
              <div className="flex flex-wrap gap-3">
                {['blue', 'purple', 'green', 'red', 'orange'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSettings({...settings, primaryColor: color})}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm
                      ${settings.primaryColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                    style={{ backgroundColor: color }}
                  >
                    {settings.primaryColor === color && <Check className="w-5 h-5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 font-bold"
        >
          <Save className="w-5 h-5" />
          Lưu Tất Cả Thay Đổi
        </button>
      </div>
    </div>
  );
}