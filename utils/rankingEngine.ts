import { CustomerRankConfig, RankCondition, CustomerRankHistory, Order, Product } from '../types';

// ─── DEFAULT RANK CONFIGURATIONS ──────────────────────────────

export const DEFAULT_RANK_CONFIGS: CustomerRankConfig[] = [
  {
    id: 'rank_diamond',
    name: 'Kim Cương',
    key: 'diamond',
    color: '#3B82F6',
    description: 'Khách VIP cao nhất',
    order: 1,
    isDefault: false,
    discountPercent: 5,
    conditions: [
      {
        id: 'cond_diamond_1',
        metric: 'total_spent',
        operator: 'gte',
        minValue: 40000000,
        periodType: 'year',
        periodYear: 2026,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rank_gold',
    name: 'Vàng',
    key: 'gold',
    color: '#F59E0B',
    description: 'Khách VIP',
    order: 2,
    isDefault: false,
    discountPercent: 3,
    conditions: [
      {
        id: 'cond_gold_1',
        metric: 'total_spent',
        operator: 'gte',
        minValue: 30000000,
        periodType: 'year',
        periodYear: 2026,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rank_silver',
    name: 'Bạc',
    key: 'silver',
    color: '#6B7280',
    description: 'Khách thân thiết',
    order: 3,
    isDefault: false,
    discountPercent: 2,
    conditions: [
      {
        id: 'cond_silver_1',
        metric: 'total_spent',
        operator: 'gte',
        minValue: 10000000,
        periodType: 'year',
        periodYear: 2026,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rank_bronze',
    name: 'Đồng',
    key: 'bronze',
    color: '#B45309',
    description: 'Khách mới',
    order: 4,
    isDefault: false,
    discountPercent: 1,
    conditions: [
      {
        id: 'cond_bronze_1',
        metric: 'total_spent',
        operator: 'gte',
        minValue: 1000000,
        periodType: 'year',
        periodYear: 2026,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rank_regular',
    name: 'Thường',
    key: 'regular',
    color: '#9CA3AF',
    description: 'Hạng mặc định',
    order: 5,
    isDefault: true,
    discountPercent: 0,
    conditions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── UTILITY FUNCTIONS ───────────────────────────────────────

/** Tính tổng tiền của khách hàng từ danh sách đơn hàng trong kỳ */
export function calculateCustomerTotalSpent(
  orders: Order[],
  customerId: string,
  conditions: RankCondition[]
): number {
  let total = 0;
  for (const order of orders) {
    if (order.customerId !== customerId) continue;
    if (isOrderInPeriod(order, conditions)) {
      total += order.totalAmount;
    }
  }
  return total;
}

/** Tính tổng số lượng sản phẩm khách hàng đã mua trong kỳ */
export function calculateCustomerTotalQuantity(
  orders: Order[],
  customerId: string,
  conditions: RankCondition[]
): number {
  let total = 0;
  for (const order of orders) {
    if (order.customerId !== customerId) continue;
    if (isOrderInPeriod(order, conditions)) {
      for (const item of order.items) {
        total += item.quantity;
      }
    }
  }
  return total;
}

/** Kiểm tra đơn hàng có nằm trong kỳ tính toán không */
function isOrderInPeriod(order: Order, conditions: RankCondition[]): boolean {
  if (conditions.length === 0) return true;
  
  // Lấy kỳ từ điều kiện đầu tiên (giả định 1 hạng chỉ dùng 1 loại kỳ)
  const cond = conditions[0];
  if (!cond) return true;
  
  const orderDate = new Date(order.date);
  
  switch (cond.periodType) {
    case 'year': {
      const year = cond.periodYear || new Date().getFullYear();
      return orderDate.getFullYear() === year;
    }
    case 'month': {
      const year = cond.periodYear || new Date().getFullYear();
      const month = cond.periodMonth || (new Date().getMonth() + 1);
      return orderDate.getFullYear() === year && (orderDate.getMonth() + 1) === month;
    }
    case 'custom': {
      const start = cond.periodStart ? new Date(cond.periodStart) : null;
      const end = cond.periodEnd ? new Date(cond.periodEnd) : null;
      if (start && orderDate < start) return false;
      if (end && orderDate > end) return false;
      return true;
    }
    default:
      return true;
  }
}

/** Kiểm tra 1 điều kiện cụ thể có thoả mãn không */
function checkCondition(
  condition: RankCondition,
  totalSpent: number,
  totalQuantity: number
): boolean {
  const value = condition.metric === 'total_spent' ? totalSpent : totalQuantity;
  
  switch (condition.operator) {
    case 'gte':
      return value >= (condition.minValue ?? 0);
    case 'lte':
      return value <= (condition.maxValue ?? Infinity);
    case 'between':
      return value >= (condition.minValue ?? 0) && value <= (condition.maxValue ?? Infinity);
    default:
      return false;
  }
}

// ─── MAIN FUNCTIONS ──────────────────────────────────────────

/**
 * Tính hạng cho 1 khách hàng dựa trên danh sách đơn hàng và cấu hình hạng
 */
export function calculateCustomerRank(
  customerId: string,
  orders: Order[],
  rankConfigs: CustomerRankConfig[]
): { rankId: string; rankName: string; rankKey: string } {
  // Sắp xếp hạng theo thứ tự ưu tiên (order tăng dần = 1 là cao nhất)
  const sortedConfigs = [...rankConfigs]
    .filter(c => !c.isDefault)
    .sort((a, b) => a.order - b.order);
  
  const defaultRank = rankConfigs.find(c => c.isDefault) || rankConfigs[rankConfigs.length - 1];
  
  for (const config of sortedConfigs) {
    if (config.conditions.length === 0) continue;
    
    // Tính dữ liệu cho KH theo kỳ của điều kiện
    const totalSpent = calculateCustomerTotalSpent(orders, customerId, config.conditions);
    const totalQuantity = calculateCustomerTotalQuantity(orders, customerId, config.conditions);
    
    // Kiểm tra tất cả điều kiện
    let allPassed = true;
    for (const condition of config.conditions) {
      if (!checkCondition(condition, totalSpent, totalQuantity)) {
        allPassed = false;
        break;
      }
    }
    
    if (allPassed) {
      return { rankId: config.id, rankName: config.name, rankKey: config.key };
    }
  }
  
  // Không thoả mãn hạng nào -> gán hạng mặc định
  return {
    rankId: defaultRank.id,
    rankName: defaultRank.name,
    rankKey: defaultRank.key,
  };
}

/**
 * Tính lại hạng cho tất cả khách hàng
 */
export function recalculateAllRanks(
  customers: { id: string }[],
  orders: Order[],
  rankConfigs: CustomerRankConfig[]
): { customerId: string; oldRank: string; newRankName: string; newRankId: string }[] {
  const results: { customerId: string; oldRank: string; newRankName: string; newRankId: string }[] = [];
  
  for (const customer of customers) {
    const result = calculateCustomerRank(customer.id, orders, rankConfigs);
    results.push({
      customerId: customer.id,
      oldRank: '',
      newRankName: result.rankName,
      newRankId: result.rankId,
    });
  }
  
  return results;
}

/**
 * Tạo lịch sử thay đổi hạng khi có sự thay đổi
 */
export function createRankHistoryEntry(
  customerId: string,
  customerName: string,
  oldRank: string,
  oldRankName: string,
  newRank: string,
  newRankName: string,
  totalSpentAtChange: number,
  reason: string = 'Tự động'
): CustomerRankHistory {
  return {
    id: `RH${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
    customerId,
    customerName,
    oldRank,
    oldRankName,
    newRank,
    newRankName,
    changedAt: new Date().toISOString(),
    reason,
    totalSpentAtChange,
  };
}

// ─── MOCK DATA ───────────────────────────────────────────────

/** Tạo đơn hàng mẫu cho 5 khách hàng trong năm 2026 */
export function generateMockOrders(): Order[] {
  const mockOrders: Order[] = [];
  let orderIndex = 0;
  
  // Helper tạo đơn
  const addOrder = (customerId: string, customerName: string, date: string, items: { productId: string; productName: string; quantity: number; price: number }[]) => {
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    orderIndex++;
    mockOrders.push({
      id: `MOCK_ORD${orderIndex.toString().padStart(4, '0')}`,
      date: new Date(date).toISOString(),
      customerId,
      customerName,
      items: items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitName: 'Cái',
        price: i.price,
      })),
      totalAmount,
      paidAmount: totalAmount,
      debtRecorded: 0,
      paymentMethod: 'Tiền mặt',
      status: 'completed',
      pointsEarned: Math.floor(totalAmount / 100000),
      pointsRedeemed: 0,
    });
  };

  // Nguyễn Thị B (KH002) - Tổng ~30.000.000đ -> Hạng Vàng
  addOrder('C002', 'Nguyễn Thị B', '2026-01-15', [
    { productId: 'P001', productName: 'Sữa bột Ensure Gold 800g', quantity: 5, price: 550000 },
    { productId: 'P002', productName: 'Sữa bột Nan Nga 900g', quantity: 3, price: 520000 },
  ]); // 5*550000 + 3*520000 = 2.750.000 + 1.560.000 = 4.310.000

  addOrder('C002', 'Nguyễn Thị B', '2026-02-20', [
    { productId: 'P003', productName: 'Sữa tươi TH True Milk 1L', quantity: 10, price: 35000 },
    { productId: 'P004', productName: 'Bỉm quần Merries L56', quantity: 4, price: 285000 },
  ]); // 10*35000 + 4*285000 = 350.000 + 1.140.000 = 1.490.000

  addOrder('C002', 'Nguyễn Thị B', '2026-03-10', [
    { productId: 'P001', productName: 'Sữa bột Ensure Gold 800g', quantity: 8, price: 550000 },
  ]); // 8*550000 = 4.400.000

  addOrder('C002', 'Nguyễn Thị B', '2026-04-05', [
    { productId: 'P005', productName: 'Sữa bột Aptamil 900g', quantity: 6, price: 580000 },
    { productId: 'P002', productName: 'Sữa bột Nan Nga 900g', quantity: 4, price: 520000 },
  ]); // 6*580000 + 4*520000 = 3.480.000 + 2.080.000 = 5.560.000

  addOrder('C002', 'Nguyễn Thị B', '2026-05-12', [
    { productId: 'P003', productName: 'Sữa tươi TH True Milk 1L', quantity: 20, price: 35000 },
    { productId: 'P006', productName: 'Bánh ăn dặm Pigeon', quantity: 10, price: 45000 },
  ]); // 20*35000 + 10*45000 = 700.000 + 450.000 = 1.150.000

  addOrder('C002', 'Nguyễn Thị B', '2026-06-18', [
    { productId: 'P001', productName: 'Sữa bột Ensure Gold 800g', quantity: 10, price: 550000 },
    { productId: 'P004', productName: 'Bỉm quần Merries L56', quantity: 5, price: 285000 },
  ]); // 10*550000 + 5*285000 = 5.500.000 + 1.425.000 = 6.925.000
  // Tổng B: 4.310.000 + 1.490.000 + 4.400.000 + 5.560.000 + 1.150.000 + 6.925.000 = 23.835.000 -> hụt 6.165.000 so với mục tiêu 30tr
  
  // Thêm đơn cho B để đạt đủ 30tr
  addOrder('C002', 'Nguyễn Thị B', '2026-03-25', [
    { productId: 'P007', productName: 'Dầu tắm gội Babé 500ml', quantity: 6, price: 120000 },
    { productId: 'P008', productName: 'Kem chống hăm Sudocrem 125g', quantity: 5, price: 150000 },
  ]); // 6*120000 + 5*150000 = 720.000 + 750.000 = 1.470.000

  addOrder('C002', 'Nguyễn Thị B', '2026-04-20', [
    { productId: 'P009', productName: 'Máy hút sữa Medela', quantity: 1, price: 3200000 },
    { productId: 'P010', productName: 'Bình sữa Pigeon 240ml', quantity: 4, price: 185000 },
  ]); // 1*3200000 + 4*185000 = 3.200.000 + 740.000 = 3.940.000
  // Tổng cộng B: 23.835.000 + 1.470.000 + 3.940.000 = 29.245.000 vẫn thiếu
  
  addOrder('C002', 'Nguyễn Thị B', '2026-05-28', [
    { productId: 'P011', productName: 'Sữa chua uống Probi 1L', quantity: 5, price: 38000 },
    { productId: 'P001', productName: 'Sữa bột Ensure Gold 800g', quantity: 1, price: 550000 },
  ]); // 5*38000 + 1*550000 = 190.000 + 550.000 = 740.000
  // Tổng B: 29.245.000 + 740.000 = 29.985.000 

  // Thêm 1 đơn nhỏ để đạt 30tr
  addOrder('C002', 'Nguyễn Thị B', '2026-06-05', [
    { productId: 'P012', productName: 'Tã dán Merries S64', quantity: 1, price: 285000 },
  ]); // 285.000
  // Tổng B: 29.985.000 + 285.000 = 30.270.000 -> Hạng Vàng ✅

  // Nguyễn Thị D (KH004) - Tổng >40.000.000đ -> Hạng Kim Cương
  addOrder('C004', 'Nguyễn Thị D', '2026-01-08', [
    { productId: 'P001', productName: 'Sữa bột Ensure Gold 800g', quantity: 10, price: 550000 },
    { productId: 'P002', productName: 'Sữa bột Nan Nga 900g', quantity: 5, price: 520000 },
  ]); // 10*550000 + 5*520000 = 5.500.000 + 2.600.000 = 8.100.000

  addOrder('C004', 'Nguyễn Thị D', '2026-02-14', [
    { productId: 'P005', productName: 'Sữa bột Aptamil 900g', quantity: 8, price: 580000 },
    { productId: 'P004', productName: 'Bỉm quần Merries L56', quantity: 10, price: 285000 },
  ]); // 8*580000 + 10*285000 = 4.640.000 + 2.850.000 = 7.490.000

  addOrder('C004', 'Nguyễn Thị D', '2026-03-22', [
    { productId: 'P009', productName: 'Máy hút sữa Medela', quantity: 2, price: 3200000 },
    { productId: 'P010', productName: 'Bình sữa Pigeon 240ml', quantity: 6, price: 185000 },
  ]); // 2*3200000 + 6*185000 = 6.400.000 + 1.110.000 = 7.510.000

  addOrder('C004', 'Nguyễn Thị D', '2026-04-10', [
    { productId: 'P001', productName: 'Sữa bột Ensure Gold 800g', quantity: 12, price: 550000 },
    { productId: 'P006', productName: 'Bánh ăn dặm Pigeon', quantity: 15, price: 45000 },
  ]); // 12*550000 + 15*45000 = 6.600.000 + 675.000 = 7.275.000

  addOrder('C004', 'Nguyễn Thị D', '2026-05-05', [
    { productId: 'P002', productName: 'Sữa bột Nan Nga 900g', quantity: 6, price: 520000 },
    { productId: 'P003', productName: 'Sữa tươi TH True Milk 1L', quantity: 30, price: 35000 },
  ]); // 6*520000 + 30*35000 = 3.120.000 + 1.050.000 = 4.170.000

  addOrder('C004', 'Nguyễn Thị D', '2026-06-15', [
    { productId: 'P005', productName: 'Sữa bột Aptamil 900g', quantity: 5, price: 580000 },
    { productId: 'P004', productName: 'Bỉm quần Merries L56', quantity: 8, price: 285000 },
    { productId: 'P011', productName: 'Sữa chua uống Probi 1L', quantity: 20, price: 38000 },
  ]); // 5*580000 + 8*285000 + 20*38000 = 2.900.000 + 2.280.000 + 760.000 = 5.940.000
  // Tổng D: 8.100.000 + 7.490.000 + 7.510.000 + 7.275.000 + 4.170.000 + 5.940.000 = 40.485.000 -> Hạng Kim Cương ✅

  // Trần Văn A (KH001) - Tổng ~5.000.000đ -> Hạng Đồng
  addOrder('C001', 'Trần Văn A', '2026-02-28', [
    { productId: 'P003', productName: 'Sữa tươi TH True Milk 1L', quantity: 15, price: 35000 },
    { productId: 'P012', productName: 'Tã dán Merries S64', quantity: 2, price: 285000 },
  ]); // 15*35000 + 2*285000 = 525.000 + 570.000 = 1.095.000

  addOrder('C001', 'Trần Văn A', '2026-05-20', [
    { productId: 'P006', productName: 'Bánh ăn dặm Pigeon', quantity: 20, price: 45000 },
    { productId: 'P003', productName: 'Sữa tươi TH True Milk 1L', quantity: 30, price: 35000 },
    { productId: 'P008', productName: 'Kem chống hăm Sudocrem 125g', quantity: 1, price: 150000 },
  ]); // 20*45000 + 30*35000 + 1*150000 = 900.000 + 1.050.000 + 150.000 = 2.100.000

  addOrder('C001', 'Trần Văn A', '2026-06-10', [
    { productId: 'P011', productName: 'Sữa chua uống Probi 1L', quantity: 25, price: 38000 },
    { productId: 'P012', productName: 'Tã dán Merries S64', quantity: 3, price: 285000 },
  ]); // 25*38000 + 3*285000 = 950.000 + 855.000 = 1.805.000
  // Tổng A: 1.095.000 + 2.100.000 + 1.805.000 = 5.000.000 -> Hạng Đồng ✅

  // Lê Thị C (KH003) - Tổng ~3.000.000đ -> Hạng Đồng
  addOrder('C003', 'Lê Thị C', '2026-03-15', [
    { productId: 'P003', productName: 'Sữa tươi TH True Milk 1L', quantity: 20, price: 35000 },
    { productId: 'P007', productName: 'Dầu tắm gội Babé 500ml', quantity: 2, price: 120000 },
  ]); // 20*35000 + 2*120000 = 700.000 + 240.000 = 940.000

  addOrder('C003', 'Lê Thị C', '2026-04-28', [
    { productId: 'P006', productName: 'Bánh ăn dặm Pigeon', quantity: 15, price: 45000 },
    { productId: 'P011', productName: 'Sữa chua uống Probi 1L', quantity: 10, price: 38000 },
  ]); // 15*45000 + 10*38000 = 675.000 + 380.000 = 1.055.000

  addOrder('C003', 'Lê Thị C', '2026-06-05', [
    { productId: 'P003', productName: 'Sữa tươi TH True Milk 1L', quantity: 15, price: 35000 },
    { productId: 'P012', productName: 'Tã dán Merries S64', quantity: 2, price: 285000 },
  ]); // 15*35000 + 2*285000 = 525.000 + 570.000 = 1.095.000
  // Tổng C: 940.000 + 1.055.000 + 1.095.000 = 3.090.000 -> Hạng Đồng ✅

  // Phạm Văn E (KH005) - Tổng 500.000đ -> Hạng Thường
  addOrder('C005', 'Phạm Văn E', '2026-06-20', [
    { productId: 'P003', productName: 'Sữa tươi TH True Milk 1L', quantity: 10, price: 35000 },
    { productId: 'P006', productName: 'Bánh ăn dặm Pigeon', quantity: 3, price: 45000 },
  ]); // 10*35000 + 3*45000 = 350.000 + 135.000 = 485.000
  // Tổng E: 485.000 -> Hạng Thường ✅ (dưới 1.000.000)

  return mockOrders;
}

/** Tạo danh sách khách hàng mẫu (cập nhật rank dựa trên mock orders) */
export function generateMockCustomers(orders: Order[], rankConfigs: CustomerRankConfig[]) {
  const customers = [
    { id: 'C001', code: 'KH001', name: 'Trần Văn A', phone: '0912345678', address: '123 Nguyễn Huệ, Q.1, TP.HCM', totalSpent: 0, debt: 0, loyaltyPoints: 50 },
    { id: 'C002', code: 'KH002', name: 'Nguyễn Thị B', phone: '0987654321', address: '456 Lê Lợi, Q.3, TP.HCM', totalSpent: 0, debt: 0, loyaltyPoints: 120 },
    { id: 'C003', code: 'KH003', name: 'Lê Thị C', phone: '0977777777', address: '789 Trần Hưng Đạo, Q.5, TP.HCM', totalSpent: 0, debt: 200000, loyaltyPoints: 30 },
    { id: 'C004', code: 'KH004', name: 'Nguyễn Thị D', phone: '0123456789', address: '321 Võ Văn Tần, Q.10, TP.HCM', totalSpent: 0, debt: 0, loyaltyPoints: 200 },
    { id: 'C005', code: 'KH005', name: 'Phạm Văn E', phone: '0966666666', address: '654 Xô Viết Nghệ Tĩnh, Q.Bình Thạnh, TP.HCM', totalSpent: 0, debt: 0, loyaltyPoints: 5 },
  ];

  // Tính tổng chi tiêu từ orders
  return customers.map(c => {
    const customerOrders = orders.filter(o => o.customerId === c.id);
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const rank = calculateCustomerRank(c.id, orders, rankConfigs);
    return {
      ...c,
      totalSpent,
      rank: rank.rankKey,
      lastPurchaseDate: customerOrders.length > 0 ? customerOrders[0].date : undefined,
    };
  });
}

// ─── RANK COLOR HELPERS ──────────────────────────────────────

export const RANK_BG_COLORS: Record<string, string> = {
  diamond: 'bg-blue-100',
  gold: 'bg-amber-100',
  silver: 'bg-gray-100',
  bronze: 'bg-orange-100',
  regular: 'bg-gray-50',
};

export const RANK_TEXT_COLORS: Record<string, string> = {
  diamond: 'text-blue-700',
  gold: 'text-amber-700',
  silver: 'text-gray-600',
  bronze: 'text-orange-700',
  regular: 'text-gray-400',
};

export const RANK_BADGE_CLASSES: Record<string, string> = {
  diamond: 'bg-blue-100 text-blue-700',
  gold: 'bg-amber-100 text-amber-700',
  silver: 'bg-gray-100 text-gray-600',
  bronze: 'bg-orange-100 text-orange-700',
  regular: 'bg-gray-50 text-gray-400',
};

export function getRankBadgeClass(rankKey: string): string {
  return RANK_BADGE_CLASSES[rankKey] || 'bg-gray-100 text-gray-600';
}