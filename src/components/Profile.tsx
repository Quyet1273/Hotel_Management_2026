import { useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Edit, Upload } from 'lucide-react';

interface ProfileProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  onUpdateUser: (user: { name: string; email: string; avatar: string }) => void;
}

export function Profile({ user, onUpdateUser }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(user.avatar);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: '+84 123 456 789',
    address: 'Hà Nội, Việt Nam',
    position: 'Quản lý khách sạn',
    department: 'Quản lý',
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result as string;
        setCurrentAvatar(newAvatar);
        // Update immediately
        onUpdateUser({
          name: formData.name,
          email: formData.email,
          avatar: newAvatar,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name: formData.name,
      email: formData.email,
      avatar: currentAvatar,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
            <div className="relative group">
              {currentAvatar ? (
                <img 
                  src={currentAvatar} 
                  alt={user.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-xl">
                  <span className="text-5xl font-bold">{user.name.charAt(0)}</span>
                </div>
              )}
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-50 transition-colors border border-gray-200 cursor-pointer group-hover:scale-110 group-hover:shadow-xl"
              >
                <Camera className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </label>
            </div>

            {/* User Info & Actions */}
            <div className="flex-1 pt-16">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-600 mt-1">{formData.position}</p>
                  <div className="flex items-center gap-4 mt-2">
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
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30 transition-all duration-200 hover:shadow-xl hover:scale-105 font-medium"
                >
                  <Edit className="w-5 h-5" />
                  {isEditing ? 'Hủy' : 'Chỉnh sửa'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
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
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30 transition-all duration-200 hover:shadow-xl font-medium"
                  >
                    <Save className="w-5 h-5" />
                    Lưu thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
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
          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống Kê</h3>
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
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Khác</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ngày tham gia</span>
                <span className="text-gray-900 font-medium">01/01/2024</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mã nhân viên</span>
                <span className="text-gray-900 font-medium">NV001</span>
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