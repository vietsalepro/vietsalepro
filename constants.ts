import { Product, Customer, Supplier, Order } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'P001', 
    code: 'SP001', 
    name: 'Áo Thun Basic', 
    displayName: 'Áo Thun Basic Trắng Size M',
    price: 150000, 
    cost: 80000, 
    quantity: 50, 
    unit: 'Cái', 
    category: 'Thời trang', 
    image: 'https://picsum.photos/200/200?random=1',
    minStock: 10,
    maxStock: 100,
    conversionUnits: [],
    lots: []
  },
  { 
    id: 'P002', 
    code: 'SP002', 
    name: 'Quần Jean Nam', 
    price: 350000, 
    cost: 200000, 
    quantity: 30, 
    unit: 'Cái', 
    category: 'Thời trang', 
    image: 'https://picsum.photos/200/200?random=2' 
  },
  { 
    id: 'P003', 
    code: 'SP003', 
    name: 'Giày Sneaker', 
    price: 800000, 
    cost: 450000, 
    quantity: 15, 
    unit: 'Đôi', 
    category: 'Giày dép', 
    image: 'https://picsum.photos/200/200?random=3' 
  },
  { 
    id: 'P004', 
    code: 'SP004', 
    name: 'Balo Laptop', 
    price: 450000, 
    cost: 250000, 
    quantity: 20, 
    unit: 'Cái', 
    category: 'Phụ kiện', 
    image: 'https://picsum.photos/200/200?random=4' 
  },
  { 
    id: 'P005', 
    code: 'SP005', 
    name: 'Mũ Lưỡi Trai', 
    price: 120000, 
    cost: 50000, 
    quantity: 100, 
    unit: 'Cái', 
    category: 'Phụ kiện', 
    image: 'https://picsum.photos/200/200?random=5' 
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'C001', code: 'KH001', name: 'Khách lẻ', phone: '0000000000', address: 'N/A', totalSpent: 0, debt: 0, loyaltyPoints: 0 },
  { id: 'C002', code: 'KH002', name: 'Nguyễn Văn A', phone: '0901234567', address: '123 Lê Lợi, TP.HCM', totalSpent: 1500000, debt: 0, loyaltyPoints: 15 },
  { id: 'C003', code: 'KH003', name: 'Trần Thị B', phone: '0909876543', address: '456 Nguyễn Huệ, TP.HCM', totalSpent: 3200000, debt: 500000, loyaltyPoints: 32 },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'S001', code: 'NCC000001', name: 'Công ty May Mặc Việt', phone: '0281234567', address: 'KCN Tân Bình', contactPerson: 'Anh Nam', debt: 0 },
  { id: 'S002', code: 'NCC000002', name: 'Giày Dép Sài Gòn', phone: '0287654321', address: 'Quận 6, TP.HCM', contactPerson: 'Chị Lan', debt: 1200000 },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'HD001',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    customerId: 'C002',
    customerName: 'Nguyễn Văn A',
    items: [
      { productId: 'P001', productName: 'Áo Thun Basic', quantity: 2, unitName: 'Cái', price: 150000 },
    ],
    totalAmount: 300000,
    paidAmount: 300000,
    debtRecorded: 0,
    paymentMethod: 'Tiền mặt',
    status: 'completed',
    pointsEarned: 3,
    pointsRedeemed: 0,
    rewardsRedeemed: []
  },
  {
    id: 'HD002',
    date: new Date(Date.now() - 86400000).toISOString(),
    customerId: 'C003',
    customerName: 'Trần Thị B',
    items: [
      { productId: 'P003', productName: 'Giày Sneaker', quantity: 1, unitName: 'Đôi', price: 800000 },
      { productId: 'P005', productName: 'Mũ Lưỡi Trai', quantity: 1, unitName: 'Cái', price: 120000 },
    ],
    totalAmount: 920000,
    paidAmount: 920000,
    debtRecorded: 0,
    paymentMethod: 'Tiền mặt',
    status: 'completed',
    pointsEarned: 9,
    pointsRedeemed: 0,
    rewardsRedeemed: []
  },
];
