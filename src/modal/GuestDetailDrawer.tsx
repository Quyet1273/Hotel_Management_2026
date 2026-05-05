import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  X,
  User,
  History,
  CreditCard,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { bookingService } from "../services/bookingService";
interface GuestDetailDrawerProps {
  guestId: string | null;
  onClose: () => void;
  onSave?: () => void; // Reload lại danh sách sau khi update
}

export function GuestDetailDrawer({
  guestId,
  onClose,
  onSave,
}: GuestDetailDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guest, setGuest] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!guestId) return;

    const fetchDetail = async () => {
      setLoading(true);
      const res = await bookingService.getGuestWithHistory(guestId);
      if (res.success) {
        setGuest(res.guest);
        setHistory(res.history || []);
        setTotalSpent(res.totalSpent || 0);
      } else {
        toast.error("Không thể tải thông tin khách hàng!");
        onClose();
      }
      setLoading(false);
    };

    fetchDetail();
  }, [guestId]);

  const handleUpdateGuest = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("guests")
        .update({
          full_name: guest.full_name,
          phone: guest.phone,
          id_number: guest.id_number,
          email: guest.email,
          address: guest.address,
          nationality: guest.nationality,
          notes: guest.notes, // Trường ghi chú thói quen mới thêm
        })
        .eq("id", guestId);

      if (error) throw error;
      toast.success("Cập nhật thông tin thành công!");
      if (onSave) onSave();
    } catch (error: any) {
      toast.error(`Lỗi cập nhật: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "---";
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "checked_out":
        return (
          <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-[10px] font-black uppercase">
            <CheckCircle2 size={12} /> Hoàn thành
          </span>
        );
      case "checked_in":
        return (
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-[10px] font-black uppercase">
            <Clock size={12} /> Đang ở
          </span>
        );
      case "confirmed":
        return (
          <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-[10px] font-black uppercase">
            <Clock size={12} /> Đã đặt
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-[10px] font-black uppercase">
            <XCircle size={12} /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-md text-[10px] font-black uppercase">
            {status}
          </span>
        );
    }
  };

  if (!guestId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end backdrop-blur-sm transition-all">
      {/* Khung Drawer - Rộng max-w-3xl, cao full màn hình */}
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-white/20">
        {/* 1. HEADER */}
        <div className="bg-blue-600 text-white p-5 px-8 flex items-center justify-between shadow-md">
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest">
              Hồ sơ khách hàng
            </h2>
            <p className="text-blue-200 text-xs mt-1">
              Mã KH: {guestId.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gray-50/30">
            {/* GRID LAYOUT: Định danh (trái) - Dữ liệu mở rộng (phải) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* SECTION: THÔNG TIN ĐỊNH DANH (Chiếm 2 cột) */}
              <section className="md:col-span-2 space-y-4 bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 border-b pb-2">
                  <User size={20} className="font-bold" />
                  <h3 className="font-black text-sm uppercase tracking-wider">
                    Thông tin cá nhân
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Họ và tên *
                    </label>
                    <input
                      className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                      value={guest.full_name || ""}
                      onChange={(e) =>
                        setGuest({ ...guest, full_name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Số điện thoại *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        className="w-full mt-1 pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                        value={guest.phone || ""}
                        onChange={(e) =>
                          setGuest({ ...guest, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      CCCD / Passport *
                    </label>
                    <input
                      className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                      value={guest.id_number || ""}
                      onChange={(e) =>
                        setGuest({ ...guest, id_number: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        className="w-full mt-1 pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                        value={guest.email || ""}
                        onChange={(e) =>
                          setGuest({ ...guest, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Quốc tịch
                    </label>
                    <input
                      className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                      value={guest.nationality || ""}
                      onChange={(e) =>
                        setGuest({ ...guest, nationality: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Địa chỉ
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        className="w-full mt-1 pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                        value={guest.address || ""}
                        onChange={(e) =>
                          setGuest({ ...guest, address: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION: TỔNG QUAN & DỮ LIỆU MỞ RỘNG (Chiếm 1 cột) */}
              <section className="space-y-4 flex flex-col h-full">
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-[1.5rem] text-blue-700">
                  <div className="flex items-center gap-2 mb-4 opacity-80">
                    <CreditCard size={20} />
                    <h3 className="font-black text-xs uppercase tracking-wider">
                      Tổng chi tiêu
                    </h3>
                  </div>
                  <p className="text-3xl font-black text-blue-600">
                    {totalSpent.toLocaleString()}đ
                  </p>
                  <p className="text-xs mt-2 text-blue-500 font-medium">
                    Tổng số lượt đặt: {history.length} lần
                  </p>
                </div>

                <div className="bg-orange-50/50 p-5 rounded-[1.5rem] border border-orange-100 flex-1 flex flex-col">
                  <label className="text-[10px] font-black text-orange-700 uppercase ml-1 mb-2 block">
                    Ghi chú đặc biệt / Thói quen
                  </label>
                  <textarea
                    className="w-full flex-1 min-h-[100px] p-3 border-2 border-orange-200 rounded-xl outline-none focus:border-orange-500 font-medium text-sm text-gray-700 bg-white resize-none"
                    placeholder="VD: Khách hay yêu cầu thêm gối, thích phòng tầng cao..."
                    value={guest.notes || ""}
                    onChange={(e) =>
                      setGuest({ ...guest, notes: e.target.value })
                    }
                  />
                </div>
              </section>
            </div>

            {/* SECTION: LỊCH SỬ LƯU TRÚ */}
            <section className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <History size={20} className="font-bold" />
                  <h3 className="font-black text-sm uppercase tracking-wider">
                    Lịch sử lưu trú
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-100">
                      <th className="p-3 text-[10px] uppercase font-black text-gray-400 whitespace-nowrap">
                        Mã Đặt / Phòng
                      </th>
                      <th className="p-3 text-[10px] uppercase font-black text-gray-400 whitespace-nowrap">
                        Nhận - Trả phòng
                      </th>
                      <th className="p-3 text-[10px] uppercase font-black text-gray-400 whitespace-nowrap text-right">
                        Tổng hóa đơn
                      </th>
                      <th className="p-3 text-[10px] uppercase font-black text-gray-400 whitespace-nowrap text-center">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length > 0 ? (
                      history.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="p-3">
                            <p className="font-bold text-sm text-gray-800">
                              Phòng {booking.rooms?.room_number}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              #{booking.id.slice(0, 6).toUpperCase()}
                            </p>
                          </td>
                          <td className="p-3">
                            <p className="text-xs font-bold text-gray-600">
                              {formatTime(booking.check_in_date)}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Đến {formatTime(booking.check_out_date)}
                            </p>
                          </td>
                          <td className="p-3 text-right">
                            <p className="text-sm font-black text-blue-600">
                              {Number(booking.total_amount).toLocaleString()}đ
                            </p>
                          </td>
                          <td className="p-3 text-center flex justify-center">
                            {getStatusBadge(booking.status)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-gray-400 font-medium text-sm"
                        >
                          Khách hàng này chưa có lịch sử đặt phòng.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* 3. FOOTER */}
        <div className="p-5 px-8 border-t bg-white flex gap-4 mt-auto">
          <button
            onClick={handleUpdateGuest}
            disabled={loading || saving}
            className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-black text-sm uppercase hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Lưu Thông Tin"
            )}
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase hover:bg-gray-200 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
