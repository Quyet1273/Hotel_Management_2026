import { useState, useEffect } from "react";
import {
  X,
  Printer,
  CreditCard,
  DollarSign,
  Receipt,
  Bed,
  Calculator,
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

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");

  const [debouncedDiscount, setDebouncedDiscount] = useState(discount);

  useEffect(() => {
    if (isOpen) {
      setDiscount(0);
      setDiscountType("percent");
      setPaymentMethod("cash");
    } else {
      setData(null);
      setCalc(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDiscount(discount);
    }, 500);
    return () => clearTimeout(handler);
  }, [discount]);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!isOpen || !bookingId) return;

      if (data) setCalculating(true);
      else setLoading(true);

      const res = await checkInOutService.getInvoiceDetail(
        bookingId,
        debouncedDiscount,
        discountType,
      );

      if (res.success) {
        setData(res.data);
        setCalc(res.calculation);
      } else {
        toast.error("Không thể tải thông tin hóa đơn");
        onClose();
      }

      setLoading(false);
      setCalculating(false);
    };

    fetchInvoice();
  }, [isOpen, bookingId, debouncedDiscount, discountType]);

  const handleConfirmCheckout = async () => {
    if (!data || !calc) return;
    setCalculating(true);

    const amounts = {
      roomTotal: calc.roomCharge,
      serviceTotal: calc.serviceCharge,
      grandTotal: calc.total,
    };

    const res = await checkInOutService.confirmCheckOutMaster(
      data,
      amounts,
      paymentMethod,
    );

    if (res.success) {
      toast.success("Thanh toán và lưu hóa đơn thành công!");
      onSuccess(); 
      onClose();   
    } else {
      toast.error("Lỗi: " + res.error);
    }
    setCalculating(false);
  };

  if (!isOpen) return null;

  if (loading && !data)
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
        <div className="bg-white p-5 rounded-2xl flex items-center gap-3 shadow-xl font-bold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Đang tính hóa đơn...
        </div>
      </div>
    );

 return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 2000 }}>
    {/* Style cho in ấn */}
    <style dangerouslySetInnerHTML={{
      __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100% !important; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
        }
      `,
    }} />

    {/* KHUNG MODAL - Thu nhỏ lại max-w-md (448px) cho giống hóa đơn */}
    <div
      id="printable-invoice"
      className="w-full max-w-md flex flex-col relative shadow-2xl overflow-hidden"
      style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '24px', 
        maxHeight: '90vh',
        border: '1px solid #f1f5f9'
      }}
    >
      {/* NÚT X THOÁT (no-print) */}
      <button
        onClick={onClose}
        className="absolute no-print transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center"
        style={{ 
          top: '16px', right: '16px', zIndex: 110, padding: '8px', 
          backgroundColor: '#f8fafc', color: '#94a3b8', borderRadius: '12px', 
          border: 'none', cursor: 'pointer' 
        }}
        title="Đóng"
      >
        <X size={18} strokeWidth={3} />
      </button>

      {/* PHẦN NỘI DUNG CUỘN */}
      <div className="flex-1 overflow-y-auto p-6 pt-10 sm:p-8 space-y-6">
        
        {/* HEADER HÓA ĐƠN */}
        <div className="text-center pb-4 border-b border-dashed border-slate-200">
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Hóa Đơn Thanh Toán
          </h2>
          <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>
            ID: {data?.id?.toUpperCase()}
          </p>
        </div>

        {/* THÔNG TIN KHÁCH & PHÒNG */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Khách hàng</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>{data?.guests?.full_name}</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Phòng / Đêm</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0 }}>
              P.{data?.rooms?.room_number} <span style={{ color: '#94a3b8' }}>/</span> {calc?.nights} đêm
            </p>
          </div>
        </div>

        {/* CHI TIẾT TIỀN NÔNG */}
        <div className="space-y-4 pt-2">
          {/* Tiền phòng */}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              <Bed size={14} className="text-blue-600" /> Tiền phòng
            </span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
              {calc?.roomCharge?.toLocaleString()}đ
            </span>
          </div>

          {/* Dịch vụ */}
          <div className="space-y-2">
            <p className="flex items-center gap-2" style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              <Calculator size={12} className="text-blue-600" /> Dịch vụ phát sinh
            </p>
            
            {data?.service_orders?.length > 0 ? (
              <div className="space-y-1.5 pl-5">
                {data.service_orders.map((s: any) => (
                  <div key={s.id} className="flex justify-between text-[11px]">
                    <span style={{ color: '#64748b', fontWeight: 500 }}>
                      {s.services?.name} <span style={{ fontSize: '9px', color: '#94a3b8' }}>x{s.quantity}</span>
                    </span>
                    <span style={{ fontWeight: 700, color: '#334155' }}>
                      {Number(s.total_price).toLocaleString()}đ
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pl-5" style={{ fontSize: '10px', color: '#cbd5e1', fontStyle: 'italic', margin: 0 }}>Không có dịch vụ</p>
            )}
          </div>
        </div>

        {/* PHẦN ĐIỀU CHỈNH (no-print) */}
        <div className="no-print space-y-4 pt-4 border-t border-slate-100">
          {/* Giảm giá */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Giảm giá ưu đãi</label>
              {calculating && <span className="animate-pulse" style={{ fontSize: '8px', color: '#3b82f6', fontWeight: 800 }}>ĐANG TÍNH...</span>}
            </div>
            <div className="flex gap-2">
              <select
                style={{ width: '70px', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700, outline: 'none' }}
                value={discountType}
                onChange={(e: any) => setDiscountType(e.target.value)}
              >
                <option value="percent">%</option>
                <option value="amount">VNĐ</option>
              </select>
              <input
                type="number"
                style={{ flex: 1, padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700, outline: 'none' }}
                placeholder="Nhập mức giảm..."
                value={discount || ""} 
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="space-y-2">
            <label style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Hình thức thanh toán</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cash", label: "Tiền mặt", icon: <DollarSign size={14} /> },
                { id: "transfer", label: "Chuyển khoản", icon: <Receipt size={14} /> },
                { id: "card", label: "Quẹt thẻ", icon: <CreditCard size={14} /> },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all border outline-none"
                  style={{ 
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: paymentMethod === m.id ? '#eff6ff' : '#ffffff',
                    color: paymentMethod === m.id ? '#2563eb' : '#64748b',
                    borderColor: paymentMethod === m.id ? '#2563eb' : '#e2e8f0',
                  }}
                >
                  {m.icon}
                  <span className="truncate w-full">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TỔNG CỘNG */}
        <div className="p-4 flex justify-between items-center" style={{ backgroundColor: '#2563eb', borderRadius: '16px', color: '#ffffff' }}>
          <div>
            <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', margin: 0 }}>Tổng thanh toán</p>
            <p style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>
              {calc?.total?.toLocaleString()}đ
            </p>
          </div>
          <Printer size={24} style={{ opacity: 0.2 }} />
        </div>

        {/* NÚT THAO TÁC (no-print) */}
        <div className="grid grid-cols-2 gap-3 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-xs cursor-pointer"
          >
            <Printer size={16} /> In Hóa Đơn
          </button>
          <button
            onClick={handleConfirmCheckout}
            disabled={calculating}
            className="py-3 text-white rounded-xl font-black uppercase tracking-wider shadow-lg transition-all text-xs border-none cursor-pointer"
            style={{ backgroundColor: calculating ? '#93c5fd' : '#2563eb' }}
          >
            Trả Phòng
          </button>
        </div>
      </div>
    </div>
  </div>
);
}