import React, { useState, useEffect } from 'react';
import { History, Package } from 'lucide-react';
import { Customer } from '../../../types';
import { supabaseService } from '../../../services/supabaseService';
import { MasterModal } from '../../MasterModal';
import { ActionButton } from '../../ActionButton';
import { EmptyState } from '../../EmptyState';
import './CustomerOrdersModal.css';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

interface OrderItem {
  id: string;
  date: string;
  totalAmount: number;
  items: { productName: string; quantity: number }[];
  status: string;
}

/**
 * CustomerOrdersModal — Modal lịch sử mua hàng
 * - Uses MasterModal container with standardized shell
 * - Uses EmptyState / LoadingState for state handling
 * - Uses ActionButton for close action
 * - CSS-driven styling via CustomerOrdersModal.css
 */
export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen, onClose, customer
}) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await supabaseService.getOrders();
        const customerOrders = data.filter((o: any) =>
          o.customerId === customer.id || o.customer_id === customer.id
        ).slice(0, 20);
        setOrders(customerOrders);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, customer.id]);

  if (!isOpen) return null;

  const formatPrice = (p: number) => p.toLocaleString('vi-VN');

  // ─── Customer info renderer ─────────────────────────────
  const renderCustomerInfo = () => (
    <div className="customer-orders-info">
      <div className="customer-orders-avatar">
        {customer.name.charAt(0).toUpperCase()}
      </div>
      <div className="customer-orders-info-text">
        <p className="customer-orders-name">{customer.name}</p>
        <p className="customer-orders-phone">{customer.phone || ''}</p>
      </div>
    </div>
  );

  // ─── Order list renderer ────────────────────────────────
  const renderOrderList = () => (
    <div className="customer-orders-list">
      {orders.map(order => (
        <div key={order.id} className="customer-orders-card">
          <div className="customer-orders-card-header">
            <div className="customer-orders-card-meta">
              <span className="customer-orders-card-id">
                {order.id}
              </span>
              <span className="customer-orders-card-date">
                {new Date(order.date).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <span className="customer-orders-card-total">
              {formatPrice(order.totalAmount)}₫
            </span>
          </div>
          <div className="customer-orders-card-items">
            {order.items?.map((item, i) => (
              <span key={i}>
                {item.productName} x{item.quantity}
                {i < order.items.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderBody = () => {
    if (loading) return null; // MasterModal handles isLoading natively
    if (orders.length === 0) {
      return (
        <EmptyState
          icon={<Package className="customer-orders-empty-icon" />}
          title="Chưa có đơn hàng nào"
          compact
        />
      );
    }
    return (
      <>
        {renderCustomerInfo()}
        {renderOrderList()}
      </>
    );
  };

  const renderFooter = () => (
    <ActionButton variant="ghost" onClick={onClose} fullWidth>
      Đóng
    </ActionButton>
  );

  return (
    <MasterModal
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch sử mua hàng"
      icon={<History className="w-5 h-5" />}
      size="sm"
      isLoading={loading}
      footer={renderFooter()}
    >
      {renderBody()}
    </MasterModal>
  );
};
