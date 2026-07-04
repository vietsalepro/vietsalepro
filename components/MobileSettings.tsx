import React, { useState, useRef, useEffect } from 'react';
import {
  Printer, Gift, Percent, Star, Database, Save, X, Settings as SettingsIcon,
  ChevronRight, Upload, Download, Trash2, Plus, ArrowLeft, Check, Eye, EyeOff,
  Store, Phone, MapPin, CreditCard, FileText, Heart, Percent as PercentIcon,
  Image, RefreshCw, DollarSign, Tag, Layers, ShoppingBag, Search, RotateCcw
} from 'lucide-react';
import { AppSettings, Reward, Promotion, PromotionType, CustomerRank, PromotionTier, Product } from '../types';
import { supabaseService } from '../services/supabaseService';
import { getPromotionTypeLabel } from '../utils/promotionUtils';
import { DEFAULT_RANK_CONFIGS, calculateCustomerRank } from '../utils/rankingEngine';
import { useNavigate, Link } from 'react-router-dom';
import './MobileSettings.css';

interface MobileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  rewards: any[];
  onUpdateSettings: (settings: AppSettings) => void;
  onAddReward: (reward: any) => void;
  onDeleteReward: (id: string) => void;
  promotions?: any[];
  onAddPromotion?: (promotion: any) => void;
  onUpdatePromotion?: (promotion: any) => void;
  onDeletePromotion?: (id: string) => void;
}

type MobileTabId = 'main' | 'print' | 'points' | 'rewards' | 'promotions' | 'ranking' | 'returns' | 'backup';

const FONT_OPTIONS = [
  'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia',
  'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Lucida Console'
];

const PRINT_SIZE_OPTIONS = [
  { value: '80mm', label: '80mm - Tiêu chuẩn' },
  { value: '58mm', label: '58mm - Mini' },
  { value: 'A4', label: 'A4 - Khổ lớn' },
];

const PROMOTION_TYPE_ICONS: Record<string, React.ElementType> = {
  percent_on_total: Percent,
  fixed_on_total: DollarSign,
  percent_on_product: Tag,
  percent_on_category: Layers,
  buy_x_get_y: ShoppingBag,
  tiered_quantity: Star,
  combo: Layers,
  customer_rank: Star,
};

const PROMOTION_TYPE_LABELS: Record<string, string> = {
  percent_on_total: 'Giảm % tổng hóa đơn',
  fixed_on_total: 'Giảm số tiền cố định',
  percent_on_product: 'Giảm giá SP cụ thể',
  percent_on_category: 'Giảm giá theo nhóm hàng',
  buy_x_get_y: 'Mua X tặng Y',
  tiered_quantity: 'Chiết khấu theo số lượng',
  combo: 'Combo mua kèm',
  customer_rank: 'Theo hạng khách hàng',
};

const RANK_OPTIONS: string[] = ['Diamond', 'Gold', 'Silver', 'Bronze', 'Regular'];

function emptyPromotion(): any {
  return {
    id: `PM${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
    name: '',
    type: 'percent_on_total',
    description: '',
    isActive: true,
    // Phase 9: mặc định ưu tiên 0, không điều kiện, không cộng dồn
    priority: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    stackable: false,
    discountPercent: undefined,
    discountFixed: undefined,
    targetProductId: undefined,
    targetCategory: undefined,
    targetProductIds: [],
    buyProductId: undefined,
    buyQuantity: undefined,
    giftProductId: undefined,
    giftQuantity: undefined,
    giftDiscountPercent: undefined,
    tiers: undefined,
    mainProductId: undefined,
    comboProductId: undefined,
    comboDiscountPercent: undefined,
    minCustomerRank: undefined,
    startDate: undefined,
    endDate: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any;
}

interface SettingsGroup {
  title: string;
  items: {
    id: MobileTabId;
    label: string;
    icon: React.ElementType;
    desc: string;
    color: string;
  }[];
}

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: 'CỬA HÀNG',
    items: [
      { id: 'print', label: 'In hoá đơn', icon: Printer, desc: 'Mẫu in, logo, thông tin cửa hàng', color: 'bg-blue-500' },
      { id: 'returns', label: 'Trả hàng', icon: RotateCcw, desc: 'Cấu hình phí và hạn trả hàng', color: 'bg-indigo-500' },
    ]
  },
  {
    title: 'KHUYẾN MÃI & ĐIỂM',
    items: [
      { id: 'points', label: 'Điểm thưởng', icon: Gift, desc: 'Tỷ lệ quy đổi điểm tích luỹ', color: 'bg-purple-500' },
      { id: 'rewards', label: 'Quà tặng', icon: Gift, desc: 'Đổi điểm lấy quà', color: 'bg-rose-500' },
      { id: 'promotions', label: 'Khuyến mãi', icon: Percent, desc: 'Chương trình giảm giá', color: 'bg-orange-500' },
    ]
  },
  {
    title: 'KHÁCH HÀNG',
    items: [
      { id: 'ranking', label: 'Phân hạng KH', icon: Star, desc: 'Xếp hạng khách hàng thân thiết', color: 'bg-amber-500' },
    ]
  },
  {
    title: 'DỮ LIỆU',
    items: [
      { id: 'backup', label: 'Sao lưu', icon: Database, desc: 'Sao lưu & khôi phục dữ liệu', color: 'bg-emerald-500' },
    ]
  },
];

// ============= FORMAT HELPERS =============
const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN');

// ============= PREVIEW COMPONENT =============
const PrintPreview = ({
  config,
  previewData,
  onClose,
}: {
  config: any;
  previewData: any;
  onClose: () => void;
}) => {
  const { fontFamily, fontSize, printSize, logo, storeName, storeAddress, taxCode, invoiceTitle, bankInfo, storePhone, loyaltyPolicy, promoInfo, thankYouMessage } = config;
  const isA4 = printSize === 'A4';

  const previewWidth = isA4 ? '210mm' : printSize === '58mm' ? '48mm' : '72mm';
  const previewScale = isA4 ? '210mm' : printSize === '58mm' ? '58mm' : '80mm';

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Preview toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span className="vsp-text-sm vsp-font-medium text-gray-700">Xem trước hoá đơn</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="vsp-text-xxs vsp-font-regular text-gray-400 bg-white px-2.5 py-1 rounded-full border border-gray-200">
              {printSize}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 active:bg-gray-300 transition-all hover:rotate-90 duration-300"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Preview content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100/50">
          <div
            className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
            style={{
              width: '100%',
              maxWidth: previewWidth,
              fontFamily: `"${fontFamily}", sans-serif`,
              fontSize: `${fontSize}px`,
            }}
          >
            {/* Receipt header */}
            <div className="px-3 py-4 text-center">
              {logo && (
                <div className="mb-2 flex justify-center animate-fade-in">
                  <img src={logo} alt="Logo" className="max-h-14 object-contain rounded-lg ms-preview-logo" />
                </div>
              )}
              <div className="font-bold uppercase tracking-wide ms-preview-store-name">
                {storeName || 'CỬA HÀNG'}
              </div>
              {storeAddress && (
                <div className="text-gray-500 text-[0.85em] italic mt-0.5">{storeAddress}</div>
              )}
              {taxCode && (
                <div className="text-gray-400 text-[0.8em] mt-0.5">MST: {taxCode}</div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 mx-3"></div>

            {/* Invoice title */}
            <div className="text-center font-bold py-2 uppercase tracking-wider ms-preview-invoice-title">
              {invoiceTitle || 'HÓA ĐƠN THANH TOÁN'}
            </div>

            <div className="border-t border-dashed border-gray-300 mx-3"></div>

            {/* Invoice info */}
            <div className="px-3 py-2 space-y-1 text-[0.9em]">
              <div className="flex justify-between">
                <span className="text-gray-500">Số HĐ:</span>
                <span className="font-semibold">{previewData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ngày:</span>
                <span>{previewData.date}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 mx-3"></div>

            {/* Customer */}
            <div className="px-3 py-2 space-y-1 text-[0.9em]">
              <div className="flex justify-between">
                <span>Khách hàng: <span className="font-semibold">{previewData.customerName}</span></span>
                <span className="text-gray-500">{previewData.phone}</span>
              </div>
              <div className="flex justify-between text-[0.85em]">
                <span>Tổng điểm: <span className="font-semibold text-amber-600">{previewData.loyaltyPoints}</span></span>
                <span>Điểm mới: <span className="font-semibold text-green-600">+{previewData.pointsEarned}</span></span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 mx-3"></div>

            {/* Items table header */}
            <div className="px-3 py-1.5 flex justify-between text-[0.8em] font-bold text-gray-500 uppercase tracking-wider">
              <span className="flex-1">Tên hàng</span>
              <span className="w-12 text-center">SL</span>
              <span className="w-20 text-right">Đơn giá</span>
              <span className="w-20 text-right">T.tiền</span>
            </div>

            <div className="border-t border-gray-200 mx-3"></div>

            {/* Items */}
            <div className="px-3 py-1 space-y-2">
              {previewData.items.map((item: any, idx: number) => (
                <div key={idx} className="animate-slide-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="font-semibold text-[0.9em]">✿ {item.productName}</div>
                  <div className="flex justify-between text-[0.85em] text-gray-600">
                    <span className="flex-1">{item.unitName} × {item.quantity}</span>
                    <span className="w-20 text-right">{formatCurrency(item.price)}</span>
                    <span className="w-20 text-right font-semibold">{formatCurrency(item.quantity * item.price)}</span>
                  </div>
                  {idx < previewData.items.length - 1 && (
                    <div className="border-t border-dotted border-gray-200 mt-1.5 pt-1.5"></div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 mx-3 mt-2"></div>

            {/* Totals */}
            <div className="px-3 py-2 space-y-1">
              <div className="flex justify-between text-[0.9em]">
                <span>Tổng tiền hàng:</span>
                <span className="font-semibold">{formatCurrency(previewData.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[0.9em]">
                <span>Giảm giá:</span>
                <span>0</span>
              </div>
              <div className="border-t border-gray-300 pt-1.5 flex justify-between font-bold ms-preview-total">
                <span>TỔNG THANH TOÁN:</span>
                <span className="ms-preview-accent">{formatCurrency(previewData.totalAmount)}</span>
              </div>
            </div>

            {/* Extra info */}
            <div className="border-t border-dashed border-gray-300 mx-3"></div>
            <div className="px-3 py-2 text-[0.8em] space-y-2">
              {loyaltyPolicy && (
                <div className="italic text-gray-500 leading-relaxed">{loyaltyPolicy}</div>
              )}
              {bankInfo && (
                <div>
                  <div className="font-bold text-center text-[0.9em] uppercase tracking-wide mb-1">THÔNG TIN CHUYỂN KHOẢN</div>
                  <div className="italic text-gray-500 whitespace-pre-line">{bankInfo}</div>
                </div>
              )}
              {promoInfo && (
                <div className="text-center font-semibold text-[0.9em] ms-preview-accent">{promoInfo}</div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300 mx-3"></div>

            {/* Footer */}
            <div className="px-3 py-3 text-center space-y-1">
              {storePhone && (
                <div className="text-[0.85em]">☎ <a href={`tel:${storePhone}`} className="text-blue-600">{storePhone}</a></div>
              )}
              <div className="font-semibold italic text-[0.9em] ms-preview-accent">
                {thankYouMessage || 'Cảm ơn và hẹn gặp lại!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-scale-in { animation: scaleIn 0.25s ease-out; }
        .animate-slide-in { animation: slideIn 0.3s ease-out both; }
      `}</style>
    </div>
  );
};

export function MobileSettings(props: MobileSettingsProps) {
  const {
    isOpen, onClose, settings, rewards, onUpdateSettings, onAddReward, onDeleteReward,
    promotions: propsPromotions = [], onDeletePromotion: onDeletePromotionProp
  } = props;
  const onDeleteProm = onDeletePromotionProp || (() => {});
  const [activeTab, setActiveTab] = useState('main' as MobileTabId);
  const navigate = useNavigate();

  const [printConfig, setPrintConfig] = useState<any>({
    storeName: settings.storeName || '',
    storePhone: settings.storePhone || '',
    storeAddress: settings.storeAddress || '',
    taxCode: settings.taxCode || '',
    bankInfo: settings.bankInfo || '',
    printSize: settings.printSize || '80mm',
    fontSize: settings.fontSize || 11,
    fontFamily: settings.fontFamily || 'Arial',
    logo: settings.logo || '',
    invoiceTitle: settings.invoiceTitle || 'HÓA ĐƠN THANH TOÁN',
    loyaltyPolicy: settings.loyaltyPolicy || '',
    promoInfo: settings.promoInfo || '',
    thankYouMessage: settings.thankYouMessage || 'Cảm ơn và hẹn gặp lại!'
  });
  const logoInputRef = useRef<any>(null!);
  const [showPreview, setShowPreview] = useState(false);

  const [previewData] = useState({
    id: 'HĐ-00001',
    date: new Date().toLocaleDateString('vi-VN'),
    customerName: 'Nguyễn Văn A',
    phone: '0912 345 678',
    pointsEarned: 150,
    loyaltyPoints: 1250,
    totalAmount: 285000,
    items: [
      { productName: 'Cà phê sữa đá', unitName: 'Ly', quantity: 2, price: 35000 },
      { productName: 'Bánh mì thịt', unitName: 'Cái', quantity: 1, price: 25000 },
      { productName: 'Nước suối', unitName: 'Chai', quantity: 3, price: 10000 },
      { productName: 'Trà đào', unitName: 'Ly', quantity: 2, price: 45000 },
    ]
  });

  const [rate, setRate] = useState(settings.pointConversionRate);

  const [newReward, setNewReward] = useState({ name: '', pointCost: 0, stock: 0, description: '' });

  const [showPromoForm, setShowPromoForm] = useState(false);

  const [rankConfigs, setRankConfigs] = useState<any[]>([]);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<any>(null!);

  // ─── RETURN FEE STATE ──────────────────────────────────────────────
  const [returnConfig, setReturnConfig] = useState({
    returnFeeEnabled: settings.returnFeeEnabled ?? false,
    returnMaxDays: settings.returnMaxDays ?? 0,
    returnFeePercent: settings.returnFeePercent ?? 0,
  });

  // Đồng bộ lại khi settings thay đổi
  useEffect(() => {
    setReturnConfig({
      returnFeeEnabled: settings.returnFeeEnabled ?? false,
      returnMaxDays: settings.returnMaxDays ?? 0,
      returnFeePercent: settings.returnFeePercent ?? 0,
    });
  }, [settings.returnFeeEnabled, settings.returnMaxDays, settings.returnFeePercent]);

  const handleSaveReturnConfig = async () => {
    await onUpdateSettings({
      ...settings,
      returnFeeEnabled: returnConfig.returnFeeEnabled,
      returnMaxDays: Math.max(0, Math.floor(Number(returnConfig.returnMaxDays) || 0)),
      returnFeePercent: Math.max(0, Number(returnConfig.returnFeePercent) || 0),
    });
    alert('Đã lưu cài đặt trả hàng!');
  };

  // ─── RANK CONFIG EDITING STATE ──────────────────────────────────────
  const [editingRank, setEditingRank] = useState<any | null>(null);
  const [showRankForm, setShowRankForm] = useState(false);
  const [rankOrders, setRankOrders] = useState<any[]>([]);
  const [isRankLoading, setIsRankLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'ranking') {
      const loadRankConfigs = async () => {
        try {
          const configs = await supabaseService.getRankConfigs();
          if (configs.length > 0) {
            setRankConfigs(configs);
          } else {
            setRankConfigs(DEFAULT_RANK_CONFIGS);
          }
        } catch (error) {
          console.error('Error loading rank configs:', error);
        }
      };
      loadRankConfigs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'ranking') {
      const loadOrders = async () => {
        try {
          setIsRankLoading(true);
          const { orders } = await supabaseService.getOrdersPaginated(1, 5000);
          setRankOrders(orders);
        } catch (error) {
          console.error('Error loading orders for ranking:', error);
        } finally {
          setIsRankLoading(false);
        }
      };
      loadOrders();
    }
  }, [activeTab]);

  const handleAddRank = () => {
    const newRank: any = {
      id: `RC${Date.now()}`,
      name: '',
      key: '',
      color: '#6B7280',
      description: '',
      order: rankConfigs.length,
      isDefault: false,
      conditions: [],
      discountPercent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingRank(newRank);
    setShowRankForm(true);
  };

  const handleEditRank = (config: any) => {
    setEditingRank({ ...config });
    setShowRankForm(true);
  };

  const handleSaveRank = async () => {
    if (!editingRank) return;
    if (!editingRank.name.trim() || !editingRank.key.trim()) {
      alert('Vui lòng nhập tên hạng và key.');
      return;
    }

    try {
      const updated = {
        ...editingRank,
        updatedAt: new Date().toISOString(),
      };

      const existing = rankConfigs.find(r => r.id === updated.id);
      if (existing) {
        setRankConfigs(prev => prev.map(r => r.id === updated.id ? updated : r));
      } else {
        setRankConfigs(prev => [...prev, updated]);
      }

      await supabaseService.upsertRankConfig(updated);
      setShowRankForm(false);
      setEditingRank(null);
      alert('Đã lưu cấu hình hạng!');
    } catch (error) {
      console.error('Error saving rank config:', error);
      alert('Lỗi lưu cấu hình hạng.');
    }
  };

  const handleDeleteRank = async (id: string) => {
    if (!confirm('Xoá hạng này?')) return;
    try {
      await supabaseService.deleteRankConfig(id);
      setRankConfigs(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting rank config:', error);
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setIsRankLoading(true);
      
      let allOrders = [...rankOrders];
      if (allOrders.length === 0) {
        const { orders } = await supabaseService.getOrdersPaginated(1, 5000);
        allOrders = orders;
        setRankOrders(orders);
      }

      // Bulk rank recalc — đặc thù, không phải màn hình display
      const allCustomers = await supabaseService.getCustomers();
      
      let changedCount = 0;
      for (const customer of allCustomers) {
        const result = calculateCustomerRank(customer.id, allOrders, rankConfigs);
        if (customer.rank !== result.rankKey) {
          const updatedCustomer = { ...customer, rank: result.rankKey as any };
          await supabaseService.upsertCustomer(updatedCustomer);
          changedCount++;
        }
      }
      
      alert(`Đã tính lại hạng cho ${allCustomers.length} khách hàng. ${changedCount} khách hàng thay đổi hạng.`);
    } catch (error) {
      console.error('Error recalculating ranks:', error);
      alert('Lỗi tính lại hạng.');
    } finally {
      setIsRankLoading(false);
    }
  };

  const updateRankField = (key: string, value: any) => {
    if (!editingRank) return;
    setEditingRank((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<any>) => {
    const file = (e.target as any).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Vui lòng chọn file ảnh.'); return; }
    if (file.size > 500 * 1024) { alert('Logo nên nhỏ hơn 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev: any) => {
      setPrintConfig((prev: any) => ({ ...prev, logo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSavePrintConfig = async () => {
    await onUpdateSettings({ ...settings, ...printConfig } as AppSettings);
    alert('Đã lưu cấu hình in!');
  };

  const handleSavePoints = async () => {
    await onUpdateSettings({ ...settings, pointConversionRate: rate });
    alert('Đã lưu cấu hình điểm!');
  };

  const handleAddReward = () => {
    if (!newReward.name || !newReward.pointCost) return;
    onAddReward({
      id: 'R' + Date.now(),
      name: newReward.name,
      pointCost: Number(newReward.pointCost),
      description: newReward.description,
      stock: Number(newReward.stock || 0)
    });
    setNewReward({ name: '', pointCost: 0, description: '', stock: 0 });
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const backupData = await supabaseService.getFullSystemBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vietsales_backup_' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('Sao lưu thành công!');
    } catch (error) {
      console.error('Backup error:', error);
      alert('Sao lưu thất bại.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<any>) => {
    const file = (e.target as any).files?.[0];
    if (!file) return;
    if (!confirm('Hành động này sẽ ghi đè dữ liệu hiện tại. Bạn có chắc?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      setIsRestoring(true);
      const reader = new FileReader();
      reader.onload = async (event: any) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          await supabaseService.restoreSystemBackup(data);
          alert('Khôi phục thành công! Vui lòng tải lại trang.');
          window.location.reload();
        } catch {
          alert('File backup không hợp lệ.');
        }
      };
      reader.readAsText(file);
    } catch {
      alert('Khôi phục thất bại.');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ============= RENDER HELPERS =============

  const renderHeader = (title: string, subtitle?: string) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
      <button
        onClick={() => setActiveTab('main')}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-1"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  const renderSaveButton = (label: string, onClick: () => void) => (
    <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
      <button
        onClick={onClick}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
      >
        <Save className="w-4 h-4" />
        {label}
      </button>
    </div>
  );

  const renderInput = (label: string, value: string, onChange: (v: string) => void, opts?: { type?: string; placeholder?: string; rows?: number }) => {
    const inputClass = "w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all";
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
        {opts?.rows ? (
          <textarea
            className={inputClass}
            rows={opts.rows}
            value={value}
            placeholder={opts.placeholder}
            onChange={e => onChange(e.target.value)}
          />
        ) : (
          <input
            type={opts?.type || 'text'}
            className={inputClass}
            value={value}
            placeholder={opts?.placeholder}
            onChange={e => onChange(e.target.value)}
          />
        )}
      </div>
    );
  };

  // ============= Card-centric store info component with micro-interactions =============
  const renderStoreInfoCard = () => {
    const fields = [
      { key: 'storeName', label: 'Tên cửa hàng', icon: Store, value: printConfig.storeName, placeholder: 'Nhập tên cửa hàng' },
      { key: 'storePhone', label: 'Số điện thoại', icon: Phone, value: printConfig.storePhone, placeholder: 'Nhập số điện thoại' },
      { key: 'storeAddress', label: 'Địa chỉ', icon: MapPin, value: printConfig.storeAddress, placeholder: 'Nhập địa chỉ' },
      { key: 'taxCode', label: 'Mã số thuế', icon: FileText, value: printConfig.taxCode, placeholder: 'Nhập MST' },
      { key: 'bankInfo', label: 'Thông tin ngân hàng', icon: CreditCard, value: printConfig.bankInfo, placeholder: 'Số tài khoản - Ngân hàng', rows: 2 },
    ];

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-indigo-100 transition-all duration-300">
        {/* Card header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100/50 flex items-center gap-2.5 group-hover:from-indigo-100 group-hover:to-blue-100 transition-all duration-300">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <Store className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-800">Thông tin cửa hàng</span>
            <p className="text-[11px] text-gray-400 mt-0.5">Hiển thị trên hoá đơn</p>
          </div>
          <div className="ml-auto">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-300">
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform duration-300" />
            </div>
          </div>
        </div>

        {/* Card body with micro-interaction fields */}
        <div className="p-3 space-y-2.5">
          {fields.map((field, idx) => {
            const Icon = field.icon;
            const isFilled = !!field.value;

            return (
              <div
                key={field.key}
                className="relative group/field"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className={`
                  flex items-start gap-2.5 p-2.5 rounded-xl border transition-all duration-200
                  ${isFilled
                    ? 'border-indigo-100 bg-indigo-50/30'
                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                  }
                  focus-within:border-indigo-400 focus-within:bg-indigo-50/50 focus-within:shadow-sm
                  active:scale-[0.99] transition-transform duration-150
                `}>
                  <div className={`
                    w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5
                    transition-all duration-300
                    ${isFilled
                      ? 'bg-indigo-100 text-indigo-600 group-hover/field:bg-indigo-200 group-hover/field:scale-110'
                      : 'bg-gray-100 text-gray-400 group-hover/field:bg-gray-200'
                    }
                  `}>
                    <Icon className="w-3.5 h-3.5 transition-transform duration-300 group-hover/field:rotate-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 transition-colors duration-200 group-focus-within/field:text-indigo-500">
                      {field.label}
                    </label>
                    {field.rows ? (
                      <textarea
                        className="w-full bg-transparent border-0 p-0 text-sm text-gray-800 outline-none resize-none placeholder:text-gray-300 font-medium"
                        rows={field.rows}
                        value={field.value}
                        placeholder={field.placeholder}
                        onChange={(e: any) => setPrintConfig((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <input
                        type="text"
                        className="w-full bg-transparent border-0 p-0 text-sm text-gray-800 outline-none placeholder:text-gray-300 font-medium"
                        value={field.value}
                        placeholder={field.placeholder}
                        onChange={(e: any) => setPrintConfig((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                  {isFilled && (
                    <button
                      onClick={() => setPrintConfig((prev: any) => ({ ...prev, [field.key]: '' }))}
                      className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover/field:opacity-100 transition-all duration-200 hover:scale-110"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============= Card-centric text content fields with micro-interactions =============
  const renderTextContentCards = () => {
    const textFields = [
      {
        key: 'invoiceTitle',
        label: 'Tiêu đề hoá đơn',
        icon: FileText,
        value: printConfig.invoiceTitle,
        placeholder: 'VD: HOÁ ĐƠN THANH TOÁN',
        rows: 0,
        description: 'Tiêu đề chính giữa hoá đơn',
      },
      {
        key: 'loyaltyPolicy',
        label: 'Chính sách tích điểm',
        icon: Gift,
        value: printConfig.loyaltyPolicy,
        placeholder: 'VD: Tích 1 điểm cho mỗi 10.000đ mua hàng...',
        rows: 3,
        description: 'Hiển thị trước phần thông tin chuyển khoản',
      },
      {
        key: 'promoInfo',
        label: 'Thông tin khuyến mãi',
        icon: PercentIcon,
        value: printConfig.promoInfo,
        placeholder: 'VD: Giảm 10% cho đơn hàng trên 500.000đ...',
        rows: 3,
        description: 'Hiển thị dưới thông tin chuyển khoản',
      },
      {
        key: 'thankYouMessage',
        label: 'Lời cảm ơn',
        icon: Heart,
        value: printConfig.thankYouMessage,
        placeholder: 'VD: Cảm ơn quý khách! Hẹn gặp lại!',
        rows: 0,
        description: 'Lời chào cuối hoá đơn',
      },
    ];

    return (
      <div className="space-y-3">
        {textFields.map((field, idx) => {
          const Icon = field.icon;
          const isFilled = !!field.value;

          return (
            <div
              key={field.key}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-indigo-100 transition-all duration-300"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Card header */}
              <div className={`
                px-4 py-2.5 border-b flex items-center gap-2.5 transition-all duration-300
                ${isFilled
                  ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100/50 group-hover:from-indigo-100 group-hover:to-blue-100'
                  : 'bg-gradient-to-r from-gray-50 to-gray-50/50 border-gray-100 group-hover:from-gray-100 group-hover:to-gray-50'
                }
              `}>
                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center shadow-sm transition-all duration-300
                  group-hover:scale-110 group-hover:rotate-3
                  ${isFilled
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }
                `}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold transition-colors duration-300 ${isFilled ? 'text-gray-800' : 'text-gray-500'}`}>
                    {field.label}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{field.description}</p>
                </div>
                {isFilled && (
                  <button
                    onClick={() => setPrintConfig((prev: any) => ({ ...prev, [field.key]: '' }))}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Card body - input area */}
              <div className="p-3">
                <div className={`
                  rounded-xl border transition-all duration-200
                  ${isFilled
                    ? 'border-indigo-100 bg-indigo-50/20'
                    : 'border-gray-100 bg-gray-50/50'
                  }
                  focus-within:border-indigo-400 focus-within:bg-indigo-50/40 focus-within:shadow-sm
                  active:scale-[0.99] transition-transform duration-150
                `}>
                  {field.rows ? (
                    <textarea
                      className="w-full bg-transparent border-0 px-3 py-2.5 text-sm text-gray-800 outline-none resize-none placeholder:text-gray-300 font-medium transition-colors duration-200"
                      rows={field.rows}
                      value={field.value}
                      placeholder={field.placeholder}
                      onChange={(e: any) => setPrintConfig((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <input
                        type="text"
                        className="w-full bg-transparent border-0 p-0 text-sm text-gray-800 outline-none placeholder:text-gray-300 font-medium"
                        value={field.value}
                        placeholder={field.placeholder}
                        onChange={(e: any) => setPrintConfig((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
                {/* Character count micro-interaction */}
                <div className="flex items-center justify-end mt-1.5 px-1">
                  <div className={`
                    text-[10px] font-medium transition-all duration-300
                    ${field.value?.length > 0 ? 'text-indigo-400' : 'text-gray-300'}
                  `}>
                    {field.value?.length || 0} ký tự
                    <span className="text-gray-300 mx-0.5">·</span>
                    <span className={`
                      inline-block transition-all duration-300
                      ${field.value?.length > 0 ? 'opacity-100' : 'opacity-0'}
                    `}>
                      {field.value?.length > 80 ? 'Dài' : field.value?.length > 40 ? 'Vừa' : 'Ngắn'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============= PAGES =============

  const renderMainMenu = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Cài đặt</h1>
              <p className="text-xs text-gray-400">Tuỳ chỉnh cửa hàng của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {SETTINGS_GROUPS.map((group, gi) => (
          <div key={gi}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
              {group.title}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{item.label}</div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{item.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer giới thiệu doanh nghiệp */}
        <div className="mt-8 pt-6 border-t border-gray-200/80 text-gray-500 text-xs px-2 pb-8 space-y-4">
          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-800 text-sm">Thông tin doanh nghiệp</h4>
            <p><span className="font-semibold text-gray-700">Tên:</span> HKD Sữa Cậu Ba</p>
            <p><span className="font-semibold text-gray-700">Địa chỉ:</span> 392, Thôn Duy Cần, Xã Tánh Linh, Tỉnh Lâm Đồng</p>
            <p>
              <span className="font-semibold text-gray-700">Hotline tư vấn:</span>{' '}
              <a href="tel:0986495913" className="text-indigo-600 font-medium">0986 495 913</a>
            </p>
            <p>
              <span className="font-semibold text-gray-700">Email:</span>{' '}
              <a href="mailto:vietsalepro@gmail.com" className="text-indigo-600 font-medium">vietsalepro@gmail.com</a>
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-indigo-600 font-medium">
              <span onClick={() => { onClose(); navigate('/gioi-thieu'); }} className="cursor-pointer hover:underline">Giới thiệu</span>
              <span className="text-gray-300">|</span>
              <a href="#" className="hover:underline">Chính sách bảo mật</a>
              <span className="text-gray-300">|</span>
              <a href="#" className="hover:underline">Điều khoản sử dụng</a>
              <span className="text-gray-300">|</span>
              <a href="#" className="hover:underline">Hướng dẫn cài đặt PWA</a>
            </div>
            <p className="text-[10px] text-gray-400">Copyright © 2026 VietSale Pro. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrintSettings = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {renderHeader('In hoá đơn', 'Cấu hình mẫu in, logo, thông tin cửa hàng')}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Logo */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Logo cửa hàng</label>
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 group hover:border-indigo-200 hover:shadow-sm transition-all duration-200">
            {printConfig.logo ? (
              <div className="relative group/logo">
                <img src={printConfig.logo} alt="Logo" className="h-16 w-16 object-contain border rounded-xl bg-gray-50 transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 rounded-xl bg-black/0 group-hover/logo:bg-black/5 transition-colors duration-200" />
              </div>
            ) : (
              <div className="h-16 w-16 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-300 text-xs text-center group-hover:border-indigo-300 group-hover:text-indigo-300 transition-all duration-200">
                <Image className="w-5 h-5" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-4 py-2 text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200 rounded-xl transition-all active:scale-95"
              >
                Chọn ảnh
              </button>
              {printConfig.logo && (
                <button
                  type="button"
                  onClick={() => setPrintConfig((prev: any) => ({ ...prev, logo: '' }))}
                  className="px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 active:bg-red-100 rounded-xl transition-all active:scale-95"
                >
                  Xoá
                </button>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e: any) => handleLogoUpload(e)} />
          </div>
        </div>

        {/* Card-centric Store Info */}
        {renderStoreInfoCard()}

        {/* Kích thước in - Dropdown like font size */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Kích thước in</label>
          <select
            className="w-full border-0 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm border border-gray-100 appearance-none cursor-pointer transition-all hover:border-gray-200 ms-select-dropdown"
            value={printConfig.printSize}
            onChange={(e: any) => setPrintConfig((prev: any) => ({ ...prev, printSize: e.target.value }))}
          >
            {PRINT_SIZE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Cỡ chữ & Font */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Cỡ chữ</label>
            <select
              className="w-full border-0 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm border border-gray-100 appearance-none cursor-pointer transition-all hover:border-gray-200 ms-select-dropdown"
              value={printConfig.fontSize}
              onChange={(e: any) => setPrintConfig((prev: any) => ({ ...prev, fontSize: Number(e.target.value) }))}
            >
              {[9, 10, 11, 12, 13, 14].map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Font chữ</label>
            <select
              className="w-full border-0 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm border border-gray-100 appearance-none cursor-pointer transition-all hover:border-gray-200 ms-select-dropdown"
              value={printConfig.fontFamily}
              onChange={(e: any) => setPrintConfig((prev: any) => ({ ...prev, fontFamily: e.target.value }))}
            >
              {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Card-centric Text Content Cards (Tiêu đề, Chính sách, KM, Lời cảm ơn) */}
        {renderTextContentCards()}
      </div>
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 space-y-2">
        <button
          onClick={() => setShowPreview(true)}
          className="w-full py-3 bg-white text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 active:bg-indigo-100 transition-all border-2 border-indigo-200 hover:border-indigo-400 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Eye className="w-4 h-4" />
          Xem trước hoá đơn
        </button>
        <button
          onClick={handleSavePrintConfig}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-[0.99]"
        >
          <Save className="w-4 h-4" />
          Lưu cấu hình in
        </button>
      </div>
    </div>
  );

  const renderPointsSettings = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {renderHeader('Điểm thưởng', 'Tỷ lệ quy đổi điểm tích luỹ')}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">1 điểm = bao nhiêu tiền?</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3.5 text-lg font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all pr-20"
              value={rate}
              onChange={(e: any) => setRate(Number(e.target.value))}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">VNĐ</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 ml-1">VD: 10.000 = mỗi 10.000đ chi tiêu được 1 điểm</p>
        </div>
      </div>
      {renderSaveButton('Lưu cấu hình điểm', handleSavePoints)}
    </div>
  );

  const renderRewardsSettings = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {renderHeader('Quà tặng', 'Đổi điểm lấy quà')}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Add new reward */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thêm quà tặng mới</h4>
          <input
            className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            placeholder="Tên quà tặng"
            value={newReward.name}
            onChange={(e: any) => setNewReward((prev: any) => ({ ...prev, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1 ml-1">Điểm cần</label>
              <input
                type="number" min="0"
                className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                placeholder="0"
                value={newReward.pointCost}
                onChange={(e: any) => setNewReward((prev: any) => ({ ...prev, pointCost: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 ml-1">Tồn kho</label>
              <input
                type="number" min="0"
                className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                placeholder="0"
                value={newReward.stock}
                onChange={(e: any) => setNewReward((prev: any) => ({ ...prev, stock: Number(e.target.value) }))}
              />
            </div>
          </div>
          <textarea
            className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            rows={2}
            placeholder="Mô tả (không bắt buộc)"
            value={newReward.description || ''}
            onChange={(e: any) => setNewReward((prev: any) => ({ ...prev, description: e.target.value }))}
          />
          <button
            onClick={handleAddReward}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Thêm quà tặng
          </button>
        </div>

        {/* Rewards list */}
        {rewards.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Chưa có quà tặng nào</p>
            <p className="text-xs text-gray-300 mt-1">Thêm quà tặng để khách hàng đổi điểm</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rewards.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{r.name}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                      {(r.pointCost ?? r.pointsCost ?? 0).toLocaleString('vi-VN')} điểm
                    </span>
                    <span className="text-xs text-gray-400">Tồn: {r.stock ?? 0}</span>
                  </div>
                  {r.description && <div className="text-xs text-gray-400 mt-1">{r.description}</div>}
                </div>
                <button
                  onClick={() => onDeleteReward(r.id)}
                  className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const getTypeIcon = (type: any): React.ElementType => {
    return PROMOTION_TYPE_ICONS[type] || Percent;
  };

  const getPromotionDetail = (promo: any): string => {
    // Phase 9: hiển thị ưu tiên + điều kiện + cộng dồn
    const conditions: string[] = [];
    if ((promo.priority ?? 0) > 0) conditions.push(`Ưu tiên ${promo.priority}`);
    if ((promo.minOrderValue ?? 0) > 0) conditions.push(`Đơn tối thiểu ${promo.minOrderValue?.toLocaleString('vi-VN')}đ`);
    if ((promo.maxDiscount ?? 0) > 0) conditions.push(`Giảm tối đa ${promo.maxDiscount?.toLocaleString('vi-VN')}đ`);
    if (promo.stackable) conditions.push('Cộng dồn');
    const prefix = conditions.length > 0 ? `[${conditions.join(' | ')}] ` : '';

    switch (promo.type) {
      case 'percent_on_total':
        if (promo.discountPercent !== undefined) return `${prefix}Giảm ${promo.discountPercent}% tổng hóa đơn`;
        return `${prefix}Giảm % tổng hóa đơn`;
      case 'fixed_on_total':
        if (promo.discountFixed !== undefined) return `${prefix}Giảm ${promo.discountFixed.toLocaleString('vi-VN')}đ`;
        return `${prefix}Giảm số tiền cố định`;
      case 'percent_on_product':
        if (promo.targetProductId && promo.discountPercent !== undefined) return `${prefix}Giảm ${promo.discountPercent}% SP`;
        return `${prefix}Giảm giá SP cụ thể`;
      case 'percent_on_category':
        if (promo.targetCategory && promo.discountPercent !== undefined) return `${prefix}Giảm ${promo.discountPercent}% nhóm ${promo.targetCategory}`;
        return `${prefix}Giảm giá theo nhóm hàng`;
      case 'buy_x_get_y':
        if (promo.buyProductId && promo.giftProductId) return `${prefix}Mua X tặng Y`;
        return `${prefix}Mua X tặng Y`;
      case 'tiered_quantity':
        return `${prefix}Chiết khấu theo số lượng`;
      case 'combo':
        if (promo.mainProductId && promo.comboProductId && promo.comboDiscountPercent !== undefined) return `${prefix}Combo giảm ${promo.comboDiscountPercent}%`;
        return `${prefix}Combo mua kèm`;
      case 'customer_rank':
        if (promo.minCustomerRank) return `${prefix}Cho hạng ${promo.minCustomerRank}+`;
        return `${prefix}Theo hạng khách hàng`;
      default:
        return '';
    }
  };

  const handlePromotionTypeChange = (type: any, promo: any): any => {
    const base = { ...promo, type };
    switch (type) {
      case 'percent_on_total':
        return { ...base, discountPercent: base.discountPercent ?? 0, discountFixed: undefined, targetProductId: undefined, targetCategory: undefined, buyProductId: undefined, giftProductId: undefined, tiers: undefined, mainProductId: undefined, comboProductId: undefined, comboDiscountPercent: undefined, minCustomerRank: undefined };
      case 'fixed_on_total':
        return { ...base, discountFixed: base.discountFixed ?? 0, discountPercent: undefined, targetProductId: undefined, targetCategory: undefined, buyProductId: undefined, giftProductId: undefined, tiers: undefined, mainProductId: undefined, comboProductId: undefined, comboDiscountPercent: undefined, minCustomerRank: undefined };
      case 'percent_on_product':
        return { ...base, discountPercent: base.discountPercent ?? 0, targetProductId: base.targetProductId ?? '', discountFixed: undefined, targetCategory: undefined, buyProductId: undefined, giftProductId: undefined, tiers: undefined, mainProductId: undefined, comboProductId: undefined, comboDiscountPercent: undefined, minCustomerRank: undefined };
      case 'percent_on_category':
        return { ...base, discountPercent: base.discountPercent ?? 0, targetCategory: base.targetCategory ?? '', discountFixed: undefined, targetProductId: undefined, buyProductId: undefined, giftProductId: undefined, tiers: undefined, mainProductId: undefined, comboProductId: undefined, comboDiscountPercent: undefined, minCustomerRank: undefined };
      case 'buy_x_get_y':
        return { ...base, buyProductId: base.buyProductId ?? '', buyQuantity: base.buyQuantity ?? 1, giftProductId: base.giftProductId ?? '', giftQuantity: base.giftQuantity ?? 1, giftDiscountPercent: base.giftDiscountPercent ?? 0, discountPercent: undefined, discountFixed: undefined, targetProductId: undefined, targetCategory: undefined, tiers: undefined, mainProductId: undefined, comboProductId: undefined, comboDiscountPercent: undefined, minCustomerRank: undefined };
      case 'tiered_quantity':
        return { ...base, tiers: base.tiers ?? [{ minQty: 1, discountPercent: 0 }], discountPercent: undefined, discountFixed: undefined, targetProductId: undefined, targetCategory: undefined, buyProductId: undefined, giftProductId: undefined, mainProductId: undefined, comboProductId: undefined, comboDiscountPercent: undefined, minCustomerRank: undefined };
      case 'combo':
        return { ...base, mainProductId: base.mainProductId ?? '', comboProductId: base.comboProductId ?? '', comboDiscountPercent: base.comboDiscountPercent ?? 0, discountPercent: undefined, discountFixed: undefined, targetProductId: undefined, targetCategory: undefined, buyProductId: undefined, giftProductId: undefined, tiers: undefined, minCustomerRank: undefined };
      case 'customer_rank':
        return { ...base, minCustomerRank: base.minCustomerRank ?? 'Silver', discountPercent: base.discountPercent ?? 0, discountFixed: undefined, targetProductId: undefined, targetCategory: undefined, buyProductId: undefined, giftProductId: undefined, tiers: undefined, mainProductId: undefined, comboProductId: undefined, comboDiscountPercent: undefined };
      default:
        return base;
    }
  };

  const [editingPromotion, setEditingPromotion] = useState<any | null>(null);

  const handleAddNewPromotion = () => {
    const promo = emptyPromotion();
    setEditingPromotion(promo);
    setShowPromoForm(true);
  };

  const handleSavePromotion = () => {
    if (!editingPromotion || !editingPromotion.name.trim()) return;
    const { onAddPromotion, onUpdatePromotion } = props;
    if (editingPromotion.createdAt !== editingPromotion.updatedAt) {
      onUpdatePromotion?.({ ...editingPromotion, updatedAt: new Date().toISOString() });
    } else {
      onAddPromotion?.({ ...editingPromotion });
    }
    setEditingPromotion(null);
    setShowPromoForm(false);
  };

  const handleEditPromotion = (promo: any) => {
    setEditingPromotion({ ...promo });
    setShowPromoForm(true);
  };

  const updatePromoField = (field: string, value: any) => {
    if (!editingPromotion) return;
    setEditingPromotion((prev: any) => prev ? { ...prev, [field]: value } : prev);
  };

  const renderPromotionForm = () => {
    if (!editingPromotion) return null;
    const promo = editingPromotion;

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Percent className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-800">
              {promo.createdAt !== promo.updatedAt ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
            </span>
          </div>
          <button
            onClick={() => { setEditingPromotion(null); setShowPromoForm(false); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Tên khuyến mãi */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Tên khuyến mãi</label>
            <input
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              placeholder="VD: Giảm 10% tổng hóa đơn"
              value={promo.name}
              onChange={(e) => updatePromoField('name', e.target.value)}
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mô tả</label>
            <input
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              placeholder="Mô tả ngắn về chương trình"
              value={promo.description || ''}
              onChange={(e) => updatePromoField('description', e.target.value)}
            />
          </div>

          {/* Loại khuyến mãi */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Loại khuyến mãi</label>
            <select
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={promo.type}
              onChange={(e) => setEditingPromotion(handlePromotionTypeChange(e.target.value as PromotionType, promo))}
            >
              {(Object.entries(PROMOTION_TYPE_LABELS) as [PromotionType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Kích hoạt */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Kích hoạt</span>
            <button
              onClick={() => updatePromoField('isActive', !promo.isActive)}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${promo.isActive ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${promo.isActive ? 'left-5.5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Phase 9: ưu tiên + điều kiện + cộng dồn */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Ưu tiên (số nhỏ = ưu tiên cao)</label>
            <input
              type="number" min="0" step="1"
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={promo.priority ?? 0}
              onChange={(e) => updatePromoField('priority', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Giá trị đơn tối thiểu (VNĐ)</label>
            <input
              type="number" min="0" step="1000"
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={promo.minOrderValue ?? 0}
              onChange={(e) => updatePromoField('minOrderValue', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Giảm tối đa (VNĐ)</label>
            <input
              type="number" min="0" step="1000"
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={promo.maxDiscount ?? 0}
              onChange={(e) => updatePromoField('maxDiscount', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Cho phép cộng dồn</span>
            <button
              onClick={() => updatePromoField('stackable', !promo.stackable)}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${promo.stackable ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${promo.stackable ? 'left-5.5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Fields theo loại */}
          {promo.type === 'percent_on_total' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phần trăm giảm (%)</label>
              <input
                type="number" min="0" max="100" step="0.1"
                className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={promo.discountPercent ?? ''}
                onChange={(e) => updatePromoField('discountPercent', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {promo.type === 'fixed_on_total' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Số tiền giảm (VNĐ)</label>
              <input
                type="number" min="0" step="1000"
                className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={promo.discountFixed ?? ''}
                onChange={(e) => updatePromoField('discountFixed', parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {promo.type === 'percent_on_product' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mã sản phẩm mục tiêu</label>
                <input
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Nhập mã sản phẩm"
                  value={promo.targetProductId || ''}
                  onChange={(e) => updatePromoField('targetProductId', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phần trăm giảm (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={promo.discountPercent ?? ''}
                  onChange={(e) => updatePromoField('discountPercent', parseFloat(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          {promo.type === 'percent_on_category' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Nhóm hàng mục tiêu</label>
                <input
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="VD: Nước uống, Thực phẩm..."
                  value={promo.targetCategory || ''}
                  onChange={(e) => updatePromoField('targetCategory', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phần trăm giảm (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={promo.discountPercent ?? ''}
                  onChange={(e) => updatePromoField('discountPercent', parseFloat(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          {promo.type === 'buy_x_get_y' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mã SP mua (X)</label>
                <input
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Mã sản phẩm chính"
                  value={promo.buyProductId || ''}
                  onChange={(e) => updatePromoField('buyProductId', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Số lượng mua</label>
                <input
                  type="number" min="1"
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={promo.buyQuantity ?? 1}
                  onChange={(e) => updatePromoField('buyQuantity', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mã SP tặng (Y)</label>
                <input
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Mã sản phẩm tặng"
                  value={promo.giftProductId || ''}
                  onChange={(e) => updatePromoField('giftProductId', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Số lượng tặng</label>
                <input
                  type="number" min="1"
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={promo.giftQuantity ?? 1}
                  onChange={(e) => updatePromoField('giftQuantity', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Giảm % SP tặng</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={promo.giftDiscountPercent ?? 0}
                  onChange={(e) => updatePromoField('giftDiscountPercent', parseFloat(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          {promo.type === 'tiered_quantity' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Các mức chiết khấu</label>
              {((promo.tiers || []) as any[]).map((tier: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="number" min="1"
                    className="flex-1 border-0 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="Từ SL"
                    value={tier.minQty}
                    onChange={(e) => {
                      const newTiers = [...(promo.tiers || [])];
                      newTiers[idx] = { ...newTiers[idx], minQty: parseInt(e.target.value) || 1 };
                      updatePromoField('tiers', newTiers);
                    }}
                  />
                  <input
                    type="number" min="0" max="100" step="0.1"
                    className="flex-1 border-0 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="Giảm %"
                    value={tier.discountPercent}
                    onChange={(e) => {
                      const newTiers = [...(promo.tiers || [])];
                      newTiers[idx] = { ...newTiers[idx], discountPercent: parseFloat(e.target.value) || 0 };
                      updatePromoField('tiers', newTiers);
                    }}
                  />
                  <button
                    onClick={() => updatePromoField('tiers', (promo.tiers || []).filter((_: any, i: number) => i !== idx))}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => updatePromoField('tiers', [...(promo.tiers || []), { minQty: (promo.tiers || []).length > 0 ? (promo.tiers || [])[(promo.tiers || []).length - 1].minQty + 1 : 1, discountPercent: 0 }])}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-all"
              >
                + Thêm mức
              </button>
            </div>
          )}

          {promo.type === 'combo' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mã SP chính</label>
                <input
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Mã sản phẩm"
                  value={promo.mainProductId || ''}
                  onChange={(e) => updatePromoField('mainProductId', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mã SP mua kèm</label>
                <input
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Mã sản phẩm"
                  value={promo.comboProductId || ''}
                  onChange={(e) => updatePromoField('comboProductId', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Chiết khấu combo (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={promo.comboDiscountPercent ?? ''}
                  onChange={(e) => updatePromoField('comboDiscountPercent', parseFloat(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          {promo.type === 'customer_rank' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Hạng tối thiểu</label>
                <select
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={promo.minCustomerRank || 'Silver'}
                  onChange={(e) => updatePromoField('minCustomerRank', e.target.value as CustomerRank)}
                >
                  {RANK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phần trăm giảm (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={promo.discountPercent ?? ''}
                  onChange={(e) => updatePromoField('discountPercent', parseFloat(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          {/* Ngày bắt đầu / kết thúc */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Bắt đầu</label>
              <input
                type="date"
                className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={promo.startDate ? promo.startDate.split('T')[0] : ''}
                onChange={(e) => updatePromoField('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Kết thúc</label>
              <input
                type="date"
                className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={promo.endDate ? promo.endDate.split('T')[0] : ''}
                onChange={(e) => updatePromoField('endDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              />
            </div>
          </div>

          {/* Nút lưu */}
          <button
            onClick={handleSavePromotion}
            disabled={!promo.name.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Save className="w-4 h-4" />
            Lưu khuyến mãi
          </button>
        </div>
      </div>
    );
  };

  const renderPromotionsSettings = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {renderHeader('Khuyến mãi', 'Chương trình giảm giá')}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {showPromoForm ? (
          renderPromotionForm()
        ) : (
          <>
            <button
              onClick={handleAddNewPromotion}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              <Plus className="w-4 h-4" /> Thêm khuyến mãi
            </button>

            {propsPromotions.length === 0 ? (
              <div className="text-center py-8">
                <Percent className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Chưa có chương trình khuyến mãi</p>
                <p className="text-xs text-gray-300 mt-1">Thêm khuyến mãi để thu hút khách hàng</p>
              </div>
            ) : (
              <div className="space-y-2">
                {propsPromotions.map(promo => {
                  const IconCmp = getTypeIcon(promo.type);
                  return (
                    <div key={promo.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleEditPromotion(promo)}
                      >
                        <div className="flex items-center gap-2">
                          <IconCmp className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-800">{promo.name}</span>
                          {!promo.isActive && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Tắt</span>
                          )}
                        </div>
                        <div className="text-xs text-indigo-600 truncate mt-0.5">
                          {getPromotionDetail(promo)}
                        </div>
                        {promo.description && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">{promo.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => handleEditPromotion(promo)}
                          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => onDeleteProm(promo.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderRankForm = () => {
    if (!editingRank) return null;
    const rank = editingRank;

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-800">
              {rankConfigs.find(r => r.id === rank.id) ? 'Sửa cấu hình hạng' : 'Thêm hạng mới'}
            </span>
          </div>
          <button
            onClick={() => { setEditingRank(null); setShowRankForm(false); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Tên hạng */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Tên hạng</label>
            <input
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              placeholder="VD: Kim Cương"
              value={rank.name}
              onChange={(e) => updateRankField('name', e.target.value)}
            />
          </div>

          {/* Key (slug) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Key (slug)</label>
            <input
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              placeholder="VD: kim_cuong"
              value={rank.key}
              onChange={(e) => updateRankField('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Thứ tự ưu tiên */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Độ ưu tiên (order)</label>
              <input
                type="number" min="0"
                className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={rank.order}
                onChange={(e) => updateRankField('order', Number(e.target.value) || 0)}
              />
            </div>
            {/* % giảm mặc định */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Giảm giá (%)</label>
              <input
                type="number" min="0" max="100" step="0.5"
                className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                value={rank.discountPercent}
                onChange={(e) => updateRankField('discountPercent', Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Màu sắc */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Màu sắc đại diện</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-12 h-10 border-0 rounded-xl cursor-pointer bg-transparent"
                value={rank.color}
                onChange={(e) => updateRankField('color', e.target.value)}
              />
              <span className="text-xs text-gray-400 font-mono">{rank.color}</span>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mô tả</label>
            <input
              className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              placeholder="Mô tả quyền lợi..."
              value={rank.description || ''}
              onChange={(e) => updateRankField('description', e.target.value)}
            />
          </div>

          {/* Điều kiện xếp hạng */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Điều kiện xếp hạng</label>
              <button
                type="button"
                onClick={() => {
                  const newCondition = {
                    id: `cond_${Date.now()}`,
                    metric: 'totalSpent',
                    operator: 'gte',
                    minValue: 0,
                    periodType: 'year',
                    periodYear: new Date().getFullYear(),
                  };
                  updateRankField('conditions', [...(rank.conditions || []), newCondition]);
                }}
                className="text-xs text-indigo-600 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm
              </button>
            </div>

            {(!rank.conditions || rank.conditions.length === 0) ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">Không có điều kiện. Đây sẽ là hạng mặc định.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rank.conditions.map((cond: any, idx: number) => (
                  <div key={cond.id || idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Điều kiện {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newConditions = rank.conditions.filter((_: any, i: number) => i !== idx);
                          updateRankField('conditions', newConditions);
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Loại</label>
                        <select
                          className="w-full border-0 bg-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm border border-gray-100"
                          value={cond.metric}
                          onChange={(e) => {
                            const newConditions = [...rank.conditions];
                            newConditions[idx] = { ...cond, metric: e.target.value };
                            updateRankField('conditions', newConditions);
                          }}
                        >
                          <option value="totalSpent">Tổng chi tiêu</option>
                          <option value="orderCount">Số đơn hàng</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Toán tử</label>
                        <select
                          className="w-full border-0 bg-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm border border-gray-100"
                          value={cond.operator}
                          onChange={(e) => {
                            const newConditions = [...rank.conditions];
                            newConditions[idx] = { ...cond, operator: e.target.value };
                            updateRankField('conditions', newConditions);
                          }}
                        >
                          <option value="gte">{'>='}</option>
                          <option value="lte">{'<='}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Giá trị</label>
                        <input
                          type="number"
                          className="w-full border-0 bg-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm border border-gray-100"
                          value={cond.minValue ?? cond.value ?? 0}
                          onChange={(e) => {
                            const newConditions = [...rank.conditions];
                            newConditions[idx] = { ...cond, minValue: Number(e.target.value) || 0, value: Number(e.target.value) || 0 };
                            updateRankField('conditions', newConditions);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nút lưu */}
          <button
            onClick={handleSaveRank}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Save className="w-4 h-4" />
            Lưu hạng
          </button>
        </div>
      </div>
    );
  };

  const renderRankingSettings = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {renderHeader('Phân hạng khách hàng', 'Xếp hạng KH thân thiết')}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {showRankForm ? (
          renderRankForm()
        ) : (
          <>
            <div className="flex gap-2">
              <button
                onClick={handleRecalculateAll}
                disabled={isRankLoading}
                className="flex-1 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-50 active:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRankLoading ? 'animate-spin' : ''}`} />
                Tính lại tất cả
              </button>
              <button
                onClick={handleAddRank}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm hạng mới
              </button>
            </div>

            {rankConfigs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Đang tải...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankConfigs.sort((a, b) => a.order - b.order).map((rank: any) => (
                  <div key={rank.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: rank.color }} />
                        <span className="text-base font-semibold text-gray-800">{rank.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Giảm {rank.discountPercent || 0}%
                        </span>
                        <button
                          onClick={() => handleEditRank(rank)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-50"
                          title="Sửa"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        {!rank.isDefault && (
                          <button
                            onClick={() => handleDeleteRank(rank.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {rank.conditions && rank.conditions.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {rank.conditions.map((c: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <span>
                              {c.metric === 'totalSpent' || c.metric === 'total_spent' ? 'Chi tiêu' : 'Số đơn hàng'}{' '}
                              {c.operator === 'gte' ? '>= ' : c.operator === 'lte' ? '<= ' : 'trong khoảng '}{(c.minValue ?? c.value)?.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {rank.isDefault && (
                      <div className="mt-2">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Mặc định</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderReturnsSettings = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {renderHeader('Cài đặt trả hàng', 'Cấu hình phí và hạn trả hàng')}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          Cấu hình điều kiện thời gian và biểu phí áp dụng khi khách trả hàng. Khi tắt, hệ thống không tính phí và không chặn quá hạn.
        </p>

        {/* Toggle bật/tắt */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gray-800">Bật tính phí trả hàng</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Không giới hạn ngày trả, không tính phí nếu tắt</p>
          </div>
          <button
            onClick={() => setReturnConfig(prev => ({ ...prev, returnFeeEnabled: !prev.returnFeeEnabled }))}
            className={`relative w-11 h-6 rounded-full transition-all duration-200 ${returnConfig.returnFeeEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${returnConfig.returnFeeEnabled ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>

        {returnConfig.returnFeeEnabled && (
          <div className="space-y-4">
            {/* Số ngày tối đa */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Số ngày tối đa được trả hàng</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="365"
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all pr-14"
                  value={returnConfig.returnMaxDays}
                  onChange={(e) => setReturnConfig(prev => ({ ...prev, returnMaxDays: Number(e.target.value) || 0 }))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">ngày</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-tight">
                Sau X ngày kể từ ngày mua, hệ thống sẽ chặn cứng không cho trả hàng.
              </p>
            </div>

            {/* % phí */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Phí trả hàng (%) khi trả sau ngày mua</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="w-full border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all pr-8"
                  value={returnConfig.returnFeePercent}
                  onChange={(e) => setReturnConfig(prev => ({ ...prev, returnFeePercent: Number(e.target.value) || 0 }))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-tight">
                Phí chỉ áp dụng khi trả từ ngày hôm sau trở đi (trả trong ngày luôn miễn phí).
              </p>
            </div>

            {/* Bảng tóm tắt */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-xs space-y-1 text-indigo-700">
              <p className="font-bold text-indigo-800 mb-1">Tóm tắt quy tắc:</p>
              <p>• Trả trong ngày mua → Miễn phí (0%)</p>
              <p>• Trả từ ngày 1 đến ngày {returnConfig.returnMaxDays || 'X'} → Phí {returnConfig.returnFeePercent}% giá trị hàng trả</p>
              <p>• Trả sau ngày {returnConfig.returnMaxDays || 'X'} → <span className="text-red-500 font-bold">Chặn không cho trả</span></p>
            </div>
          </div>
        )}
      </div>
      {renderSaveButton('Lưu cài đặt trả hàng', handleSaveReturnConfig)}
    </div>
  );

  const renderBackupSettings = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {renderHeader('Sao lưu', 'Sao lưu & khôi phục dữ liệu')}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-1">Sao lưu dữ liệu</h4>
              <p className="text-xs text-blue-600 leading-relaxed">
                Sao lưu toàn bộ dữ liệu (sản phẩm, khách hàng, đơn hàng, cấu hình, khuyến mãi...)
                thành file JSON. Dùng file này để khôi phục khi cần.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          {isBackingUp ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang sao lưu...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Sao lưu dữ liệu
            </>
          )}
        </button>

        <div className="border-t border-gray-200 pt-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-amber-800 mb-1">Khôi phục dữ liệu</h4>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full py-3.5 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-gray-200"
          >
            {isRestoring ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Đang khôi phục...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Chọn file backup để khôi phục
              </>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e: any) => handleRestore(e)} />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'main': return renderMainMenu();
      case 'print': return renderPrintSettings();
      case 'points': return renderPointsSettings();
      case 'rewards': return renderRewardsSettings();
      case 'promotions': return renderPromotionsSettings();
      case 'ranking': return renderRankingSettings();
      case 'returns': return renderReturnsSettings();
      case 'backup': return renderBackupSettings();
      default: return renderMainMenu();
    }
  };

  return (
    <>
      {/* Preview Modal */}
      {showPreview && (
        <PrintPreview
          config={printConfig}
          previewData={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          onClick={onClose}
        />
      )}

      {/* Full-screen panel - slides in from right */}
      <div
        className={
          'fixed inset-0 z-[70] bg-white transform transition-transform duration-300 ease-in-out ' +
          (isOpen ? 'translate-x-0' : 'translate-x-full')
        }
      >
        <div className="h-full flex flex-col">
          {renderContent()}
        </div>
      </div>
    </>
  );
}

export default MobileSettings;