import React, { createContext, useContext, useState, useEffect } from 'react';

// Khai báo lại các interface để dùng chung
interface SettingsContextType {
  settings: any;
  updateSettings: (newSettings: any) => void;
  updateNotification: (key: string, value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('app-settings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      language: 'vi',
      primaryColor: 'blue',
      // ... các giá trị mặc định khác
    };
  });

  // Áp dụng Dark Mode và Màu chủ đạo lên toàn hệ thống
  useEffect(() => {
    // 1. Xử lý Dark Mode
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // 2. Xử lý màu chủ đạo (Dùng CSS Variable)
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    
    localStorage.setItem('app-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: any) => setSettings(newSettings);

  const updateNotification = (key: string, value: boolean) => {
    setSettings((prev: any) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateNotification }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook để các component khác gọi dùng cực nhanh
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};