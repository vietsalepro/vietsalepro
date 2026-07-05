import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Order } from '../../types';
import { capitalizeProductName } from '../stringHelper';
import { AppError } from '../errors';

/**
 * Export orders to Excel file with 2 sheets:
 * - Sheet 1: Order summary
 * - Sheet 2: Order items detail
 */
export async function exportOrdersToExcel(
  orders: Order[],
  filters?: {
    startDate?: string;
    endDate?: string;
    customerSearch?: string;
  }
): Promise<void> {
  
  if (!orders || orders.length === 0) {
    throw new AppError('Không có đơn hàng để xuất', 'NO_ORDERS_TO_EXPORT');
  }

  // 1. Tạo workbook mới
  const wb = XLSX.utils.book_new();
  
  // 2. Sheet 1: Tổng quan đơn hàng
  const summaryData = orders.map(order => ({
    "Mã đơn": order.id,
    "Ngày tạo": formatDate(order.date),
    "Mã khách": order.customerId || '',
    "Tên khách hàng": order.customerName || 'Khách vãng lai',
    "Tổng tiền": order.totalAmount || 0,
    "Khách trả": order.paidAmount || 0,
    "Ghi nợ": order.debtRecorded || 0,
    "PT Thanh toán": order.paymentMethod || 'cash',
    "Trạng thái": translateStatus(order.status),
    "Điểm tích": order.pointsEarned || 0,
    "Điểm đổi": order.pointsRedeemed || 0,
    "Ghi chú": order.note || '',
    "Có trả hàng": order.hasReturn ? 'Có' : 'Không',
    "Tiền đã trả": order.totalReturnedAmount || 0
  }));
  
  const ws1 = XLSX.utils.json_to_sheet(summaryData);
  
  // 3. Định dạng độ rộng cột
  ws1['!cols'] = [
    { wch: 12 }, // Mã đơn
    { wch: 18 }, // Ngày tạo
    { wch: 15 }, // Mã khách
    { wch: 25 }, // Tên KH
    { wch: 15 }, // Tổng tiền
    { wch: 15 }, // Khách trả
    { wch: 12 }, // Ghi nợ
    { wch: 15 }, // PT TT
    { wch: 12 }, // Trạng thái
    { wch: 10 }, // Điểm tích
    { wch: 10 }, // Điểm đổi
    { wch: 30 }, // Ghi chú
    { wch: 12 }, // Có trả hàng
    { wch: 15 }  // Tiền đã trả
  ];
  
  XLSX.utils.book_append_sheet(wb, ws1, "Đơn hàng");
  
  // 4. Sheet 2: Chi tiết sản phẩm
  const detailData: any[] = [];
  orders.forEach(order => {
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        detailData.push({
          "Mã đơn": order.id,
          "Mã SP": item.productId || '',
          "Tên sản phẩm": capitalizeProductName(item.productName || ''),
          "Đơn vị": item.unitName || 'cái',
          "Số lượng": item.quantity || 0,
          "Đơn giá": item.price || 0,
          "Thành tiền": (item.quantity || 0) * (item.price || 0)
        });
      });
    }
  });
  
  const ws2 = XLSX.utils.json_to_sheet(detailData);
  ws2['!cols'] = [
    { wch: 12 },  // Mã đơn
    { wch: 15 },  // Mã SP
    { wch: 35 },  // Tên sản phẩm
    { wch: 10 },  // Đơn vị
    { wch: 10 },  // Số lượng
    { wch: 15 },  // Đơn giá
    { wch: 15 }   // Thành tiền
  ];
  
  XLSX.utils.book_append_sheet(wb, ws2, "Chi tiết SP");
  
  // 5. Export file
  const fileName = generateFileName(filters);
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, fileName);
}

/**
 * Tạo & tải file Excel MẪU để người dùng điền dữ liệu trước khi Import.
 * Gồm 2 sheet đúng định dạng hệ thống cần (Đơn hàng + Chi tiết SP) kèm dòng ví dụ.
 */
export async function downloadOrderTemplate(): Promise<void> {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Đơn hàng — 1 dòng dữ liệu mẫu để hướng dẫn
  const sampleOrders = [
    {
      'Mã đơn': 'DH001',
      'Ngày tạo': '15/06/2026',
      'Mã khách': 'KH000001',
      'Tên khách hàng': 'Nguyễn Văn A',
      'Tổng tiền': 150000,
      'Khách trả': 150000,
      'Ghi nợ': 0,
      'PT Thanh toán': 'cash',
      'Trạng thái': 'Hoàn thành',
      'Điểm tích': 0,
      'Điểm đổi': 0,
      'Ghi chú': 'Đơn nhập từ phần mềm cũ',
      'Có trả hàng': 'Không',
      'Tiền đã trả': 0,
    },
  ];
  const ws1 = XLSX.utils.json_to_sheet(sampleOrders);
  ws1['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Đơn hàng');

  // Sheet 2: Chi tiết SP — 2 dòng mẫu khớp 'Mã đơn' = DH001
  const sampleItems = [
    {
      'Mã đơn': 'DH001',
      'Mã SP': 'SP001',
      'Tên sản phẩm': 'Sản phẩm ví dụ 1',
      'Đơn vị': 'cái',
      'Số lượng': 2,
      'Đơn giá': 50000,
      'Thành tiền': 100000,
    },
    {
      'Mã đơn': 'DH001',
      'Mã SP': 'SP002',
      'Tên sản phẩm': 'Sản phẩm ví dụ 2',
      'Đơn vị': 'cái',
      'Số lượng': 1,
      'Đơn giá': 50000,
      'Thành tiền': 50000,
    },
  ];
  const ws2 = XLSX.utils.json_to_sheet(sampleItems);
  ws2['!cols'] = [
    { wch: 12 }, { wch: 15 }, { wch: 35 }, { wch: 10 },
    { wch: 10 }, { wch: 15 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết SP');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, 'Mau_NhapDonHang.xlsx');
}

/**
 * Format date to Vietnamese locale string
 */
function formatDate(date: string | Date): string {
  try {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return String(date);
  }
}

/**
 * Format date for filename (YYYYMMDD)
 */
function formatDateForFilename(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Translate order status to Vietnamese
 */
function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'completed': 'Hoàn thành',
    'pending': 'Chờ xử lý',
    'cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
}

/**
 * Generate filename with filters info
 */
function generateFileName(filters?: any): string {
  const dateStr = formatDateForFilename(new Date());
  let fileName = `DonHang_${dateStr}`;
  
  if (filters?.startDate || filters?.endDate) {
    fileName += '_Loc';
  }
  
  fileName += '.xlsx';
  return fileName;
}
