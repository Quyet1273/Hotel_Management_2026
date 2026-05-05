import { useState, useEffect } from "react";
import {
  X,
  Printer,
  CreditCard,
  DollarSign,
  Receipt,
  Bed,
  Calculator,
  Clock,
  User,
  ShieldCheck,
  Mail,
  Phone,
} from "lucide-react";
import { checkInOutService } from "../services/checkInOutService";
import { toast } from "sonner";

interface CheckoutModalProps {
  isOpen: boolean;
  bookingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({
  isOpen,
  bookingId,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [data, setData] = useState<any>(null);
  const [calc, setCalc] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [isVatInvoice, setIsVatInvoice] = useState(false); // Thêm state để quản lý hóa đơn VAT
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    taxCode: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "amount">(
    "percent",
  );

  useEffect(() => {
    if (isOpen) {
      setDiscount(0);
      setPaymentMethod("cash");
    } else {
      setData(null);
      setCalc(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!isOpen || !bookingId) return;
      if (data) setCalculating(true);
      else setLoading(true);
      const res = await checkInOutService.getInvoiceDetail(
        bookingId,
        discount,
        discountType,
      );
      if (res.success) {
        setData(res.data);
        setCalc(res.calculation);
      }
      setLoading(false);
      setCalculating(false);
    };
    fetchInvoice();
  }, [isOpen, bookingId, discount, discountType]);

  // LOGIC TÍNH TOÁN CHI TIẾT ĐỂ HIỂN THỊ VÀ GỬI LÊN SERVER
  const getBillBreakdown = () => {
    const room = Number(calc?.roomCharge) || 0;
    const service = Number(calc?.serviceCharge) || 0;
    const subTotal = room + service;

    // Thuế VAT 10%
    const tax = Math.round(subTotal * 0.1);

    // Tính giảm giá mặt định (số tiền mặt)
    const discountValue =
      discountType === "percent"
        ? Math.round(subTotal * (discount / 100))
        : discount;

    const deposit = Number(data?.deposit_amount) || 0;

    // PHÉP TÍNH CHUẨN: (Tiền phòng + Dịch vụ + Thuế) - Giảm giá - Cọc
    const finalAmount = subTotal + tax - discountValue - deposit;

    return {
      room,
      service,
      subTotal,
      tax,
      discountValue,
      deposit,
      finalAmount: finalAmount > 0 ? finalAmount : 0,
    };
  };

  const b = getBillBreakdown();
  const handlePrintInvoice = () => {
    // Logic mở cửa sổ in hóa đơn
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Template HTML hóa đơn (đại ca có thể tùy chỉnh thêm CSS cho đẹp)
    printWindow.document.write(`
      <html>
        <head><title>Hóa đơn thanh toán - HotelPro</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2 style="text-align: center;">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h2>
          <p>Khách hàng: ${data?.guests?.full_name || "Khách vãng lai"}</p>
          ${
            isVatInvoice
              ? `
            <div style="border: 1px solid #000; padding: 10px;">
              <p>Công ty: ${companyInfo.name}</p>
              <p>MST: ${companyInfo.taxCode}</p>
              <p>Địa chỉ: ${companyInfo.address}</p>
            </div>
          `
              : ""
          }
          <hr/>
          <p>Tổng tiền thanh toán: <strong>${b.finalAmount.toLocaleString()}đ</strong></p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const handleConfirmCheckout = async () => {
    // 1. Kiểm tra điều kiện đầu vào
    if (!data || !calc) {
      toast.error("Không tìm thấy dữ liệu thanh toán!");
      return;
    }

    setCalculating(true);

    try {
      // 2. Lấy dữ liệu tính toán chi tiết từ hàm breakdown
      const b = getBillBreakdown();

      // 3. Chuẩn bị object amounts khớp với Interface CheckoutAmounts ở Service
      const amounts = {
        roomTotal: b.room,
        serviceTotal: b.service,
        discountAmount: b.discountValue,
        taxTotal: b.tax, // Thuế VAT 10%
        grandTotal: b.subTotal, // Tổng tiền trước thuế
        actualReceived: b.finalAmount, // Con số thực thu cuối cùng
      };

      // 4. Gọi Service với đúng 4 tham số: booking, amounts, paymentMethod, vatInfo
      const res = await checkInOutService.confirmCheckOutMaster(
        data, // Dữ liệu gốc từ Supabase (chứa guests, rooms...)
        amounts, // Các con số tài chính
        paymentMethod, // 'cash' | 'card' | 'transfer'
        {
          // Object vatInfo truyền xuống để lưu hóa đơn đỏ
          isVatInvoice: isVatInvoice,
          name: companyInfo.name,
          taxCode: companyInfo.taxCode,
          address: companyInfo.address,
        },
      );

      // 5. Xử lý kết quả trả về
      if (res.success) {
        toast.success("Thanh toán & Xuất hóa đơn thành công!");

        // Gọi hàm in hóa đơn ngay lập tức nếu khách cần (Tùy chọn)
        // if (isVatInvoice) {
        //   handlePrintInvoice();
        // }

        onSuccess(); // Refresh lại danh sách phòng/booking ở trang chính
        onClose(); // Đóng modal
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast.error("Lỗi thanh toán: " + error.message);
      console.error("Checkout Error:", error);
    } finally {
      setCalculating(false);
    }
  };

  if (!isOpen) return null;

  if (loading && !data)
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2001] flex items-center justify-center">
        <div className="bg-white p-8 rounded-[2rem] flex items-center gap-4 shadow-2xl font-black text-blue-600">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          ĐANG TÍNH HÓA ĐƠN...
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      {/* STYLE ĐẶC TRỊ LỖI IN VÀ HIỂN THỊ QR */}
      <style
  dangerouslySetInnerHTML={{
    __html: `
      @media print {
        /* 1. Ép hiển thị vùng in */
        body * { visibility: hidden !important; }
        #printable-invoice, #printable-invoice * { visibility: visible !important; }
        
        #printable-invoice {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: auto !important;
          display: block !important;
          background: white !important;
        }

        /* 2. LỆNH QUAN TRỌNG: Ép in ảnh và màu sắc */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* 3. Đảm bảo ảnh QR không bị tàng hình */
        img {
          display: block !important;
          visibility: visible !important;
          max-width: 100% !important;
          height: auto !important;
        }

        /* Ẩn các thứ linh tinh */
        .no-print, button, .print\\:hidden { 
          display: none !important; 
        }
      }
    `,
  }}
/>

      <div
        id="printable-invoice"
        className="print:overflow-visible print:max-h-none w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 max-h-[95vh]"
      >
        {/* 1. HEADER HÓA ĐƠN */}
        <div className="bg-[#D1F4FA] p-8 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute no-print top-6 right-6 p-2 bg-white/50 text-blue-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
          >
            <X size={20} strokeWidth={3} />
          </button>
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                Hóa Đơn Thanh Toán
              </h2>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mt-1">
                Mã giao dịch: {data?.id?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* 2. THÂN HÓA ĐƠN (Scrollable trên UI, Auto-height khi in) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/30">
          {/* HỒ SƠ KHÁCH HÀNG */}
          <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-600 border-b border-blue-50 pb-3">
              <User size={16} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Thông tin khách hàng
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
              <p className="text-base font-black text-gray-800 leading-none">
                {data?.guests?.full_name}
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                <Phone size={14} className="text-blue-500" />{" "}
                {data?.guests?.phone}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                <ShieldCheck size={14} className="text-blue-500" /> CCCD:{" "}
                {data?.guests?.id_number || "---"}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                <Mail size={14} className="text-blue-500" />{" "}
                {data?.guests?.email || "Chưa cập nhật"}
              </div>
            </div>
          </section>

          {/* CHI TIẾT LƯU TRÚ */}
          <section className="space-y-4 px-4">
            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
              <span className="uppercase text-[10px] tracking-widest font-black text-gray-400">
                Số phòng:
              </span>
              <span className="font-black text-gray-800 uppercase italic">
                P.{data?.rooms?.room_number}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
              <span className="uppercase text-[10px] tracking-widest font-black text-gray-400">
                Thời gian nhận:
              </span>
              <div className="flex items-center gap-2 font-black text-gray-800 tracking-tighter">
                <Clock size={14} className="text-emerald-500" />
                <span>
                  {new Date(data?.check_in_date).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
              <span className="uppercase text-[10px] tracking-widest font-black text-gray-400">
                Thời gian trả:
              </span>
              <div className="flex items-center gap-2 font-black text-gray-800 tracking-tighter">
                <Clock size={14} className="text-rose-500" />
                <span>
                  {new Date(data?.check_out_date).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          </section>

          {/* CHI TIẾT DỊCH VỤ & TÀI CHÍNH */}
          <section className="space-y-4 px-4 border-t border-gray-100 pt-6">
            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
              <span className="uppercase text-[10px] tracking-widest">
                Tiền thuê ({calc?.nights} đêm):
              </span>
              <span className="font-black text-gray-800">
                {b.room.toLocaleString()}đ
              </span>
            </div>

            <div className="flex flex-col gap-2 py-3 border-t border-gray-100 mt-2">
              <span className="uppercase text-[10px] tracking-widest font-bold text-gray-400">
                Dịch vụ đã dùng:
              </span>
              <div className="space-y-2 pl-2">
                {data?.service_orders && data.service_orders.length > 0 ? (
                  data.service_orders.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-[13px]"
                    >
                      <span className="text-gray-700 font-medium italic">
                        • {item.services?.name}{" "}
                        {item.quantity > 1 && `(x${item.quantity})`}
                      </span>
                      <span className="font-black text-gray-900">
                        {(Number(item.total_price) || 0).toLocaleString()}đ
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic ml-2 tracking-tighter">
                    Khách không sử dụng dịch vụ ngoài
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-gray-500 pt-2">
              <span className="uppercase text-[10px] tracking-widest text-blue-500 font-black">
                Thuế VAT (10%):
              </span>
              <span className="font-black text-blue-600">
                +{b.tax.toLocaleString()}đ
              </span>
            </div>

            {/* CHỌN XUẤT HÓA ĐƠN GTGT (ẨN KHI IN) */}
            <div className="no-print mt-2 mb-4 p-4 bg-blue-50/50 rounded-[1.5rem] border border-blue-100">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isVatInvoice}
                      onChange={(e) => setIsVatInvoice(e.target.checked)}
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                  <span className="ml-10 text-[10px] font-black uppercase text-blue-700">
                    Xuất hóa đơn đỏ (GTGT)
                  </span>
                </label>
              </div>
              {isVatInvoice && (
                <div className="mt-4 space-y-2 animate-in slide-in-from-top-2">
                  <input
                    type="text"
                    placeholder="Tên công ty / Đơn vị..."
                    className="w-full bg-white border border-blue-200 p-3 rounded-xl text-xs outline-none"
                    value={companyInfo.name}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, name: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Mã số thuế"
                      className="bg-white border border-blue-200 p-3 rounded-xl text-xs font-mono"
                      value={companyInfo.taxCode}
                      onChange={(e) =>
                        setCompanyInfo({
                          ...companyInfo,
                          taxCode: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Địa chỉ trụ sở"
                      className="bg-white border border-blue-200 p-3 rounded-xl text-xs"
                      value={companyInfo.address}
                      onChange={(e) =>
                        setCompanyInfo({
                          ...companyInfo,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-gray-500 border-t border-gray-100 pt-4">
              <span className="uppercase text-[10px] tracking-widest font-black">
                Khấu trừ tiền cọc:
              </span>
              <span className="font-black text-rose-600">
                -{b.deposit.toLocaleString()}đ
              </span>
            </div>
          </section>

          {/* PHẦN CHỌN PHƯƠNG THỨC & GIẢM GIÁ (ẨN KHI IN) */}
          <div className="no-print grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase">
                Ưu đãi giảm giá
              </label>
              <div className="flex gap-1">
                <select
                  className="p-2 rounded-xl bg-white border border-gray-200 text-[10px] font-bold outline-none"
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                >
                  <option value="percent">%</option>
                  <option value="amount">VNĐ</option>
                </select>
                <input
                  type="number"
                  className="w-full p-2 rounded-xl bg-white border border-gray-200 text-xs font-black outline-none"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase">
                Hình thức thanh toán
              </label>
              <select
                className="w-full p-2 rounded-xl bg-white border border-gray-200 text-xs font-black outline-none"
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value as any)}
              >
                <option value="cash">💵 Tiền mặt tại quầy</option>
                <option value="transfer">🏦 Chuyển khoản VietQR</option>
                <option value="card">💳 Quẹt thẻ ngân hàng</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. FOOTER HÓA ĐƠN: THỰC THU & QR */}
        <div className="px-10 py-8 bg-white dark:bg-slate-900 shrink-0 space-y-6">
          {/* Dòng Phương thức */}
          <div className="flex justify-between items-center py-3 border-t border-dashed border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Cách thức thanh toán:
            </span>
            <span className="text-sm font-black uppercase text-slate-900 dark:text-white italic">
              {paymentMethod === "cash"
                ? "Tiền mặt"
                : paymentMethod === "transfer"
                  ? "Chuyển khoản"
                  : "Thẻ ngân hàng"}
            </span>
          </div>

          {/* Dòng Thực thu */}
          <div className="flex justify-between items-end pb-6 border-b-2 border-slate-900">
            <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
              Tổng thực thu:
            </span>
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
              {b.finalAmount.toLocaleString()}
              <span className="text-sm ml-1 font-bold uppercase text-slate-400">
                đ
              </span>
            </span>
          </div>

          {/* QR CODE - HIỆN Ở DƯỚI CÙNG CẢ MODAL LẪN BẢN IN */}
          {paymentMethod === "transfer" && (
            <div className="flex flex-col items-center justify-center py-8 pt-4 animate-in zoom-in-95 duration-500">
              <div className="p-4 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-2xl">
                <img
                  src={`https://img.vietqr.io/image/970415-123456789-compact2.png?amount=${b.finalAmount}&addInfo=Thanh toan phong ${data?.rooms?.room_number}&accountName=HOTELPRO`}
                  alt="VietQR"
                  className="w-52 h-52 object-contain"
                />
              </div>
              <div className="mt-5 text-center">
                <p className="text-sm font-black uppercase text-slate-900 tracking-tighter">
                  VietinBank: 123456789
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                  Chủ tài khoản: HOTELPRO
                </p>
                <p className="mt-4 text-[9px] italic text-slate-400 uppercase font-black tracking-widest">
                  Quét mã để hoàn tất thủ tục trả phòng
                </p>
              </div>
            </div>
          )}

          {/* Cụm nút bấm - Tự ẩn khi in */}
          <div className="flex justify-end gap-4 print:hidden pt-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
            >
              <Printer size={24} className="text-slate-600" />
            </button>
            <button
              type="button"
              onClick={handleConfirmCheckout}
              disabled={calculating}
              className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {calculating ? "Đang xử lý..." : "Xác nhận trả phòng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
