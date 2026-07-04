const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { Order, Customer, ReturnOrder, AppSettings } from '../types';
import { ArrowLeft, FileText, User, Calendar, Clock, DollarSign, X, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { useReturnOrder } from '../hooks/useReturnOrder';
import { Card, Button, Badge, EmptyState, Input } from '../components/ui';

interface ReturnOrdersProps {
  customers: Customer[];
  orders: Order[];
  appSettings: AppSettings;
}

type ViewState = 'list' | 'create' | 'detail';

export const ReturnOrders: React.FC<<ReturnOrdersProps> = ({ customers, orders, appSettings }) => {
  const {
    returnOrders,
    returnOrderItems,
    loading,
    error,
    formState,
    formItems,
    setFormState,
    addItem,
    removeItem,
    updateItem,
    submitReturn,
    initializeFromOrder,
  } = useReturnOrder();

  const [view, setView] = useState<<ViewState>('list');
  const [selectedReturn, setSelectedReturn] = useState<<ReturnOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string>('');

  useEffect(() => {
    supabaseService.getReturnOrders().catch(() => {});
  }, []);

  const filteredReturns = returnOrders.filter((r) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      r.id?.toLowerCase().includes(s) ||
      (r.customerName || '').toLowerCase().includes(s)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant=\"warning\">Chờ xác nhận</Badge>;
      case 'completed':
        return <Badge variant=\"success\">Đã hoàn tất</Badge>;
      case 'cancelled':
        return <Badge variant=\"danger\">Đã hủy</Badge>;
      case 'partial':
        return <Badge variant=\"info\">Hoàn tiền một phần</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCreateNew = () => {
    setFormState({
      originalOrderId: '',
      customerName: '',
      customerPhone: '',
      reason: '',
      notes: '',
      status: 'pending',
      totalRefundAmount: 0,
      cashRefund: 0,
      debtReduction: 0,
    });
    setSelectedOrder('');
    setView('create');
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrder(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const customer = order.customerId
        ? customers.find((c) => c.id === order.customerId) || null
        : null;
      initializeFromOrder(order, customer);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await submitReturn();
      if (result) {
        supabaseService.getReturnOrders().then(() => {
          setView('list');
          setFormState({
            originalOrderId: '',
            customerName: '',
            customerPhone: '',
            reason: '',
            notes: '',
            status: 'pending',
            totalRefundAmount: 0,
            cashRefund: 0,
            debtReduction: 0,
          });
        });
      }
    } catch (err) {
      console.error('Error submitting return:', err);
    }
  };

  const handleViewDetail = (r: ReturnOrder) => {
    setSelectedReturn(r);
    setView('detail');
  };

  if (loading && returnOrders.length === 0) {
    return (
      <div className=\"flex items-center justify-center h-64\">
        <Loader2 className=\"w-8 h-8 animate-spin text-blue-500\" />
      </div>
    );
  }

  return (
    <div className=\"p-6\">
      {view === 'list' && (
        <div>
          <div className=\"flex items-center justify-between mb-6\">
            <h1 className=\"text-2xl font-bold\">Trả hàng hoàn tiền</h1>
            <Button onClick={handleCreateNew} className=\"flex items-center gap-2\">
              <FileText className=\"w-4 h-4\" />
              Tạo phiếu trả hàng
            </Button>
          </div>

          {returnOrders.length === 0 ? (
            <EmptyState
              icon={<FileText className=\"w-12 h-12\" />}
              title=\"Chưa có phiếu trả hàng nào\"
              description=\"Nhấn nút 'Tạo phiếu trả hàng' để bắt đầu\"
              action={<Button onClick={handleCreateNew}>Tạo phiếu trả hàng</Button>}
            />
          ) : (
            <div className=\"bg-white rounded-lg shadow\">
              <div className=\"p-4 border-b\">
                <Input
                  placeholder=\"Tìm kiếm phiếu trả hàng...\"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className=\"w-4 h-4\" />}
                />
              </div>
              <div className=\"divide-y\">
                {filteredReturns.map((r) => (
                  <div
                    key={r.id}
                    className=\"p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between\"
                    onClick={() => handleViewDetail(r)}
                  >
                    <div>
                      <div className=\"font-medium\">
                        {r.customerName || 'Khách lẻ'}
                      </div>
                      <div className=\"text-sm text-gray-500 flex items-center gap-2 mt-1\">
                        <Calendar className=\"w-3 h-3\" />
                        {formatDate(r.createdAt)}
                      </div>
                    </div>
                    <div className=\"text-right\">
                      <div className=\"font-medium text-red-600\">
                        -{formatCurrency(r.totalRefundAmount)}
                      </div>
                      <div className=\"mt-1\">{getStatusBadge(r.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'create' && (
        <div>
          <div className=\"flex items-center gap-4 mb-6\">
            <button
              onClick={() => setView('list')}
              className=\"p-2 hover:bg-gray-100 rounded-lg\"
            >
              <ChevronLeft className=\"w-5 h-5\" />
            </button>
            <h1 className=\"text-2xl font-bold\">Tạo phiếu trả hàng</h1>
          </div>

          <form onSubmit={handleSubmitReturn} className=\"space-y-6\">
            <Card className=\"p-6\">
              <h2 className=\"font-semibold mb-4\">Thông tin đơn hàng gốc</h2>
              <div className=\"space-y-4\">
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                    Chọn đơn hàng
                  </label>
                  <select
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500\"
                    value={selectedOrder}
                    onChange={(e) => handleSelectOrder(e.target.value)}
                  >
                    <option value=\"\">-- Chọn đơn hàng --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} -{' '}
                        {((o as any).customerName as string) || 'Khách lẻ'} -{' '}
                        {formatCurrency((o as any).total as number)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                    Lý do trả hàng
                  </label>
                  <textarea
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500\"
                    rows={3}
                    value={formState.reason}
                    onChange={(e) =>
                      setFormState({ ...formState, reason: e.target.value })
                    }
                    placeholder=\"Nhập lý do trả hàng...\"
                    required
                  />
                </div>
              </div>
            </Card>

            <Card className=\"p-6\">
              <div className=\"flex items-center justify-between mb-4\">
                <h2 className=\"font-semibold\">Sản phẩm trả lại</h2>
              </div>

              {formItems.length === 0 ? (
                <p className=\"text-gray-500 text-sm\">
                  Vui lòng chọn đơn hàng để hiển thị sản phẩm
                </p>
              ) : (
                <div className=\"space-y-3\">
                  {formItems.map((item, index) => (
                    <div
                      key={index}
                      className=\"flex items-center gap-4 p-3 bg-gray-50 rounded-lg\"
                    >
                      <div className=\"flex-1\">
                        <div className=\"font-medium\">
                          {item.productName || item.productId}
                        </div>
                        <div className=\"text-sm text-gray-500\">
                          Đơn giá: {formatCurrency(item.unitPrice)} | Số lượng:{' '}
                          {item.quantity}
                        </div>
                      </div>
                      <div className=\"flex items-center gap-2\">
                        <div className=\"text-right\">
                          <div className=\"text-sm text-gray-500\">Trả lại</div>
                          <input
                            type=\"number\"
                            className=\"w-16 px-2 py-1 border border-gray-300 rounded text-center\"
                            value={item.returnQuantity}
                            min={0}
                            max={item.quantity}
                            onChange={(e) =>
                              updateItem(index, {
                                returnQuantity: Math.min(
                                  parseInt(e.target.value) || 0,
                                  item.quantity
                                ),
                              })
                            }
                          />
                        </div>
                        {item.returnQuantity > 0 && (
                          <div className=\"text-right\">
                            <div className=\"text-sm text-gray-500\">Thành tiền</div>
                            <div className=\"font-medium text-red-600\">
                              -{formatCurrency(item.returnQuantity * item.unitPrice)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className=\"p-6\">
              <h2 className=\"font-semibold mb-4\">Phương thức hoàn tiền</h2>
              <div className=\"space-y-4\">
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                    Tiền mặt hoàn trả
                  </label>
                  <input
                    type=\"number\"
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500\"
                    value={formState.cashRefund}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        cashRefund: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                    Giảm công nợ
                  </label>
                  <input
                    type=\"number\"
                    className=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500\"
                    value={formState.debtReduction}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        debtReduction: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className=\"pt-2 border-t\">
                  <div className=\"flex justify-between text-lg font-bold\">
                    <span>Tổng hoàn trả</span>
                    <span className=\"text-red-600\">
                      {formatCurrency(formState.totalRefundAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {error && (
              <div className=\"text-red-500 text-sm bg-red-50 p-3 rounded-lg\">
                {error}
              </div>
            )}

            <div className=\"flex justify-end gap-3\">
              <Button
                type=\"button\"
                variant=\"secondary\"
                onClick={() => setView('list')}
              >
                Hủy
              </Button>
              <Button type=\"submit\" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Xác nhận trả hàng'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {view === 'detail' && selectedReturn && (
        <div>
          <div className=\"flex items-center gap-4 mb-6\">
            <button
              onClick={() => {
                setView('list');
                setSelectedReturn(null);
              }}
              className=\"p-2 hover:bg-gray-100 rounded-lg\"
            >
              <ChevronLeft className=\"w-5 h-5\" />
            </button>
            <h1 className=\"text-2xl font-bold\">Chi tiết phiếu trả hàng</h1>
          </div>

          <div className=\"space-y-6\">
            <Card className=\"p-6\">
              <div className=\"flex items-center justify-between mb-4\">
                <h2 className=\"font-semibold\">Thông tin phiếu trả</h2>
                {getStatusBadge(selectedReturn.status)}
              </div>
              <div className=\"grid grid-cols-2 gap-4\">
                <div>
                  <div className=\"text-sm text-gray-500\">Mã phiếu</div>
                  <div className=\"font-medium\">{selectedReturn.id}</div>
                </div>
                <div>
                  <div className=\"text-sm text-gray-500\">Đơn hàng gốc</div>
                  <div className=\"font-medium\">{selectedReturn.originalOrderId}</div>
                </div>
                <div>
                  <div className=\"text-sm text-gray-500\">Khách hàng</div>
                  <div className=\"font-medium\">
                    {selectedReturn.customerName || 'Khách lẻ'}
                  </div>
                </div>
                <div>
                  <div className=\"text-sm text-gray-500\">Ngày tạo</div>
                  <div className=\"font-medium\">
                    {formatDate(selectedReturn.createdAt)}
                  </div>
                </div>
                <div className=\"col-span-2\">
                  <div className=\"text-sm text-gray-500\">Lý do</div>
                  <div className=\"font-medium\">{selectedReturn.reason}</div>
                </div>
              </div>
            </Card>

            <Card className=\"p-6\">
              <h2 className=\"font-semibold mb-4\">Sản phẩm trả lại</h2>
              <table className=\"w-full text-sm\">
                <thead>
                  <tr className=\"border-b\">
                    th<th className=\"text-left py-2\">Sản phẩm</th>
                    th<th className=\"text-right py-2\">SL mua</th>
                    th<th className=\"text-right py-2\">SL trả</th>
                    th<th className=\"text-right py-2\">Đơn giá</th>
                    th<th className=\"text-right py-2\">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {returnOrderItems
                    .filter((item) => item.returnOrderId === selectedReturn.id)
                    .map((item, index) => (
                      <tr key={index} className=\"border-b\">
                        <td className=\"py-2\">
                          {item.productName || item.productId}
                        </td>
                        <td className=\"text-right py-2\">{item.quantity}</td>
                        <td className=\"text-right py-2 text-red-600\">
                          {item.returnQuantity}
                        </td>
                        <td className=\"text-right py-2\">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className=\"text-right py-2 text-red-600 font-medium\">
                          -{formatCurrency(item.returnQuantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Card>

            <Card className=\"p-6\">
              <h2 className=\"font-semibold mb-4\">Chi tiết hoàn tiền</h2>
              <div className=\"space-y-2\">
                <div className=\"flex justify-between\">
                  <span>Tiền mặt hoàn trả</span>
                  <span className=\"font-medium\">
                    {formatCurrency(selectedReturn.cashRefund)}
                  </span>
                </div>
                <div className=\"flex justify-between\">
                  <span>Giảm công nợ</span>
                  <span className=\"font-medium\">
                    {formatCurrency(selectedReturn.debtReduction)}
                  </span>
                </div>
                <div className=\"flex justify-between pt-2 border-t text-lg font-bold\">
                  <span>Tổng hoàn trả</span>
                  <span className=\"text-red-600\">
                    {formatCurrency(selectedReturn.totalRefundAmount)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnOrders;
`;

fs.writeFileSync('pages/ReturnOrders.tsx', content, 'utf8');
console.log('File created successfully');