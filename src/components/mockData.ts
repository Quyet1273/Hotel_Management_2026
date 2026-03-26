export interface Room {
  id: string;
  number: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning';
  floor: number;
  price: number;
  maxOccupancy: number;
  image?: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  idType: string;
  idNumber: string;
  nationality?: string;
  registrationDate: string;
}

export interface Booking {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  totalAmount: number;
  specialRequests?: string;
  services?: BookingService[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: 'food' | 'laundry' | 'spa' | 'other';
  status: 'active' | 'inactive';
  image?: string;
}

export interface BookingService {
  serviceId: string;
  quantity: number;
  price: number;
  addedAt: string;
}

export interface Invoice {
  id: string;
  bookingId: string;
  roomCharge: number;
  serviceCharge: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  paidAt: string;
}

export interface Employee {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'receptionist' | 'housekeeping';
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
  permissions?: string[];
}

export interface RolePermission {
  role: 'admin' | 'manager' | 'receptionist' | 'housekeeping';
  label: string;
  permissions: string[];
  color: string;
}

export const mockRooms: Room[] = [
  { id: 'R001', number: '101', type: 'single', status: 'available', floor: 1, price: 500000, maxOccupancy: 1, image: 'https://images.unsplash.com/photo-1670800050441-e77f8c82963f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW5nbGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTczfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R002', number: '102', type: 'single', status: 'occupied', floor: 1, price: 500000, maxOccupancy: 1, image: 'https://images.unsplash.com/photo-1670800050441-e77f8c82963f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW5nbGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTczfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R003', number: '103', type: 'double', status: 'available', floor: 1, price: 800000, maxOccupancy: 2, image: 'https://images.unsplash.com/photo-1762779943673-fcb177e7fe56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb3VibGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTczfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R004', number: '104', type: 'double', status: 'occupied', floor: 1, price: 800000, maxOccupancy: 2, image: 'https://images.unsplash.com/photo-1762779943673-fcb177e7fe56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb3VibGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTczfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R005', number: '201', type: 'double', status: 'reserved', floor: 2, price: 800000, maxOccupancy: 2, image: 'https://images.unsplash.com/photo-1762779943673-fcb177e7fe56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb3VibGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTczfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R006', number: '202', type: 'suite', status: 'available', floor: 2, price: 1500000, maxOccupancy: 4, image: 'https://images.unsplash.com/photo-1759223198981-661cadbbff36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzdWl0ZSUyMGhvdGVsfGVufDF8fHx8MTc2NTExMjE3NHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R007', number: '203', type: 'suite', status: 'occupied', floor: 2, price: 1500000, maxOccupancy: 4, image: 'https://images.unsplash.com/photo-1759223198981-661cadbbff36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzdWl0ZSUyMGhvdGVsfGVufDF8fHx8MTc2NTExMjE3NHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R008', number: '204', type: 'deluxe', status: 'available', floor: 2, price: 1200000, maxOccupancy: 3, image: 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWx1eGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTc0fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R009', number: '301', type: 'deluxe', status: 'maintenance', floor: 3, price: 1200000, maxOccupancy: 3, image: 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWx1eGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTc0fDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R010', number: '302', type: 'suite', status: 'available', floor: 3, price: 1500000, maxOccupancy: 4, image: 'https://images.unsplash.com/photo-1759223198981-661cadbbff36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzdWl0ZSUyMGhvdGVsfGVufDF8fHx8MTc2NTExMjE3NHww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R011', number: '303', type: 'double', status: 'occupied', floor: 3, price: 800000, maxOccupancy: 2, image: 'https://images.unsplash.com/photo-1762779943673-fcb177e7fe56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb3VibGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTczfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R012', number: '304', type: 'single', status: 'available', floor: 3, price: 500000, maxOccupancy: 1, image: 'https://images.unsplash.com/photo-1670800050441-e77f8c82963f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW5nbGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTczfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 'R013', number: '305', type: 'double', status: 'cleaning', floor: 3, price: 800000, maxOccupancy: 2, image: 'https://images.unsplash.com/photo-1762779943673-fcb177e7fe56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb3VibGUlMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzY1MTEyMTczfDA&ixlib=rb-4.1.0&q=80&w=1080' },
];

export const mockGuests: Guest[] = [
  {
    id: 'G001',
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@email.com',
    phone: '+84 912 345 678',
    address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    idType: 'CCCD',
    idNumber: '001234567890',
    nationality: 'Việt Nam',
    registrationDate: '2024-01-15',
  },
  {
    id: 'G002',
    name: 'Trần Thị Bình',
    email: 'tranbinht@email.com',
    phone: '+84 913 456 789',
    address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
    idType: 'CCCD',
    idNumber: 'DL987654321',
    nationality: 'Việt Nam',
    registrationDate: '2024-02-20',
  },
  {
    id: 'G003',
    name: 'Lê Minh Cường',
    email: 'lmcuong@email.com',
    phone: '+84 914 567 890',
    address: '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
    idType: 'CCCD',
    idNumber: 'P987654321',
    nationality: 'Việt Nam',
    registrationDate: '2024-03-10',
  },
  {
    id: 'G004',
    name: 'Phạm Thu Hà',
    email: 'phamthuha@email.com',
    phone: '+84 915 678 901',
    address: '321 Đường Võ Văn Tần, Quận 3, TP.HCM',
    idType: 'CCCD',
    idNumber: 'P456789123',
    nationality: 'Việt Nam',
    registrationDate: '2024-04-05',
  },
  {
    id: 'G005',
    name: 'Hoàng Minh Tuấn',
    email: 'hmtuan@email.com',
    phone: '+84 916 789 012',
    address: '654 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
    idType: 'CCCD',
    idNumber: 'DL123456789',
    nationality: 'Việt Nam',
    registrationDate: '2024-05-12',
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'BK001',
    guestId: 'G001',
    roomId: 'R002',
    checkIn: '2024-12-05',
    checkOut: '2024-12-10',
    guests: 1,
    status: 'checked-in',
    totalAmount: 2500000,
    services: [
      { serviceId: 'SV001', quantity: 2, price: 20000, addedAt: '2024-12-06T10:00:00' },
      { serviceId: 'SV003', quantity: 1, price: 200000, addedAt: '2024-12-06T14:00:00' },
    ],
  },
  {
    id: 'BK002',
    guestId: 'G002',
    roomId: 'R004',
    checkIn: '2024-12-06',
    checkOut: '2024-12-09',
    guests: 2,
    status: 'checked-in',
    totalAmount: 2400000,
  },
  {
    id: 'BK003',
    guestId: 'G003',
    roomId: 'R007',
    checkIn: '2024-12-07',
    checkOut: '2024-12-12',
    guests: 3,
    status: 'checked-in',
    totalAmount: 7500000,
    specialRequests: 'Late check-in',
  },
  {
    id: 'BK004',
    guestId: 'G004',
    roomId: 'R005',
    checkIn: '2024-12-07',
    checkOut: '2024-12-11',
    guests: 2,
    status: 'confirmed',
    totalAmount: 2400000,
  },
  {
    id: 'BK005',
    guestId: 'G005',
    roomId: 'R011',
    checkIn: '2024-12-07',
    checkOut: '2024-12-14',
    guests: 2,
    status: 'checked-in',
    totalAmount: 5600000,
    specialRequests: 'High floor preferred',
  },
  {
    id: 'BK006',
    guestId: 'G001',
    roomId: 'R003',
    checkIn: '2024-12-07',
    checkOut: '2024-12-09',
    guests: 2,
    status: 'pending',
    totalAmount: 1600000,
    specialRequests: 'Cần xác nhận sớm',
  },
  {
    id: 'BK007',
    guestId: 'G002',
    roomId: 'R006',
    checkIn: '2024-12-07',
    checkOut: '2024-12-10',
    guests: 3,
    status: 'pending',
    totalAmount: 4500000,
    specialRequests: 'Phòng view đẹp',
  },
  {
    id: 'BK008',
    guestId: 'G004',
    roomId: 'R008',
    checkIn: '2024-12-07',
    checkOut: '2024-12-11',
    guests: 2,
    status: 'pending',
    totalAmount: 4800000,
  },
  {
    id: 'BK009',
    guestId: 'G003',
    roomId: 'R001',
    checkIn: '2024-12-04',
    checkOut: '2024-12-07',
    guests: 1,
    status: 'checked-in',
    totalAmount: 1500000,
    specialRequests: 'Checkout sớm',
  },
  {
    id: 'BK010',
    guestId: 'G005',
    roomId: 'R009',
    checkIn: '2024-12-03',
    checkOut: '2024-12-07',
    guests: 2,
    status: 'checked-in',
    totalAmount: 3200000,
  },
  {
    id: 'BK011',
    guestId: 'G001',
    roomId: 'R010',
    checkIn: '2024-12-05',
    checkOut: '2024-12-07',
    guests: 3,
    status: 'checked-in',
    totalAmount: 4000000,
    specialRequests: 'Cần hỗ trợ hành lý',
  },
  {
    id: 'BK012',
    guestId: 'G004',
    roomId: 'R012',
    checkIn: '2024-12-06',
    checkOut: '2024-12-07',
    guests: 2,
    status: 'checked-in',
    totalAmount: 1600000,
  },
  {
    id: 'BK013',
    guestId: 'G002',
    roomId: 'R013',
    checkIn: '2024-12-07',
    checkOut: '2024-12-10',
    guests: 2,
    status: 'confirmed',
    totalAmount: 2400000,
    specialRequests: 'Yêu cầu tầng cao',
  },
  {
    id: 'BK014',
    guestId: 'G005',
    roomId: 'R003',
    checkIn: '2024-12-07',
    checkOut: '2024-12-12',
    guests: 1,
    status: 'confirmed',
    totalAmount: 4000000,
  },
];

export const mockServices: Service[] = [
  { 
    id: 'SV001', 
    name: 'Nước ngọt', 
    price: 20000, 
    unit: 'Chai', 
    category: 'food', 
    status: 'active',
    image: 'https://images.unsplash.com/photo-1741702478396-e2fc8c868620?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHJvb20lMjBzZXJ2aWNlJTIwZm9vZHxlbnwxfHx8fDE3NjUxMTIxNzV8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    id: 'SV002', 
    name: 'Giặt ủi', 
    price: 50000, 
    unit: 'Bộ', 
    category: 'laundry', 
    status: 'active',
    image: 'https://images.unsplash.com/photo-1652664767434-9cf9447d499a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGxhdW5kcnklMjBzZXJ2aWNlfGVufDF8fHx8MTc2NTExMjAzN3ww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    id: 'SV003', 
    name: 'Massage', 
    price: 200000, 
    unit: 'Giờ', 
    category: 'spa', 
    status: 'active',
    image: 'https://images.unsplash.com/photo-1610402601271-5b4bd5b3eba4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHNwYSUyMG1hc3NhZ2V8ZW58MXx8fHwxNzY1MTEyMDM3fDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    id: 'SV004', 
    name: 'Bữa sáng', 
    price: 100000, 
    unit: 'Suất', 
    category: 'food', 
    status: 'active',
    image: 'https://images.unsplash.com/photo-1635350644118-8e55edfabb59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGJyZWFrZmFzdCUyMHNlcnZpY2V8ZW58MXx8fHwxNzY1MTEyMDM2fDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    id: 'SV005', 
    name: 'Thuê xe', 
    price: 500000, 
    unit: 'Ngày', 
    category: 'other', 
    status: 'active',
    image: 'https://images.unsplash.com/photo-1638370074118-b42b0c582447?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHBhcmtpbmclMjBzZXJ2aWNlfGVufDF8fHx8MTc2NTExMjE3NXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
];

export const mockEmployees: Employee[] = [
  {
    id: 'E001',
    username: 'admin',
    name: 'Nguyễn Văn A',
    role: 'admin',
    email: 'admin@hotel.com',
    phone: '0901234567',
    status: 'active',
    createdAt: '2024-01-01',
    permissions: ['manage_rooms', 'manage_bookings', 'manage_services', 'manage_employees'],
  },
  {
    id: 'E002',
    username: 'manager1',
    name: 'Trần Thị B',
    role: 'manager',
    email: 'manager@hotel.com',
    phone: '0901234568',
    status: 'active',
    createdAt: '2024-01-15',
    permissions: ['manage_rooms', 'manage_bookings', 'manage_services'],
  },
  {
    id: 'E003',
    username: 'receptionist1',
    name: 'Lê Văn C',
    role: 'receptionist',
    email: 'receptionist@hotel.com',
    phone: '0901234569',
    status: 'active',
    createdAt: '2024-02-01',
    permissions: ['manage_bookings', 'manage_services'],
  },
  {
    id: 'E004',
    username: 'housekeeping1',
    name: 'Phạm Thị D',
    role: 'housekeeping',
    email: 'housekeeping@hotel.com',
    phone: '0901234570',
    status: 'active',
    createdAt: '2024-02-15',
    permissions: ['manage_rooms'],
  },
];

export const mockRolePermissions: RolePermission[] = [
  {
    role: 'admin',
    label: 'Quản trị viên',
    permissions: ['manage_rooms', 'manage_bookings', 'manage_services', 'manage_employees'],
    color: '#FF5733',
  },
  {
    role: 'manager',
    label: 'Quản lý',
    permissions: ['manage_rooms', 'manage_bookings', 'manage_services'],
    color: '#33FF57',
  },
  {
    role: 'receptionist',
    label: 'Nhân viên lễ tân',
    permissions: ['manage_bookings', 'manage_services'],
    color: '#3357FF',
  },
  {
    role: 'housekeeping',
    label: 'Nhân viên dọn dẹp',
    permissions: ['manage_rooms'],
    color: '#FF33A1',
  },
];