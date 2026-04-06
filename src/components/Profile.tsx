import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Edit } from 'lucide-react';
import { authService } from '../services/authService'; // Nhớ sửa đường dẫn này cho khớp với project của bạn

// Định nghĩa Interface cho dữ liệu Profile
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  phone: string;
  address: string;
  position: string;
}

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
  });

  // 1. Fetch dữ liệu thật từ Supabase khi vừa vào trang
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setProfile(currentUser as UserProfile);
          setFormData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            address: currentUser.address || '',
            position: currentUser.position || 'Nhân viên',
            department: currentUser.role === 'admin' ? 'Ban Giám Đốc' : 'Khối Vận Hành', // Tạm map phòng ban theo role
          });
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. Xử lý Upload Avatar thật lên Supabase Storage
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    try {
      setMessage({ type: 'info', text: 'Đang tải ảnh lên...' });
      const res = await authService.uploadAvatar(profile.id, file);
      
      if (res.success && res.url) {
        // Cập nhật state ngay lập tức khi có URL mới từ Supabase
        setProfile((prev) => prev ? { ...prev, avatar: res.url as string } : null);
        setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
        
        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: res.error || 'Lỗi tải ảnh lên.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi upload ảnh.' });
    }
  };

  // 3. Xử lý Lưu thông tin thật vào Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setMessage({ type: 'info', text: 'Đang lưu thông tin...' });

    // Sử dụng hàm updateProfile (Tôi đã gợi ý ở lần trước)
    const res = await authService.updateProfile(profile.id, {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
    });

    if (res.success) {
      // Cập nhật lại Profile state để UI đồng bộ
      setProfile({
        ...profile,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });
      setMessage({ type: 'success', text: 'Lưu thay đổi thành công!' });
      setIsEditing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: res.error || 'Cập nhật thất bại.' });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center text-gray-500 mt-10">Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Hiển thị thông báo (Toast) */}
      {message.text && (
        <div className={`p-4 rounded-xl shadow-sm text-sm font-medium transition-all ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-blue-400 to-cyan-300 relative">
          <div className="absolute inset-0 bg-blue-50/30"></div>
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8">
          <div className="flex items-start gap-6 -mt-16 relative">
            {/* Avatar */}
            <div className="relative group shrink-0">
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl bg-white"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-xl">
                  <span className="text-5xl font-bold">{profile.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={!isEditing} // Chỉ cho đổi ảnh khi bật chế độ Edit
                className="hidden"
              />
              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-50 transition-colors border border-gray-200 cursor-pointer group-hover:scale-110 group-hover:shadow-xl z-10"
                >
                  <Camera className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                </label>
              )}
            </div>

            {/* User Info & Actions */}
            <div className="flex-1 pt-16">
              <div className="flex flex-wrap gap-4 items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-gray-600 mt-1">{formData.position}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {formData.department}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Đang hoạt động
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30 transition-all duration-200 hover:shadow-xl hover:scale-105 font-medium shrink-0"
                >
                  <Edit className="w-5 h-5" />
                  {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông Tin Cá Nhân</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                      required
                    />
                  </div>
                </div>

                {/* Email (Disabled vì không được đổi) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30 transition-all duration-200 hover:shadow-xl font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form về dữ liệu cũ nếu hủy
                      setFormData({
                        ...formData,
                        name: profile.name,
                        phone: profile.phone,
                        address: profile.address,
                      });
                    }}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-70"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Side Info */}
        <div className="space-y-6">
          {/* Stats - Dữ liệu tĩnh chờ API */}
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống Kê Khách Sạn</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <span className="text-sm text-gray-600">Tổng đặt phòng</span>
                <span className="text-xl font-bold text-blue-600">127</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <span className="text-sm text-gray-600">Khách đã phục vụ</span>
                <span className="text-xl font-bold text-green-600">89</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <span className="text-sm text-gray-600">Đánh giá trung bình</span>
                <span className="text-xl font-bold text-purple-600">4.8</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 italic text-center">*Số liệu thống kê tạm thời chưa kết nối API</p>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Khác</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quyền hạn</span>
                <span className="text-gray-900 font-medium uppercase">{profile.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mã nhân viên (ID)</span>
                <span className="text-gray-900 font-medium">NV-{profile.id.substring(0, 4).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trạng thái</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Đang hoạt động
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}