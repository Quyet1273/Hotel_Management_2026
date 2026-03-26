// import { useState, useEffect } from "react";
// import {
//   X,
//   Printer,
//   CreditCard,
//   DollarSign,
//   Receipt,
//   Bed,
//   Calculator,
// } from "lucide-react";
// import { checkInOutService } from "../services/checkInOutService";
// import { toast } from "sonner";

// interface CheckoutInvoiceProps {
//   bookingId: string;
//   onClose: () => void;
//   onCheckout: () => void;
// }

// export function CheckoutInvoice({
//   bookingId,
//   onClose,
//   onCheckout,
// }: CheckoutInvoiceProps) {
//   const [data, setData] = useState<any>(null);
//   const [calc, setCalc] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [calculating, setCalculating] = useState(false);

//   const [paymentMethod, setPaymentMethod] = useState<
//     "cash" | "card" | "transfer"
//   >("cash");
//   const [discount, setDiscount] = useState(0);
//   const [discountType, setDiscountType] = useState<"percent" | "amount">(
//     "percent",
//   );

//   // 1. Quản lý giá trị Debounce
//   const [debouncedDiscount, setDebouncedDiscount] = useState(discount);

//   // Effect 1: Đếm ngược thời gian chờ người dùng ngừng gõ (500ms)
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedDiscount(discount);
//     }, 500);

//     return () => clearTimeout(handler);
//   }, [discount]);

//   // Effect 2: Chỉ gọi API khi giá trị Debounce hoặc Loại giảm giá thay đổi
//   useEffect(() => {
//     const fetchInvoice = async () => {
//       // Nếu đã có dữ liệu thì hiện trạng thái đang tính toán ngầm
//       if (data) setCalculating(true);
//       else setLoading(true);

//       const res = await checkInOutService.getInvoiceDetail(
//         bookingId,
//         debouncedDiscount,
//         discountType,
//       );

//       if (res.success) {
//         setData(res.data);
//         setCalc(res.calculation);
//       } else {
//         toast.error("Không thể tải thông tin hóa đơn");
//         if (!data) onClose();
//       }

//       setLoading(false);
//       setCalculating(false);
//     };

//     fetchInvoice();
//   }, [bookingId, debouncedDiscount, discountType]);

//   // Hàm xác nhận thanh toán cuối cùng
//   const handleConfirmCheckout = async () => {
//     if (!data || !calc) return;

//     // Chuẩn bị object số tiền tách biệt để khớp với Service/Bảng invoices
//     const amounts = {
//       roomTotal: calc.roomCharge,
//       serviceTotal: calc.serviceCharge,
//       grandTotal: calc.total,
//     };

//     // Truyền đúng: 1. Object data, 2. Object amounts, 3. paymentMethod
//     const res = await checkInOutService.confirmCheckOutMaster(
//       data,
//       amounts,
//       paymentMethod,
//     );

//     if (res.success) {
//       toast.success("Thanh toán và lưu hóa đơn thành công!");
//       onCheckout();
//     } else {
//       toast.error("Lỗi: " + res.error);
//     }
//   };

//   // Loading màn hình đầu tiên
//   if (loading && !data)
//     return (
//       <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
//         <div className="bg-white p-5 rounded-2xl flex items-center gap-3 shadow-xl font-bold">
//           <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//           Đang tính hóa đơn...
//         </div>
//       </div>
//     );

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100] p-4 overflow-y-auto">
//       <style
//         dangerouslySetInnerHTML={{
//           __html: `
//         @media print {
//           body * { visibility: hidden; }
//           #printable-invoice, #printable-invoice * { visibility: visible; }
//           #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
//           .no-print { display: none !important; }
//         }
//       `,
//         }}
//       />

//       <div
//         id="printable-invoice"
//         className="bg-white rounded-[1.5rem] shadow-2xl max-w-md w-full border border-gray-100 my-auto overflow-hidden flex flex-col max-h-[95vh]"
//       >
//         {/* Header */}
//         <div className="bg-slate-900 text-white p-5 flex items-center justify-between no-print shrink-0">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-blue-500 rounded-lg">
//               <Receipt size={20} />
//             </div>
//             <div>
//               <h2 className="text-sm font-black uppercase italic leading-none">
//                 Hóa Đơn
//               </h2>
//               <p className="text-[9px] text-slate-400 font-mono tracking-tighter">
//                 ID: {data.id.slice(0, 8)}
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-1.5 hover:bg-white/10 rounded-full transition-all"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <div className="p-6 space-y-5 overflow-y-auto">
//           {/* Thông tin khách */}
//           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-[9px] text-slate-400 font-bold uppercase">
//                   Khách hàng
//                 </p>
//                 <p className="text-sm font-bold text-slate-800">
//                   {data.guests?.full_name}
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p className="text-[9px] text-slate-400 font-bold uppercase">
//                   Phòng / Số đêm
//                 </p>
//                 <p className="text-sm font-bold text-slate-800">
//                   #{data.rooms?.room_number} / {calc.nights}đêm
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Chi tiết chi phí */}
//           <div className="space-y-2.5">
//             <div className="flex justify-between text-base font-extrabold py-2.5 border-b border-slate-100 items-center">
//               <span className="text-slate-700 flex items-center uppercase gap-2.5">
//                 <Bed size={18} className="text-blue-600" />
//                 Tiền phòng
//               </span>
//               <span className="text-blue-700 text-lg">
//                 {calc.roomCharge.toLocaleString()}đ
//               </span>
//             </div>
//             <div className="space-y-2">
//               <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2">
//                 <Calculator size={12} className="text-blue-600"  /> Dịch vụ đã dùng
//               </p>
//               {data.service_orders?.length > 0 ? (
//                 <div className="bg-slate-50/50 p-3 rounded-lg border border-dashed border-slate-200 space-y-1.5">
//                   {data.service_orders.map((s: any) => (
//                     <div
//                       key={s.id}
//                       className="flex justify-between text-[11px]"
//                     >
//                       <span className="text-slate-600">
//                         {s.services?.name}{" "}
//                         <span className="opacity-50 text-[9px]">
//                           x{s.quantity}
//                         </span>
//                       </span>
//                       <span className="font-bold">
//                         {Number(s.total_price).toLocaleString()}đ
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-2 text-[10px] text-slate-400 italic bg-slate-50 rounded-lg">
//                   Không phát sinh dịch vụ
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Giảm giá */}
//           <div className="no-print space-y-2">
//             <div className="flex justify-between items-center">
//               <p className="text-[9px] font-black text-slate-400 uppercase italic">
//                 Ưu đãi giảm giá
//               </p>
//               {calculating && (
//                 <span className="text-[8px] text-blue-500 animate-pulse font-bold tracking-tighter">
//                   Đang tính lại...
//                 </span>
//               )}
//             </div>
//             <div className="flex gap-2">
//               <select
//                 className="bg-slate-50 border-slate-200 rounded-lg text-[10px] font-bold py-1.5"
//                 value={discountType}
//                 onChange={(e: any) => setDiscountType(e.target.value)}
//               >
//                 <option value="percent">%</option>
//                 <option value="amount">VNĐ</option>
//               </select>
//               <input
//                 type="number"
//                 className="flex-1 border border-slate-300 bg-white text-slate-900 rounded-lg py-1.5 px-3 text-xs font-bold outline-none transition-all duration-200 hover:border-blue-400 focus:ring-1 focus:ring-blue-500"
//                 placeholder="0"
//                 value={discount || ""} // Đảm bảo hiển thị giá trị hiện tại
//                 onChange={(e) => setDiscount(Number(e.target.value) || 0)}
//               />
//             </div>
//           </div>

//           <div className="flex flex-col gap-2 no-print relative z-10">
//             <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-left">
//               Hình thức thanh toán
//             </p>
//             <div className="flex gap-2 justify-end">
//               {[
//                 {
//                   id: "cash",
//                   label: "Tiền mặt",
//                   icon: <DollarSign size={14} />,
//                 },
//                 {
//                   id: "transfer",
//                   label: "Chuyển khoản",
//                   icon: <Receipt size={14} />,
//                 },
//                 {
//                   id: "card",
//                   label: "Quẹt thẻ",
//                   icon: <CreditCard size={14} />,
//                 },
//               ].map((m) => (
//                 <button
//                   key={m.id}
//                   type="button" // Tránh việc submit form ngoài ý muốn
//                   onClick={() => setPaymentMethod(m.id as any)}
//                   className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium transition-all duration-200
//           ${
//             paymentMethod === m.id
//               ? "bg-blue-50 text-blue-600 border-blue-500 ring-1 ring-blue-500" // Trạng thái đang chọn: xanh rõ rệt
//               : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50" // Trạng thái thường: hiện rõ chữ, chỉ hover mới đổi màu
//           }`}
//                 >
//                   {m.icon}
//                   <span>{m.label}</span>
//                 </button>
//               ))}
//             </div>
//           </div>
//           {/* CẦN THANH TOÁN */}
//           <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-100 flex justify-between items-center relative overflow-hidden">
//             {/* <Receipt className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10 -rotate-12 pointer-events-none" /> */}

//             <div className="relative z-10">
//               <p className="text-[9px] font-bold uppercase opacity-80 mb-0.5 italic">
//                 Tổng thanh toán
//               </p>
//               <p className="text-2xl font-black tracking-tight">
//                 {calc.total.toLocaleString()}đ
//               </p>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="grid grid-cols-2 gap-3 no-print pt-2">
//             <button
//               onClick={() => window.print()}
//               className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-xs"
//             >
//               <Printer size={16} /> In Hóa Đơn
//             </button>
//             <button
//               onClick={handleConfirmCheckout}
//               disabled={calculating}
//               className={`py-2.5 text-white rounded-xl font-black uppercase tracking-wider shadow-md transition-all text-xs ${calculating ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
//             >
//               Trả Phòng
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
