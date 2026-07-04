import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppSettings, Reward, Promotion, PromotionType, CustomerRank, PromotionTier, Product } from '../types';
import { Save, Plus, Trash2, Gift, Printer, Type, Database, Upload, Download, RefreshCw, Percent, Tag, Layers, ShoppingBag, Star, DollarSign, Search, X, RotateCcw } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { getPromotionTypeLabel } from '../utils/promotionUtils';
import { DEFAULT_RANK_CONFIGS, calculateCustomerRank } from '../utils/rankingEngine';
import { PageLayout } from '../components/shared/PageLayout';
import './Settings.css';

interface SettingsProps {
  settings: AppSettings;
  rewards: Reward[];
  onUpdateSettings: (settings: AppSettings) => void;
  onAddReward: (reward: Reward) => void;
  onDeleteReward: (id: string) => void;
  promotions?: Promotion[];
  onAddPromotion?: (promotion: Promotion) => void;
  onUpdatePromotion?: (promotion: Promotion) => void;
  onDeletePromotion?: (id: string) => void;
  products?: Product[]; // For product/category selectors
}

const FONT_OPTIONS = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Tahoma',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Lucida Console'
];

type TabId = 'print' | 'points' | 'rewards' | 'promotions' | 'ranking' | 'returns' | 'backup';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'print', label: 'Cấu hình in hoá đơn', icon: Printer },
  { id: 'points', label: 'Cấu hình điểm thưởng', icon: Gift },
  { id: 'rewards', label: 'Quà tặng đổi điểm', icon: Gift },
  { id: 'promotions', label: 'Khuyến mãi', icon: Percent },
  { id: 'ranking', label: 'Phân hạng khách hàng', icon: Star },
  { id: 'returns', label: 'Cài đặt trả hàng', icon: RotateCcw },
  { id: 'backup', label: 'Sao lưu & khôi phục', icon: Database },
];

const PROMOTION_TYPE_ICONS: Record<PromotionType, React.ElementType> = {
  percent_on_total: Percent,
  fixed_on_total: DollarSign,
  percent_on_product: Tag,
  percent_on_category: Layers,
  buy_x_get_y: ShoppingBag,
  tiered_quantity: Star,
  combo: Layers,
  customer_rank: Star,
};

// Map promotion types to display labels (dùng object thay vì function để Object.entries hoạt động)
const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
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

function emptyPromotion(): Promotion {
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
  };
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  rewards,
  onUpdateSettings,
  onAddReward,
  onDeleteReward,
  promotions: propsPromotions = [],
  onAddPromotion,
  onUpdatePromotion,
  onDeletePromotion,
  products: propProducts = []
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('print');
  const [rate, setRate] = useState(settings.pointConversionRate);

  // ─── SERVER-SIDE PRODUCTS (cho promotion selector & points tab) ────
  const [localProducts, setLocalProducts] = useState<Product[]>(propProducts);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  // Fetch products khi mở tab promotions hoặc points (chỉ 1 lần nếu chưa có)
  useEffect(() => {
    if ((activeTab !== 'promotions' && activeTab !== 'points') || localProducts.length > 0) return;
    let cancelled = false;
    const fetchProds = async () => {
      setIsFetchingProducts(true);
      try {
        const prods = await supabaseService.searchProducts('', 2000);
        if (!cancelled) setLocalProducts(prods);
      } catch (e) {
        console.error('Settings: fetch products error', e);
      } finally {
        if (!cancelled) setIsFetchingProducts(false);
      }
    };
    fetchProds();
    return () => { cancelled = true; };
  }, [activeTab]);

  // allProducts = prop (nếu có) ưu tiên hơn; fallback local fetch
  const allProducts = localProducts;

  // ─── RETURN FEE STATE ──────────────────────────────────────────────
  const [returnConfig, setReturnConfig] = useState({
    returnFeeEnabled: settings.returnFeeEnabled ?? false,
    returnMaxDays: settings.returnMaxDays ?? 0,
    returnFeePercent: settings.returnFeePercent ?? 0,
  });

  // Đồng bộ lại khi settings từ props thay đổi (sau khi tải/lưu)
  useEffect(() => {
    setReturnConfig({
      returnFeeEnabled: settings.returnFeeEnabled ?? false,
      returnMaxDays: settings.returnMaxDays ?? 0,
      returnFeePercent: settings.returnFeePercent ?? 0,
    });
  }, [settings.returnFeeEnabled, settings.returnMaxDays, settings.returnFeePercent]);

  const handleSaveReturnConfig = async () => {
    try {
      await onUpdateSettings({
        ...settings,
        returnFeeEnabled: returnConfig.returnFeeEnabled,
        returnMaxDays: Math.max(0, Math.floor(Number(returnConfig.returnMaxDays) || 0)),
        returnFeePercent: Math.max(0, Number(returnConfig.returnFeePercent) || 0),
      });
      alert('Đã lưu cài đặt trả hàng!');
    } catch (error) {
      // Error handled in App.tsx
    }
  };

  const [printConfig, setPrintConfig] = useState({
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

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh.');
      return;
    }
    if (file.size > 500 * 1024) {
      alert('Logo nên nhỏ hơn 500KB để in nhanh và lưu gọn.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPrintConfig(prev => ({ ...prev, logo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const [newReward, setNewReward] = useState<Partial<Reward>>({ name: '', pointCost: 0, stock: 0 });

  // Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = async () => {
    try {
      await onUpdateSettings({
        ...settings,
        pointConversionRate: rate,
        ...printConfig
      });
      alert('Đã lưu cấu hình!');
    } catch (error) {
      // Error is handled in App.tsx handleUpdateSettings
    }
  };

  const handleAddReward = () => {
    if (!newReward.name || !newReward.pointCost) return;
    onAddReward({
      id: `R${Date.now()}`,
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
      a.download = `vietsales_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('✅ Sao lưu dữ liệu thành công!');
    } catch (error) {
      console.error('Backup error:', error);
      alert('❌ Sao lưu thất bại. Vui lòng thử lại.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ CẢNH BÁO: Hành động này sẽ ghi đè dữ liệu hiện tại bằng dữ liệu từ file backup. Bạn có chắc chắn muốn tiếp tục?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsRestoring(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = event.target?.result as string;
          const data = JSON.parse(json);
          await supabaseService.restoreSystemBackup(data);
          alert('✅ Khôi phục dữ liệu thành công! Vui lòng tải lại trang để cập nhật dữ liệu mới.');
          window.location.reload();
        } catch (err) {
          console.error('Parse error:', err);
          alert('❌ File backup không hợp lệ hoặc bị lỗi.');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Restore error:', error);
      alert('❌ Khôi phục thất bại.');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── RANKING STATE ─────────────────────────────────────────────────
  const [rankConfigs, setRankConfigs] = useState<import('../types').CustomerRankConfig[]>([]);
  const [editingRank, setEditingRank] = useState<import('../types').CustomerRankConfig | null>(null);
  const [showRankForm, setShowRankForm] = useState(false);
  const [rankOrders, setRankOrders] = useState<import('../types').Order[]>([]);
  const [isRankLoading, setIsRankLoading] = useState(false);

  // Load rank configs
  useEffect(() => {
    const loadRankConfigs = async () => {
      try {
        const configs = await supabaseService.getRankConfigs();
        if (configs.length > 0) {
          setRankConfigs(configs);
        } else {
          // Use default configs if none exist
          setRankConfigs(DEFAULT_RANK_CONFIGS);
        }
      } catch (error) {
        console.error('Error loading rank configs:', error);
      }
    };
    loadRankConfigs();
  }, []);

  // Load all orders for rank calculation
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
    const newRank: import('../types').CustomerRankConfig = {
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

  const handleEditRank = (config: import('../types').CustomerRankConfig) => {
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
      
      // Lấy tất cả đơn hàng
      let allOrders: import('../types').Order[] = [...rankOrders];
      if (allOrders.length === 0) {
        const { orders } = await supabaseService.getOrdersPaginated(1, 5000);
        allOrders = orders;
        setRankOrders(orders);
      }

      // Lấy tất cả khách hàng — bulk rank recalc (đặc thù, không phải màn hình display)
      const allCustomers = await supabaseService.getCustomers();
      
      let changedCount = 0;
      for (const customer of allCustomers) {
        const result = calculateCustomerRank(customer.id, allOrders, rankConfigs);
        if (customer.rank !== result.rankKey) {
          // Cập nhật hạng mới
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

  const updateRankField = <K extends keyof import('../types').CustomerRankConfig>(key: K, value: import('../types').CustomerRankConfig[K]) => {
    if (!editingRank) return;
    setEditingRank({ ...editingRank, [key]: value });
  };

  // ─── PROMOTIONS STATE ──────────────────────────────────────────────
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showPromoForm, setShowPromoForm] = useState(false);

  const handleAddNewPromotion = () => {
    setEditingPromotion(emptyPromotion());
    setShowPromoForm(true);
  };

  const handleEditPromotion = (p: Promotion) => {
    setEditingPromotion({ ...p });
    setShowPromoForm(true);
  };

  const handlePromotionTypeChange = (type: PromotionType, promo: Promotion): Promotion => {
    const base = { ...promo, type };
    // Reset irrelevant fields
    base.discountPercent = undefined;
    base.discountFixed = undefined;
    base.targetProductId = undefined;
    base.targetCategory = undefined;
    base.targetProductIds = [];
    base.buyProductId = undefined;
    base.buyQuantity = undefined;
    base.giftProductId = undefined;
    base.giftQuantity = undefined;
    base.giftDiscountPercent = undefined;
    base.tiers = undefined;
    base.mainProductId = undefined;
    base.comboProductId = undefined;
    base.comboDiscountPercent = undefined;
    base.minCustomerRank = undefined;

    if (type === 'percent_on_total' || type === 'percent_on_product' || type === 'percent_on_category') {
      base.discountPercent = 0;
    }
    if (type === 'fixed_on_total') {
      base.discountFixed = 0;
    }
    if (type === 'buy_x_get_y') {
      base.buyQuantity = 1;
      base.giftQuantity = 1;
    }
    if (type === 'tiered_quantity') {
      base.tiers = [{ minQty: 5, discountPercent: 5 }];
    }
    if (type === 'combo') {
      base.comboDiscountPercent = 0;
    }
    if (type === 'customer_rank') {
      base.minCustomerRank = 'Bronze';
    }
    return base;
  };

  const handleSavePromotion = async () => {
    if (!editingPromotion) return;
    if (!editingPromotion.name.trim()) {
      alert('Vui lòng nhập tên chương trình khuyến mãi.');
      return;
    }

    const promo = {
      ...editingPromotion,
      updatedAt: new Date().toISOString(),
    };

    try {
      const existing = propsPromotions.find(p => p.id === promo.id);
      if (existing) {
        if (onUpdatePromotion) onUpdatePromotion(promo);
        await supabaseService.updatePromotion(promo);
      } else {
        if (onAddPromotion) onAddPromotion(promo);
        await supabaseService.addPromotion(promo);
      }
      setShowPromoForm(false);
      setEditingPromotion(null);
      alert('Đã lưu chương trình khuyến mãi!');
    } catch (error) {
      console.error('Lỗi lưu khuyến mãi:', error);
      alert('Lỗi lưu khuyến mãi. Vui lòng thử lại.');
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Xóa chương trình khuyến mãi này?')) return;
    try {
      if (onDeletePromotion) onDeletePromotion(id);
      await supabaseService.deletePromotion(id);
    } catch (error) {
      console.error('Lỗi xóa khuyến mãi:', error);
      alert('Lỗi xóa khuyến mãi.');
    }
  };

  const handleCancelPromoForm = () => {
    setShowPromoForm(false);
    setEditingPromotion(null);
  };

  const updatePromoField = <K extends keyof Promotion>(key: K, value: Promotion[K]) => {
    if (!editingPromotion) return;
    setEditingPromotion({ ...editingPromotion, [key]: value });
  };

  // ─── PRODUCT SELECTOR COMPONENT ────────────────────────────────────
  const ProductSelector = ({ value, onChange, label, placeholder }: {
    value: string | undefined;
    onChange: (id: string | undefined) => void;
    label: string;
    placeholder?: string;
  }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const selectedProduct = allProducts.find(p => p.id === value);
    const filtered = allProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="relative">
        <label className="settings-label">{label}</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className="settings-input settings-input-has-icon"
              value={searchTerm || (selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : '')}
              onFocus={() => { setShowDropdown(true); setSearchTerm(''); }}
              onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={placeholder || "Tìm sản phẩm..."}
            />
            <Search className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
          </div>
          {value && (
            <button
              onClick={() => { onChange(undefined); setSearchTerm(''); }}
              className="settings-btn settings-btn-danger settings-btn-icon"
              title="Bỏ chọn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {showDropdown && (searchTerm || !value) && (
          <div className="settings-dropdown">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy sản phẩm</div>
            ) : (
              filtered.slice(0, 20).map(p => (
                <div
                  key={p.id}
                  className={`settings-dropdown-item ${p.id === value ? 'settings-dropdown-item-selected' : ''}`}
                  onMouseDown={() => { onChange(p.id); setShowDropdown(false); setSearchTerm(''); }}
                >
                  <span>{p.name}</span>
                  <span className="text-gray-400 text-xs">{p.code}</span>
                </div>
              ))
            )}
          </div>
        )}
        {selectedProduct && !showDropdown && (
          <p className="settings-help-text settings-text-success">
            Đã chọn: {selectedProduct.name} - Tồn: {selectedProduct.quantity} - Giá: {selectedProduct.price.toLocaleString('vi-VN')}đ
          </p>
        )}
      </div>
    );
  };

  // ─── CATEGORY SELECTOR ────────────────────────────────────────────
  const CategorySelector = ({ value, onChange, label }: {
    value: string | undefined;
    onChange: (cat: string | undefined) => void;
    label: string;
  }) => {
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    return (
      <div>
        <label className="settings-label">{label}</label>
        <div className="flex items-center gap-2">
          <select
            className="settings-input max-w-xs"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || undefined)}
          >
            <option value="">-- Chọn nhóm hàng --</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {value && (
            <button onClick={() => onChange(undefined)} className="settings-btn settings-btn-danger settings-btn-icon">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // ─── RENDER PROMOTION FORM ────────────────────────────────────────
  const renderPromotionForm = () => {
    if (!editingPromotion) return null;
    const promo = editingPromotion;

    const renderCommonFields = () => (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="settings-label">Tên chương trình</label>
            <input type="text" className="settings-input"
              value={promo.name}
              onChange={(e) => updatePromoField('name', e.target.value)}
              placeholder="VD: Giảm 10% toàn bộ" />
          </div>
          <div>
            <label className="settings-label">Loại khuyến mãi</label>
            <select className="settings-input"
              value={promo.type}
              onChange={(e) => setEditingPromotion(handlePromotionTypeChange(e.target.value as PromotionType, promo))}>
              {(Object.entries(PROMOTION_TYPE_LABELS) as [PromotionType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="settings-label">Mô tả</label>
          <textarea className="settings-input"
            value={promo.description || ''}
            onChange={(e) => updatePromoField('description', e.target.value)}
            placeholder="Mô tả ngắn..." />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={promo.isActive}
              onChange={(e) => updatePromoField('isActive', e.target.checked)}
              className="settings-checkbox" />
            Kích hoạt
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="settings-label">Ngày bắt đầu</label>
            <input type="date" className="settings-input"
              value={promo.startDate ? promo.startDate.slice(0, 10) : ''}
              onChange={(e) => updatePromoField('startDate', e.target.value || undefined)} />
          </div>
          <div>
            <label className="settings-label">Ngày kết thúc</label>
            <input type="date" className="settings-input"
              value={promo.endDate ? promo.endDate.slice(0, 10) : ''}
              onChange={(e) => updatePromoField('endDate', e.target.value || undefined)} />
          </div>
        </div>

        {/* Phase 9: ưu tiên + điều kiện + cộng dồn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="settings-label">Ưu tiên <span className="text-gray-400 font-normal">(số nhỏ = ưu tiên cao)</span></label>
            <input type="number" min="0" step="1" className="settings-input"
              value={promo.priority ?? 0}
              onChange={(e) => updatePromoField('priority', Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="settings-label">Giá trị đơn tối thiểu <span className="text-gray-400 font-normal">(VNĐ)</span></label>
            <input type="number" min="0" step="1000" className="settings-input"
              value={promo.minOrderValue ?? 0}
              onChange={(e) => updatePromoField('minOrderValue', Number(e.target.value) || 0)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="settings-label">Giảm tối đa <span className="text-gray-400 font-normal">(VNĐ)</span></label>
            <input type="number" min="0" step="1000" className="settings-input"
              value={promo.maxDiscount ?? 0}
              onChange={(e) => updatePromoField('maxDiscount', Number(e.target.value) || 0)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={promo.stackable ?? false}
              onChange={(e) => updatePromoField('stackable', e.target.checked)}
              className="settings-checkbox" />
            Cho phép cộng dồn với khuyến mãi khác (giống ERPNext: Apply Multiple Pricing Rules)
          </label>
        </div>
      </>
    );

    const renderTypeSpecificFields = () => {
      switch (promo.type) {
        case 'percent_on_total':
          return (
            <div>
              <label className="settings-label">% giảm trên tổng hóa đơn</label>
              <div className="relative w-48">
                <input type="number" min="0" max="100" step="0.5"
                  className="settings-input settings-input-suffix"
                  value={promo.discountPercent ?? 0}
                  onChange={(e) => updatePromoField('discountPercent', Number(e.target.value) || 0)} />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
              </div>
              <p className="settings-help-text">Áp dụng cho toàn bộ giỏ hàng, giảm X% tổng tiền.</p>
            </div>
          );

        case 'fixed_on_total':
          return (
            <div>
              <label className="settings-label">Số tiền giảm cố định</label>
              <div className="relative w-48">
                <input type="number" min="0" step="1000"
                  className="settings-input settings-input-suffix-lg"
                  value={promo.discountFixed ?? 0}
                  onChange={(e) => updatePromoField('discountFixed', Number(e.target.value) || 0)} />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">VNĐ</span>
              </div>
              <p className="settings-help-text">Giảm số tiền cố định trên tổng hóa đơn.</p>
            </div>
          );

        case 'percent_on_product':
          return (
            <>
              <ProductSelector
                label="Sản phẩm áp dụng"
                value={promo.targetProductId}
                onChange={(id) => updatePromoField('targetProductId', id)}
                placeholder="Tìm sản phẩm..."
              />
              <div className="mt-3">
                <label className="settings-label">% giảm cho sản phẩm</label>
                <div className="relative w-48">
                  <input type="number" min="0" max="100" step="0.5"
                    className="settings-input settings-input-suffix"
                    value={promo.discountPercent ?? 0}
                    onChange={(e) => updatePromoField('discountPercent', Number(e.target.value) || 0)} />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                </div>
              </div>
            </>
          );

        case 'percent_on_category':
          return (
            <>
              <CategorySelector
                label="Nhóm hàng áp dụng"
                value={promo.targetCategory}
                onChange={(cat) => updatePromoField('targetCategory', cat)}
              />
              <div className="mt-3">
                <label className="settings-label">% giảm cho nhóm hàng</label>
                <div className="relative w-48">
                  <input type="number" min="0" max="100" step="0.5"
                    className="settings-input settings-input-suffix"
                    value={promo.discountPercent ?? 0}
                    onChange={(e) => updatePromoField('discountPercent', Number(e.target.value) || 0)} />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                </div>
              </div>
            </>
          );

        case 'buy_x_get_y':
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProductSelector
                  label="Sản phẩm mua (X)"
                  value={promo.buyProductId}
                  onChange={(id) => updatePromoField('buyProductId', id)}
                  placeholder="Tìm SP mua..."
                />
                <div>
                  <label className="settings-label">SL mua (X)</label>
                  <input type="number" min="1" className="settings-input"
                    value={promo.buyQuantity ?? 1}
                    onChange={(e) => updatePromoField('buyQuantity', Number(e.target.value) || 1)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProductSelector
                  label="Sản phẩm tặng/giảm (Y)"
                  value={promo.giftProductId}
                  onChange={(id) => updatePromoField('giftProductId', id)}
                  placeholder="Tìm SP tặng..."
                />
                <div>
                  <label className="settings-label">SL tặng (Y)</label>
                  <input type="number" min="1" className="settings-input"
                    value={promo.giftQuantity ?? 1}
                    onChange={(e) => updatePromoField('giftQuantity', Number(e.target.value) || 1)} />
                </div>
              </div>
              <div>
                <label className="settings-label">
                  % giảm cho SP tặng <span className="text-gray-400 font-normal">(để trống nếu tặng miễn phí)</span>
                </label>
                <div className="relative w-48">
                  <input type="number" min="0" max="100" step="0.5"
                    className="settings-input settings-input-suffix"
                    value={promo.giftDiscountPercent ?? ''}
                    onChange={(e) => updatePromoField('giftDiscountPercent', e.target.value ? Number(e.target.value) : undefined)} />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                </div>
                <p className="settings-help-text">Để trống = tặng miễn phí. Nhập % = giảm % trên giá SP tặng.</p>
              </div>
            </>
          );

        case 'tiered_quantity': {
          const tiers = promo.tiers || [];
          const addTier = () => {
            const newTiers = [...tiers, { minQty: tiers.length > 0 ? tiers[tiers.length - 1].minQty + 5 : 5, discountPercent: 5 }];
            updatePromoField('tiers', newTiers);
          };
          const removeTier = (idx: number) => {
            updatePromoField('tiers', tiers.filter((_, i) => i !== idx));
          };
          const updateTier = (idx: number, field: keyof PromotionTier, value: number) => {
            const newTiers = tiers.map((t, i) => i === idx ? { ...t, [field]: value } : t);
            updatePromoField('tiers', newTiers);
          };
          return (
            <div>
              <label className="settings-label settings-label-mb-2">Các bậc chiết khấu (mua càng nhiều giảm càng cao)</label>
              {tiers.map((tier, idx) => (
                <div key={idx} className="flex items-end gap-3 mb-2">
                  <div>
                    <label className="settings-label settings-label-xs">Từ {idx === 0 ? '' : 'thêm'} SP</label>
                    <input type="number" min="1" className="settings-input settings-input-xs"
                      value={tier.minQty}
                      onChange={(e) => updateTier(idx, 'minQty', Number(e.target.value) || 1)} />
                  </div>
                  <div>
                    <label className="settings-label settings-label-xs">Giảm</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" step="0.5" className="settings-input settings-input-xs settings-input-suffix"
                        value={tier.discountPercent}
                        onChange={(e) => updateTier(idx, 'discountPercent', Number(e.target.value) || 0)} />
                      <span className="absolute right-2 top-2 text-gray-500 text-xs">%</span>
                    </div>
                  </div>
                  <button onClick={() => removeTier(idx)} className="settings-btn settings-btn-danger settings-btn-icon">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addTier} className="settings-btn settings-btn-text">
                <Plus className="w-4 h-4" /> Thêm bậc
              </button>
              <div className="mt-3">
                <ProductSelector
                  label="Sản phẩm áp dụng (để trống = toàn bộ giỏ hàng)"
                  value={promo.targetProductId}
                  onChange={(id) => updatePromoField('targetProductId', id)}
                  placeholder="Để trống nếu áp dụng toàn bộ"
                />
              </div>
            </div>
          );
        }

        case 'combo':
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProductSelector
                  label="Sản phẩm chính"
                  value={promo.mainProductId}
                  onChange={(id) => updatePromoField('mainProductId', id)}
                  placeholder="Tìm SP chính..."
                />
                <ProductSelector
                  label="Sản phẩm mua kèm (được giảm giá)"
                  value={promo.comboProductId}
                  onChange={(id) => updatePromoField('comboProductId', id)}
                  placeholder="Tìm SP mua kèm..."
                />
              </div>
              <div>
                <label className="settings-label">% giảm cho SP mua kèm</label>
                <div className="relative w-48">
                  <input type="number" min="0" max="100" step="0.5"
                    className="settings-input settings-input-suffix"
                    value={promo.comboDiscountPercent ?? 0}
                    onChange={(e) => updatePromoField('comboDiscountPercent', Number(e.target.value) || 0)} />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                </div>
                <p className="settings-help-text">Mua sản phẩm chính, được giảm % trên sản phẩm mua kèm.</p>
              </div>
            </>
          );

        case 'customer_rank':
          return (
            <div>
              <label className="settings-label">Hạng khách hàng tối thiểu</label>
              <select className="settings-input max-w-xs"
                value={promo.minCustomerRank || 'Bronze'}
                onChange={(e) => updatePromoField('minCustomerRank', e.target.value as CustomerRank)}>
                {RANK_OPTIONS.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
              <div className="mt-3">
                <label className="settings-label">
                  % chiết khấu theo hạng <span className="text-gray-400 font-normal">(để trống = dùng cấu hình mặc định)</span>
                </label>
                <div className="relative w-48">
                  <input type="number" min="0" max="100" step="0.5"
                    className="settings-input settings-input-suffix"
                    value={promo.discountPercent ?? ''}
                    onChange={(e) => updatePromoField('discountPercent', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Để trống = mặc định" />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                </div>
              </div>
              <p className="settings-help-text">
                Áp dụng cho khách hàng từ hạng đã chọn trở lên. Nếu để trống % thì dùng % mặc định theo cấu hình hạng.
              </p>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="settings-section">
        <h4 className="settings-subtitle">{propsPromotions.find(p => p.id === promo.id) ? 'Sửa chương trình' : 'Thêm chương trình mới'}</h4>
        {renderCommonFields()}
        <div className="border-t border-gray-200 pt-4">
          <h5 className="settings-subtitle">Cấu hình chi tiết</h5>
          {renderTypeSpecificFields()}
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={handleSavePromotion} className="settings-btn settings-btn-primary">
            <Save className="w-4 h-4" /> Lưu
          </button>
          <button onClick={handleCancelPromoForm} className="settings-btn settings-btn-secondary">Huỷ</button>
        </div>
      </div>
    );
  };

  const getTypeIcon = (type: PromotionType): React.ElementType => {
    return PROMOTION_TYPE_ICONS[type] || Percent;
  };

  // Format promotion detail text for display
  const getPromotionDetail = (promo: Promotion): string => {
    // Phase 9: hiển thị ưu tiên + điều kiện + cộng dồn
    const conditions: string[] = [];
    if ((promo.priority ?? 0) > 0) conditions.push(`Ưu tiên ${promo.priority}`);
    if ((promo.minOrderValue ?? 0) > 0) conditions.push(`Đơn tối thiểu ${promo.minOrderValue?.toLocaleString('vi-VN')}đ`);
    if ((promo.maxDiscount ?? 0) > 0) conditions.push(`Giảm tối đa ${promo.maxDiscount?.toLocaleString('vi-VN')}đ`);
    if (promo.stackable) conditions.push('Cộng dồn');
    const prefix = conditions.length > 0 ? `[${conditions.join(' | ')}] ` : '';

    switch (promo.type) {
      case 'percent_on_total':
        return `${prefix}Giảm ${promo.discountPercent || 0}% tổng hóa đơn`;
      case 'fixed_on_total':
        return `${prefix}Giảm ${(promo.discountFixed || 0).toLocaleString('vi-VN')}đ`;
      case 'percent_on_product': {
        const p = allProducts.find(pr => pr.id === promo.targetProductId);
        return `${prefix}Giảm ${promo.discountPercent || 0}% cho ${p ? p.name : promo.targetProductId || 'SP'}`;
      }
      case 'percent_on_category':
        return `${prefix}Giảm ${promo.discountPercent || 0}% nhóm "${promo.targetCategory || ''}"`;
      case 'buy_x_get_y': {
        const buyP = allProducts.find(pr => pr.id === promo.buyProductId);
        const giftP = allProducts.find(pr => pr.id === promo.giftProductId);
        const buyName = buyP ? buyP.name : promo.buyProductId || 'X';
        const giftName = giftP ? giftP.name : promo.giftProductId || 'Y';
        if (promo.giftDiscountPercent) return `${prefix}Mua ${promo.buyQuantity || 1} ${buyName} giảm ${promo.giftDiscountPercent}% ${giftName}`;
        return `${prefix}Mua ${promo.buyQuantity || 1} ${buyName} tặng ${promo.giftQuantity || 1} ${giftName}`;
      }
      case 'tiered_quantity': {
        const tierText = (promo.tiers || []).map(t => `${t.minQty}+ SP: -${t.discountPercent}%`).join(', ');
        const targetP = promo.targetProductId ? allProducts.find(pr => pr.id === promo.targetProductId) : null;
        return `${prefix}Chiết khấu theo bậc: ${tierText}${targetP ? ` (SP: ${targetP.name})` : ' (toàn bộ)'}`;
      }
      case 'combo': {
        const mainP = allProducts.find(pr => pr.id === promo.mainProductId);
        const comboP = allProducts.find(pr => pr.id === promo.comboProductId);
        return `${prefix}Combo: mua ${mainP ? mainP.name : promo.mainProductId || 'SP chính'} giảm ${promo.comboDiscountPercent || 0}% ${comboP ? comboP.name : promo.comboProductId || 'SP kèm'}`;
      }
      case 'customer_rank':
        return `${prefix}KH hạng ${promo.minCustomerRank || 'Regular'}+ ${promo.discountPercent ? `-${promo.discountPercent}%` : '(theo % mặc định)'}`;
      default:
        return '';
    }
  };

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="settings-title">Cài đặt hệ thống</h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-64 shrink-0">
          <nav className="settings-sidebar flex md:flex-col gap-1 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`settings-tab ${active ? 'settings-tab-active' : ''}`}
                >
                  <Icon className="settings-icon" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === 'print' && (
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Printer className="settings-icon" />
              Cấu hình in hoá đơn
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column - store + bank + logo */}
              <div className="space-y-4">
                <div>
                  <label className="settings-label">Logo cửa hàng</label>
                  <div className="flex items-center gap-3">
                    {printConfig.logo ? (
                      <img src={printConfig.logo} alt="Logo" className="settings-logo-thumb" />
                    ) : (
                      <div className="settings-logo-box">Chưa có</div>
                    )}
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="settings-btn settings-btn-tertiary settings-btn-sm">
                        <Upload className="w-4 h-4" /> Tải logo
                      </button>
                      {printConfig.logo && (
                        <button type="button" onClick={() => setPrintConfig({ ...printConfig, logo: '' })} className="settings-btn settings-btn-danger settings-btn-sm">
                          <Trash2 className="w-4 h-4" /> Xoá logo
                        </button>
                      )}
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                  <p className="settings-help-text">Ảnh PNG/JPG dưới 500KB.</p>
                </div>
                <div>
                  <label className="settings-label">Tiêu đề hoá đơn</label>
                  <input type="text" className="settings-input"
                    value={printConfig.invoiceTitle}
                    onChange={(e) => setPrintConfig({ ...printConfig, invoiceTitle: e.target.value })}
                    placeholder="HÓA ĐƠN THANH TOÁN" />
                </div>
                <div>
                  <label className="settings-label">Tên cửa hàng</label>
                  <input type="text" className="settings-input"
                    value={printConfig.storeName}
                    onChange={(e) => setPrintConfig({ ...printConfig, storeName: e.target.value })}
                    placeholder="Tên cửa hàng..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="settings-label">Số điện thoại</label>
                    <input type="text" className="settings-input"
                      value={printConfig.storePhone}
                      onChange={(e) => setPrintConfig({ ...printConfig, storePhone: e.target.value })}
                      placeholder="SĐT..." />
                  </div>
                  <div>
                    <label className="settings-label">Mã số thuế</label>
                    <input type="text" className="settings-input"
                      value={printConfig.taxCode}
                      onChange={(e) => setPrintConfig({ ...printConfig, taxCode: e.target.value })}
                      placeholder="MST..." />
                  </div>
                </div>
                <div>
                  <label className="settings-label">Địa chỉ</label>
                  <input type="text" className="settings-input"
                    value={printConfig.storeAddress}
                    onChange={(e) => setPrintConfig({ ...printConfig, storeAddress: e.target.value })}
                    placeholder="Địa chỉ cửa hàng..." />
                </div>
                <div>
                  <label className="settings-label">Thông tin ngân hàng (cuối hoá đơn)</label>
                  <textarea className="settings-input settings-textarea"
                    value={printConfig.bankInfo}
                    onChange={(e) => setPrintConfig({ ...printConfig, bankInfo: e.target.value })}
                    placeholder="STK: ... Ngân hàng: ..." />
                </div>
              </div>

              {/* Right column - format + messages */}
              <div className="space-y-4">
                <div>
                  <label className="settings-label">Khổ giấy in</label>
                  <select className="settings-input"
                    value={printConfig.printSize}
                    onChange={(e) => setPrintConfig({ ...printConfig, printSize: e.target.value as any })}>
                    <option value="80mm">Máy in KPOS 80mm</option>
                    <option value="58mm">Máy in mini 58mm</option>
                    <option value="A4">Khổ A4/A5</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="settings-label settings-label-flex"><Type className="w-4 h-4" /> Cỡ chữ</label>
                    <input type="number" min="8" max="20" className="settings-input"
                      value={printConfig.fontSize}
                      onChange={(e) => setPrintConfig({ ...printConfig, fontSize: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="settings-label">Font chữ</label>
                    <select className="settings-input"
                      value={printConfig.fontFamily}
                      onChange={(e) => setPrintConfig({ ...printConfig, fontFamily: e.target.value })}
                      style={{ fontFamily: printConfig.fontFamily }}>
                      {FONT_OPTIONS.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="settings-label">Chính sách tích điểm / đổi trả</label>
                  <textarea className="settings-input settings-textarea"
                    value={printConfig.loyaltyPolicy}
                    onChange={(e) => setPrintConfig({ ...printConfig, loyaltyPolicy: e.target.value })}
                    placeholder="Ví dụ: Hàng mua rồi có thể đổi trả trong 7 ngày..." />
                  <p className="settings-help-text">Để trống nếu không muốn in.</p>
                </div>
                <div>
                  <label className="settings-label">Thông tin khuyến mãi</label>
                  <textarea className="settings-input settings-textarea-sm"
                    value={printConfig.promoInfo}
                    onChange={(e) => setPrintConfig({ ...printConfig, promoInfo: e.target.value })}
                    placeholder="Ví dụ: KHUYẾN MÃI THÁNG 10: Mua 1 lon giảm 8%..." />
                </div>
                <div>
                  <label className="settings-label">Lời cảm ơn cuối hoá đơn</label>
                  <input type="text" className="settings-input"
                    value={printConfig.thankYouMessage}
                    onChange={(e) => setPrintConfig({ ...printConfig, thankYouMessage: e.target.value })}
                    placeholder="Cảm ơn và hẹn gặp lại!" />
                </div>
              </div>
            </div>

            {/* Full Receipt Preview */}
            <div className="settings-receipt-preview">
              <p className="settings-receipt-preview-label">Xem trước hoá đơn (dữ liệu mẫu)</p>
              <div className="flex justify-center">
                <div className="settings-receipt-paper"
                  style={{
                    fontFamily: printConfig.fontFamily,
                    fontSize: `${printConfig.fontSize}px`,
                    lineHeight: 1.4,
                    width: printConfig.printSize === '80mm' ? '300px' : printConfig.printSize === '58mm' ? '220px' : '420px'
                  }}>
                  {printConfig.logo && (
                    <div className="text-center mb-2">
                      <img src={printConfig.logo} alt="Logo" className="inline-block max-h-16 object-contain" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-bold uppercase" style={{ fontSize: `${printConfig.fontSize + 2}px` }}>{printConfig.storeName || 'TÊN CỬA HÀNG'}</div>
                    <div>{printConfig.storeAddress || 'Địa chỉ cửa hàng...'}</div>
                    {printConfig.storePhone && <div>ĐT: {printConfig.storePhone}</div>}
                    {printConfig.taxCode && <div>MST: {printConfig.taxCode}</div>}
                  </div>
                  <div className="my-2 border-t border-dashed border-black"></div>
                  <div className="text-center font-bold uppercase" style={{ fontSize: `${printConfig.fontSize + 1}px` }}>
                    {printConfig.invoiceTitle || 'HÓA ĐƠN THANH TOÁN'}
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between"><span>Số HĐ:</span><span>HD000123</span></div>
                    <div className="flex justify-between"><span>Ngày:</span><span>{new Date().toLocaleDateString('vi-VN')}</span></div>
                    <div className="flex justify-between"><span>Khách hàng:</span><span>Nguyễn Văn A</span></div>
                  </div>
                  <div className="my-2 border-t border-dashed border-black"></div>
                  <div>
                    {[
                      { name: 'Sản phẩm A', qty: 2, price: 50000 },
                      { name: 'Sản phẩm B', qty: 1, price: 200000 },
                    ].map((it, idx) => (
                      <div key={idx} className="mb-1">
                        <div>{it.name}</div>
                        <div className="flex justify-between">
                          <span>{it.qty} x {it.price.toLocaleString('vi-VN')}</span>
                          <span>{(it.qty * it.price).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="my-2 border-t border-dashed border-black"></div>
                  <div>
                    <div className="flex justify-between"><span>Tạm tính:</span><span>300.000</span></div>
                    <div className="flex justify-between"><span>Giảm giá:</span><span>0</span></div>
                    <div className="flex justify-between font-bold" style={{ fontSize: `${printConfig.fontSize + 1}px` }}>
                      <span>TỔNG CỘNG:</span><span>300.000</span>
                    </div>
                    <div className="flex justify-between"><span>Khách trả:</span><span>300.000</span></div>
                    <div className="flex justify-between"><span>Điểm tích luỹ:</span><span>+3</span></div>
                  </div>
                  {printConfig.promoInfo && (
                    <>
                      <div className="my-2 border-t border-dashed border-black"></div>
                      <div className="text-center font-bold whitespace-pre-wrap">{printConfig.promoInfo}</div>
                    </>
                  )}
                  {printConfig.loyaltyPolicy && (
                    <>
                      <div className="my-2 border-t border-dashed border-black"></div>
                      <div className="whitespace-pre-wrap" style={{ fontSize: `${Math.max(8, printConfig.fontSize - 1)}px` }}>{printConfig.loyaltyPolicy}</div>
                    </>
                  )}
                  {printConfig.bankInfo && (
                    <>
                      <div className="my-2 border-t border-dashed border-black"></div>
                      <div className="whitespace-pre-wrap">{printConfig.bankInfo}</div>
                    </>
                  )}
                  <div className="my-2 border-t border-dashed border-black"></div>
                  <div className="text-center font-bold">{printConfig.thankYouMessage || 'Cảm ơn và hẹn gặp lại!'}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleSaveSettings} className="settings-btn settings-btn-primary settings-btn-lg">
                <Save className="w-4 h-4" /> Lưu cấu hình
              </button>
            </div>
          </div>
          )}

          {activeTab === 'points' && (() => {
            // Tính số sản phẩm bật tích điểm
            const pointProducts = (allProducts || []).filter(p => p.isPointAccumulationEnabled);
            const pointProductCount = pointProducts.length;
            const [showProductList, setShowProductList] = useState(false);
            
            return (
            <div className="settings-card">
              <h3 className="settings-card-title">
                <Gift className="settings-icon" />
                Cấu hình điểm thưởng
              </h3>
              <div className="flex flex-col md:flex-row md:items-end gap-4 max-w-md mb-6">
                <div className="flex-1 w-full">
                  <label className="settings-label">Tỷ lệ quy đổi (VNĐ / 1 điểm)</label>
                  <div className="relative">
                    <input type="number" min="1000" className="settings-input settings-input-suffix-lg"
                      value={rate}
                      onChange={(e) => setRate(Number(e.target.value))} />
                    <span className="absolute right-3 top-2 text-gray-500 text-sm">VNĐ</span>
                  </div>
                  <p className="settings-help-text">Ví dụ: Nhập 100000. Khách mua 100.000đ được 1 điểm. 299.000đ được 2 điểm.</p>
                </div>
                <button onClick={handleSaveSettings} className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Lưu
                </button>
              </div>

              {/* Hiển thị sản phẩm đang bật tích điểm */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Sản phẩm đang cho phép tích điểm
                    </span>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {pointProductCount}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowProductList(!showProductList)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    {showProductList ? 'Thu gọn' : 'Xem danh sách'}
                    <svg className={`w-3 h-3 transition-transform ${showProductList ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showProductList && (
                  <div className="mt-3 max-h-60 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                    {pointProductCount === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-400">
                        Chưa có sản phẩm nào được bật tích điểm.
                      </div>
                    ) : (
                      pointProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{product.name}</span>
                            {product.code && (
                              <span className="text-xs text-gray-400 shrink-0">({product.code})</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 shrink-0 ml-2">
                            {(product.price || 0).toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {activeTab === 'rewards' && (
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Gift className="settings-icon" />
              Danh sách Quà tặng đổi điểm
            </h3>
            <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên quà tặng</label>
                <input type="text" className="settings-input"
                  value={newReward.name || ''}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  placeholder="Tên quà..." />
              </div>
              <div className="w-32">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Điểm đổi</label>
                <input type="number" min="1" className="settings-input"
                  value={newReward.pointCost || ''}
                  onChange={(e) => setNewReward({ ...newReward, pointCost: Number(e.target.value) })}
                  placeholder="0" />
                <p className="text-[10px] text-red-500 mt-0.5">Phải lớn hơn 0</p>
              </div>
              <div className="w-32">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tồn kho</label>
                <input type="number" className="settings-input"
                  value={newReward.stock || ''}
                  onChange={(e) => setNewReward({ ...newReward, stock: Number(e.target.value) })}
                  placeholder="0" />
              </div>
              <button onClick={handleAddReward} className="settings-btn settings-btn-primary">
                <Plus className="w-4 h-4" /> Thêm
              </button>
            </div>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {rewards.length > 0 ? rewards.map(reward => (
                <div key={reward.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{reward.name}</span>
                      {/* Trạng thái kích hoạt */}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        reward.isActive !== false
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {reward.isActive !== false ? 'Đang kích hoạt' : 'Đã tắt'}
                      </span>
                    </div>
                    <div className="settings-description-text">
                      {reward.pointCost} điểm · Tồn: {reward.stock ?? 0}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {/* Toggle Kích hoạt/ Tắt */}
                    <button
                      onClick={() => {
                        const updated = { ...reward, isActive: reward.isActive === false ? true : false };
                        onAddReward(updated);
                      }}
                      className={`relative w-10 h-5 rounded-full transition-all ${
                        reward.isActive !== false ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={reward.isActive !== false ? 'Tắt quà này' : 'Bật quà này'}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        reward.isActive !== false ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                    <button onClick={() => onDeleteReward(reward.id)} className="settings-btn settings-btn-danger settings-btn-icon">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-center text-gray-400 text-sm">Chưa có quà tặng nào</div>
              )}
            </div>
          </div>
          )}

          {activeTab === 'promotions' && (
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Percent className="settings-icon" />
              Cấu hình khuyến mãi
            </h3>

            {showPromoForm && renderPromotionForm()}

            <div className="flex justify-between items-center mb-4">
              <p className="settings-description-text">Danh sách các chương trình khuyến mãi đang có ({propsPromotions.length})</p>
              {!showPromoForm && (
                <button onClick={handleAddNewPromotion} className="settings-btn settings-btn-primary">
                  <Plus className="w-4 h-4" /> Thêm khuyến mãi
                </button>
              )}
            </div>

            {propsPromotions.length === 0 ? (
              <div className="settings-empty">
                <Percent className="w-12 h-12 mx-auto mb-2 opacity-40" />
                Chưa có chương trình khuyến mãi nào.
              </div>
            ) : (
              <div className="space-y-2">
                {propsPromotions.map(promo => {
                  const IconCmp = getTypeIcon(promo.type);
                  return (
                    <div key={promo.id} className="overflow-hidden">
                      <div className="settings-list-item flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`settings-badge ${promo.isActive ? 'settings-badge-active' : 'settings-badge-inactive'}`}>
                            <IconCmp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800 truncate">{promo.name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {getPromotionTypeLabel(promo.type)}
                              {!promo.isActive && <span className="ml-2 text-red-500">(Đã tắt)</span>}
                            </div>
                            {promo.isActive && (
                              <div className="text-xs text-indigo-600 truncate mt-0.5">
                                {getPromotionDetail(promo)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <button onClick={() => handleEditPromotion(promo)} className="settings-btn settings-btn-ghost settings-btn-icon">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDeletePromotion(promo.id)} className="settings-btn settings-btn-danger settings-btn-icon">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {activeTab === 'ranking' && (
          <div className="flex flex-col md:flex-row gap-6 min-h-[500px]">
            {/* LEFT COLUMN: Danh sách hạng */}
            <div className="md:w-1/3 shrink-0">
              <div className="settings-card settings-card-compact">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Danh sách hạng</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={handleRecalculateAll} disabled={isRankLoading}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Tính lại tất cả">
                      <RefreshCw className={`w-4 h-4 ${isRankLoading ? 'animate-spin' : ''}`} />
                    </button>
                    {!showRankForm && (
                      <button onClick={handleAddRank} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Thêm hạng mới">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {rankConfigs.sort((a, b) => a.order - b.order).map(config => (
                    <div key={config.id}
                      onClick={() => handleEditRank(config)}
                      className={`settings-list-item-interactive ${
                        editingRank?.id === config.id ? 'settings-list-item-interactive-active' : ''
                      }`}
                    >
                      <div className="settings-status-dot" style={{ backgroundColor: config.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="settings-list-item-title truncate">
                          {config.name || '(Chưa đặt tên)'}
                          {config.isDefault && <span className="ml-1 text-xs text-gray-400">(Mặc định)</span>}
                        </div>
                        <div className="settings-help-text">
                          Ưu tiên {config.order} · Giảm {config.discountPercent}%
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleEditRank(config); }}
                          className="p-1 text-gray-400 hover:text-indigo-600" title="Sửa">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        {!config.isDefault && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteRank(config.id); }}
                            className="p-1 text-gray-400 hover:text-red-600" title="Xoá">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Chi tiết hạng đang chọn/sửa */}
            <div className="flex-1 min-w-0">
              <div className="settings-card">
                {!showRankForm && !editingRank && (
                  <div className="text-center py-12 text-gray-400">
                    <Star className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Chọn một hạng bên trái để chỉnh sửa</p>
                    <p className="text-sm mt-1">Hoặc nhấn nút + để thêm hạng mới</p>
                  </div>
                )}

                {(showRankForm || editingRank) && editingRank && (
                  <div className="space-y-5">
                    <h4 className="font-bold text-gray-800 text-lg">
                      {rankConfigs.find(r => r.id === editingRank.id) ? 'Chỉnh sửa hạng' : 'Thêm hạng mới'}
                    </h4>

                    {/* Thông tin cơ bản */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="settings-label">Tên hạng</label>
                        <input type="text" className="settings-input"
                          value={editingRank.name}
                          onChange={(e) => updateRankField('name', e.target.value)}
                          placeholder="VD: Kim Cương" />
                      </div>
                      <div>
                        <label className="settings-label">Key (slug)</label>
                        <input type="text" className="settings-input"
                          value={editingRank.key}
                          onChange={(e) => updateRankField('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                          placeholder="VD: kim_cuong" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="settings-label">Màu sắc</label>
                        <input type="color" className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                          value={editingRank.color}
                          onChange={(e) => updateRankField('color', e.target.value)} />
                      </div>
                      <div>
                        <label className="settings-label">Thứ tự ưu tiên</label>
                        <input type="number" min="1" max="999" className="settings-input"
                          value={editingRank.order}
                          onChange={(e) => updateRankField('order', Number(e.target.value) || 1)} />
                      </div>
                      <div>
                        <label className="settings-label">% giảm mặc định</label>
                        <div className="relative">
                          <input type="number" min="0" max="100" step="0.5" className="settings-input settings-input-suffix"
                            value={editingRank.discountPercent}
                            onChange={(e) => updateRankField('discountPercent', Number(e.target.value) || 0)} />
                          <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="settings-label">Mô tả</label>
                      <input type="text" className="settings-input"
                        value={editingRank.description || ''}
                        onChange={(e) => updateRankField('description', e.target.value)}
                        placeholder="Mô tả ngắn về hạng này..." />
                    </div>

                    {/* Điều kiện xếp hạng */}
                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-700">Điều kiện xếp hạng</h5>
                        <button onClick={() => {
                          const newCondition: import('../types').RankCondition = {
                            id: `cond_${Date.now()}`,
                            metric: 'total_spent',
                            operator: 'gte',
                            minValue: 0,
                            periodType: 'year',
                            periodYear: new Date().getFullYear(),
                          };
                          updateRankField('conditions', [...editingRank.conditions, newCondition]);
                        }} className="settings-btn settings-btn-text">
                          <Plus className="w-4 h-4" /> Thêm điều kiện
                        </button>
                      </div>

                      {editingRank.conditions.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          <p className="text-sm text-gray-400">Chưa có điều kiện. Hạng này sẽ là hạng mặc định.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editingRank.conditions.map((cond, idx) => (
                            <div key={cond.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Điều kiện {idx + 1}</span>
                                <button onClick={() => {
                                  const newConditions = editingRank.conditions.filter((_, i) => i !== idx);
                                  updateRankField('conditions', newConditions);
                                }} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="settings-label settings-label-xs">Loại</label>
                                  <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={cond.metric}
                                    onChange={(e) => {
                                      const newConditions = [...editingRank.conditions];
                                      newConditions[idx] = { ...cond, metric: e.target.value as any };
                                      updateRankField('conditions', newConditions);
                                    }}>
                                    <option value="total_spent">Tổng tiền</option>
                                    <option value="total_quantity">SL sản phẩm</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="settings-label settings-label-xs">Toán tử</label>
                                  <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={cond.operator}
                                    onChange={(e) => {
                                      const newConditions = [...editingRank.conditions];
                                      newConditions[idx] = { ...cond, operator: e.target.value as any };
                                      updateRankField('conditions', newConditions);
                                    }}>
                                     <option value="gte">{'>='}</option>
                                     <option value="lte">{'<='}</option>
                                    <option value="between">Trong khoảng</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="settings-label settings-label-xs">Giá trị Min</label>
                                  <input type="number" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={cond.minValue ?? 0}
                                    onChange={(e) => {
                                      const newConditions = [...editingRank.conditions];
                                      newConditions[idx] = { ...cond, minValue: Number(e.target.value) || 0 };
                                      updateRankField('conditions', newConditions);
                                    }} />
                                </div>
                                {cond.operator === 'between' && (
                                  <div>
                                    <label className="settings-label settings-label-xs">Giá trị Max</label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                      value={cond.maxValue ?? 0}
                                      onChange={(e) => {
                                        const newConditions = [...editingRank.conditions];
                                        newConditions[idx] = { ...cond, maxValue: Number(e.target.value) || 0 };
                                        updateRankField('conditions', newConditions);
                                      }} />
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                <div>
                                  <label className="settings-label settings-label-xs">Kỳ tính</label>
                                  <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={cond.periodType}
                                    onChange={(e) => {
                                      const newConditions = [...editingRank.conditions];
                                      newConditions[idx] = { ...cond, periodType: e.target.value as any };
                                      updateRankField('conditions', newConditions);
                                    }}>
                                    <option value="year">Theo năm</option>
                                    <option value="month">Theo tháng</option>
                                    <option value="custom">Khoảng thời gian</option>
                                  </select>
                                </div>
                                {cond.periodType === 'year' && (
                                  <div>
                                    <label className="settings-label settings-label-xs">Năm</label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                      value={cond.periodYear || new Date().getFullYear()}
                                      onChange={(e) => {
                                        const newConditions = [...editingRank.conditions];
                                        newConditions[idx] = { ...cond, periodYear: Number(e.target.value) || new Date().getFullYear() };
                                        updateRankField('conditions', newConditions);
                                      }} />
                                  </div>
                                )}
                                {cond.periodType === 'month' && (
                                  <>
                                    <div>
                                      <label className="settings-label settings-label-xs">Tháng</label>
                                      <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={cond.periodMonth || 1}
                                        onChange={(e) => {
                                          const newConditions = [...editingRank.conditions];
                                          newConditions[idx] = { ...cond, periodMonth: Number(e.target.value) };
                                          updateRankField('conditions', newConditions);
                                        }}>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                          <option key={m} value={m}>Tháng {m}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="settings-label settings-label-xs">Năm</label>
                                      <input type="number" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={cond.periodYear || new Date().getFullYear()}
                                        onChange={(e) => {
                                          const newConditions = [...editingRank.conditions];
                                          newConditions[idx] = { ...cond, periodYear: Number(e.target.value) || new Date().getFullYear() };
                                          updateRankField('conditions', newConditions);
                                        }} />
                                    </div>
                                  </>
                                )}
                                {cond.periodType === 'custom' && (
                                  <>
                                    <div>
                                      <label className="settings-label settings-label-xs">Từ ngày</label>
                                      <input type="date" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={cond.periodStart ? cond.periodStart.slice(0, 10) : ''}
                                        onChange={(e) => {
                                          const newConditions = [...editingRank.conditions];
                                          newConditions[idx] = { ...cond, periodStart: e.target.value };
                                          updateRankField('conditions', newConditions);
                                        }} />
                                    </div>
                                    <div>
                                      <label className="settings-label settings-label-xs">Đến ngày</label>
                                      <input type="date" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={cond.periodEnd ? cond.periodEnd.slice(0, 10) : ''}
                                        onChange={(e) => {
                                          const newConditions = [...editingRank.conditions];
                                          newConditions[idx] = { ...cond, periodEnd: e.target.value };
                                          updateRankField('conditions', newConditions);
                                        }} />
                                    </div>
                                  </>
                                )}
                                {cond.periodType !== 'custom' && cond.periodType !== 'month' && cond.periodType !== 'year' && (
                                  <div></div>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-gray-400">
                                Ví dụ: {cond.metric === 'total_spent' ? 'Tổng tiền' : 'Tổng SL'} {cond.operator === 'gte' ? '>=' : cond.operator === 'lte' ? '<=' : 'trong khoảng'} {cond.minValue?.toLocaleString('vi-VN')}{cond.operator === 'between' ? ` - ${cond.maxValue?.toLocaleString('vi-VN')}` : ''}đ
                                {cond.periodType === 'year' ? ` (Năm ${cond.periodYear})` : cond.periodType === 'month' ? ` (Tháng ${cond.periodMonth}/${cond.periodYear})` : ` (${cond.periodStart?.slice(0,10) || '?'} ~ ${cond.periodEnd?.slice(0,10) || '?'})`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Nút lưu / huỷ */}
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                      <button onClick={handleSaveRank} className="settings-btn settings-btn-primary">
                        <Save className="w-4 h-4" /> Lưu hạng
                      </button>
                      <button onClick={() => { setShowRankForm(false); setEditingRank(null); }}
                        className="settings-btn settings-btn-secondary">Huỷ</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {activeTab === 'returns' && (
          <div className="settings-card">
            <h3 className="settings-card-title">
              <RotateCcw className="settings-icon" />
              Cài đặt phí trả hàng
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Cấu hình điều kiện thời gian và biểu phí áp dụng khi khách trả hàng. Khi tắt, hệ thống không tính phí và không chặn quá hạn.
            </p>

            <div className="space-y-6 max-w-lg">
              {/* Toggle bật/tắt */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-800">Bật tính phí trả hàng</p>
                  <p className="text-xs text-gray-500 mt-0.5">Khi tắt: không giới hạn ngày trả, không tính phí.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={returnConfig.returnFeeEnabled}
                    onChange={(e) => setReturnConfig(prev => ({ ...prev, returnFeeEnabled: e.target.checked }))}
                    className="settings-toggle-input"
                  />
                  <div className="settings-toggle-track"></div>
                </label>
              </div>

              {returnConfig.returnFeeEnabled && (
                <>
                  {/* Số ngày tối đa */}
                  <div>
                    <label className="settings-label">Số ngày tối đa được trả hàng (X ngày)</label>
                    <div className="relative w-48">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-14 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={returnConfig.returnMaxDays}
                        onChange={(e) => setReturnConfig(prev => ({ ...prev, returnMaxDays: Number(e.target.value) || 0 }))}
                      />
                      <span className="absolute right-3 top-2 text-gray-500 text-sm">ngày</span>
                    </div>
                    <p className="settings-help-text">
                      Sau X ngày kể từ ngày mua, hệ thống sẽ <span className="font-semibold text-red-600">chặn cứng</span> không cho trả hàng.
                    </p>
                  </div>

                  {/* % phí */}
                  <div>
                    <label className="settings-label">Phí trả hàng (%) khi trả sau ngày mua</label>
                    <div className="relative w-48">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        className="settings-input settings-input-suffix"
                        value={returnConfig.returnFeePercent}
                        onChange={(e) => setReturnConfig(prev => ({ ...prev, returnFeePercent: Number(e.target.value) || 0 }))}
                      />
                      <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                    </div>
                    <p className="settings-help-text">
                      Nhập 0 nếu không tính phí. Phí chỉ áp dụng khi trả từ ngày hôm sau trở đi (trả trong ngày luôn miễn phí).
                    </p>
                  </div>

                  {/* Bảng tóm tắt */}
                  <div className="settings-summary-box">
                    <p className="settings-summary-title">Tóm tắt quy tắc</p>
                    <ul className="settings-summary-list">
                      <li>• Trả <span className="font-bold">trong ngày mua</span> → Miễn phí (0%)</li>
                      <li>• Trả <span className="font-bold">từ ngày 1 đến ngày {returnConfig.returnMaxDays || 'X'}</span> → Phí {returnConfig.returnFeePercent}% giá trị hàng trả</li>
                      <li>• Trả <span className="font-bold">sau ngày {returnConfig.returnMaxDays || 'X'}</span> → <span className="text-red-600 font-bold">Chặn, không cho trả</span></li>
                    </ul>
                  </div>
                </>
              )}

              {/* Nút lưu */}
              <div className="pt-2">
                <button onClick={handleSaveReturnConfig} className="settings-btn settings-btn-primary settings-btn-lg">
                  <Save className="w-4 h-4" /> Lưu cài đặt trả hàng
                </button>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'backup' && (
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Database className="settings-icon" />
              Sao lưu & khôi phục
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 font-medium text-gray-800"><Download className="w-4 h-4" /> Sao lưu dữ liệu</div>
                <p className="text-sm text-gray-500 mb-3">Tải toàn bộ dữ liệu hệ thống về file JSON để lưu trữ an toàn.</p>
                <button onClick={handleBackup} disabled={isBackingUp} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60">
                  {isBackingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isBackingUp ? 'Đang sao lưu...' : 'Tải file sao lưu'}
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 font-medium text-gray-800"><Upload className="w-4 h-4" /> Khôi phục dữ liệu</div>
                <p className="text-sm text-gray-500 mb-3">Khôi phục từ file backup. Lưu ý: thao tác này sẽ ghi đè dữ liệu hiện tại.</p>
                <button onClick={() => fileInputRef.current?.click()} disabled={isRestoring} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 disabled:opacity-60">
                  {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isRestoring ? 'Đang khôi phục...' : 'Chọn file & khôi phục'}
                </button>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleRestore} />
              </div>
            </div>
          </div>
          )}
        </div>

      </div>

      {/* Footer giới thiệu doanh nghiệp */}
      <footer className="mt-12 pt-8 border-t border-gray-200 text-gray-500 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <h4 className="font-bold text-gray-800 text-sm">Thông tin doanh nghiệp</h4>
            <p><span className="font-semibold text-gray-700">Tên:</span> HKD Sữa Cậu Ba</p>
            <p><span className="font-semibold text-gray-700">Địa chỉ:</span> 392, Thôn Duy Cần, Xã Tánh Linh, Tỉnh Lâm Đồng</p>
            <p><span className="font-semibold text-gray-700">Hotline tư vấn:</span> <a href="tel:0986495913" className="text-indigo-600 hover:underline">0986 495 913</a></p>
            <p><span className="font-semibold text-gray-700">Email:</span> <a href="mailto:vietsalepro@gmail.com" className="text-indigo-600 hover:underline">vietsalepro@gmail.com</a></p>
          </div>
          <div className="md:text-right space-y-3">
            <div className="flex flex-wrap md:justify-end gap-2 divide-x divide-gray-300 text-indigo-600 font-medium">
              <Link to="/gioi-thieu" className="hover:underline pr-2">Giới thiệu</Link>
              <a href="#" className="hover:underline px-2">Chính sách bảo mật</a>
              <a href="#" className="hover:underline px-2">Điều khoản sử dụng</a>
              <a href="#" className="hover:underline pl-2">Hướng dẫn cài đặt PWA</a>
            </div>
            <p className="text-gray-400">Copyright © 2026 VietSale Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </PageLayout>
  );
};
