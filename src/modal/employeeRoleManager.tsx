// import { useState, useEffect } from 'react';
// import { Shield, ShieldAlert, X, Loader2, Check, UserCircle } from 'lucide-react';
// import { toast } from 'sonner';
// import { employeeRoleService } from '../services/employeeRoleService'; // <-- Nhớ check lại đường dẫn file service

// export function EmployeeRoleManager() {
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [roles, setRoles] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
  
//   // State cho Form/Modal gán quyền
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedEmp, setSelectedEmp] = useState<any>(null);
//   const [selectedRoleId, setSelectedRoleId] = useState<string>('');
//   const [isSaving, setIsSaving] = useState(false);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     setIsLoading(true);
//     const result = await employeeRoleService.getEmployeesWithRoles();
//     if (result.success) {
//       setEmployees(result.data || []);
//       setRoles(result.rolesList || []);
//     } else {
//       toast.error('Lỗi tải dữ liệu: ' + result.error);
//     }
//     setIsLoading(false);
//   };

//   const openAssignForm = (emp: any) => {
//     setSelectedEmp(emp);
//     setSelectedRoleId(emp.role || ''); // Load quyền hiện tại của người đó
//     setIsModalOpen(true);
//   };

//   const handleSaveRole = async () => {
//     if (!selectedRoleId) return toast.error('Vui lòng chọn một chức vụ!');
    
//     setIsSaving(true);
//     const result = await employeeRoleService.assignRoleToEmployee(selectedEmp.id, selectedRoleId);
//     setIsSaving(false);

//     if (result.success) {
//       toast.success(`Đã cập nhật quyền cho ${selectedEmp.full_name || selectedEmp.name}`);
//       setIsModalOpen(false);
//       fetchData(); // Load lại bảng danh sách nhân viên
//     } else {
//       toast.error('Cập nhật thất bại: ' + result.error);
//     }
//   };

//   if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
//         <div className="flex items-center gap-4">
//           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
//             <UserCircle className="w-6 h-6" />
//           </div>
//           <div>
//             <h2 className="text-2xl font-black text-gray-900">Danh Sách Nhân Sự</h2>
//             <p className="text-sm text-gray-500 font-medium">Quản lý và cấp quyền truy cập hệ thống</p>
//           </div>
//         </div>
//       </div>

//       {/* Bảng Danh sách Nhân viên */}
//       <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
//         <table className="w-full text-left">
//           <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
//             <tr>
//               <th className="px-8 py-5">Nhân viên</th>
//               <th className="px-8 py-5">Email liên hệ</th>
//               <th className="px-8 py-5">Chức vụ (Quyền)</th>
//               <th className="px-8 py-5 text-right">Thao tác</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-50">
//             {employees.map(emp => (
//               <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors group">
//                 <td className="px-8 py-5">
//                   <div className="font-bold text-gray-900 text-sm">{emp.full_name || emp.name}</div>
//                 </td>
//                 <td className="px-8 py-5">
//                   <div className="text-sm text-gray-500 font-medium">{emp.email}</div>
//                 </td>
//                 <td className="px-8 py-5">
//                   {emp.role_info ? (
//                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase border border-blue-100">
//                       <Shield className="w-3.5 h-3.5" />
//                       {emp.role_info.name}
//                     </span>
//                   ) : (
//                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase border border-rose-100">
//                       <ShieldAlert className="w-3.5 h-3.5" />
//                       Chưa cấp quyền
//                     </span>
//                   )}
//                 </td>
//                 <td className="px-8 py-5 text-right">
//                   <button 
//                     onClick={() => openAssignForm(emp)}
//                     className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-900 hover:text-white transition-all active:scale-95 shadow-sm opacity-0 group-hover:opacity-100"
//                   >
//                     Phân Quyền
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Form Modal Phân Quyền */}
//       {isModalOpen && selectedEmp && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
//             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
//               <h3 className="font-black text-lg flex items-center gap-2">
//                 <Shield className="text-blue-600" /> Cấp quyền cho nhân sự
//               </h3>
//               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
//             </div>
            
//             <div className="p-6 space-y-6">
//               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
//                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Nhân viên</p>
//                 <p className="font-black text-gray-900 text-lg">{selectedEmp.full_name || selectedEmp.name}</p>
//                 <p className="text-sm text-gray-500 font-medium">{selectedEmp.email}</p>
//               </div>

//               <div className="space-y-3">
//                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Chọn vai trò</p>
//                 <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-2">
//                   {roles.map(role => (
//                     <label 
//                       key={role.id} 
//                       className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedRoleId === role.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
//                     >
//                       <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${selectedRoleId === role.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
//                         {selectedRoleId === role.id && <Check className="w-3 h-3 text-white" />}
//                       </div>
//                       <input 
//                         type="radio" 
//                         name="role" 
//                         className="hidden" 
//                         checked={selectedRoleId === role.id}
//                         onChange={() => setSelectedRoleId(role.id)}
//                       />
//                       <div>
//                         <p className="font-bold text-gray-900 text-sm">{role.name}</p>
//                         <p className="text-xs text-gray-500 font-medium mt-0.5">{role.description}</p>
//                       </div>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               <button 
//                 onClick={handleSaveRole}
//                 disabled={isSaving}
//                 className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70 flex justify-center gap-2 mt-4"
//               >
//                 {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'XÁC NHẬN CẤP QUYỀN'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }