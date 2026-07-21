import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams, Link, Outlet } from 'react-router-dom';

function MobileSharedLayout() {
  return (
    <div className="px-4 py-4 safe-area-px safe-area-pt pb-28">
      <Outlet />
    </div>
  );
}
import { AppTopbar } from './components/AppTopbar';
import { AppShell } from './components/AppShell';
import { BottomNav } from './components/BottomNav';
import { MobileLayout } from './components/MobileLayout';
import { MobileHome } from './components/MobileHome';
import MobilePOS from './components/MobilePOS';
import MobileOrders from './components/MobileOrders';
import MobileCustomers from './components/MobileCustomers';
import MobileInventory from './components/MobileInventory';
import { MobileSettings } from './components/MobileSettings';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { InventoryCount as InventoryCountPage } from './pages/InventoryCount';
import { Reports } from './pages/Reports';
import { Customers } from './pages/Customers';
import { Suppliers } from './pages/Suppliers';
import { POS } from './pages/POS';
import { Orders } from './pages/Orders';
import { ReturnOrders } from './pages/ReturnOrders';
import { ImportGoods } from './pages/ImportGoods';
import { Disposals } from './pages/Disposals';
import { DisposalForm } from './pages/DisposalForm';
import { SupplierExchanges } from './pages/SupplierExchanges';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { TaxCalculation } from './pages/TaxCalculation';
import { AuditLog } from './pages/AuditLog';
import { Login } from './pages/Login';
import { BrandManagement } from './pages/BrandManagement';
import { CategoryManagement } from './pages/CategoryManagement';
import { StockLedger } from './pages/StockLedger';
import { MemberManagement } from './components/MemberManagement';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import LandingPage from './pages/LandingPage';

import MfaChallenge from './components/MfaChallenge';
import { TenantNotFoundPage, TenantSuspendedPage, TenantForbiddenPage } from './components/TenantStatusPages';
import { getSubdomain } from './lib/tenant';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, 
  INITIAL_ORDERS 
} from './constants';
import { Product, Customer, Supplier, Order, CartItem, ImportReceipt, ImportItemInput, ProductLot, InventoryCount, AppSettings, Reward, PointHistory, Invoice, Category, Brand, Promotion, AppliedPromotion, CustomerRankConfig, CustomerRankHistory } from './types';
import { supabaseService } from './services/supabaseService';
import { supabase } from './lib/supabase';
import { isSystemAdmin as checkSystemAdmin } from './lib/permissions';
import { offlineCache, offlineQueue, isOnline, isNetworkError, CheckoutOp, generateOpId } from './utils/offlineManager';
import { generateInvoiceNumber, generateOfflineInvoiceNumber, isDuplicateInvoiceNumberError } from './utils/invoiceNumber';
import { calculatePromotionDiscount } from './utils/promotionUtils';
import { Loader2, Package, Truck, ArrowDownToLine, Settings as SettingsIcon, LogOut, X, BarChart, Users, Receipt, User as UserIcon } from 'lucide-react';
import { useNewAppShell } from './features';
import { AppError } from './utils/errors';
import { ToastProvider } from './components/ToastContainer';
import LoadingState from './components/LoadingState';

const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = React.lazy(() => import('./pages/admin/Overview'));
const AdminTenants = React.lazy(() => import('./pages/admin/Tenants'));
const AdminTenantDetail = React.lazy(() => import('./pages/admin/TenantDetail'));
const AdminMembers = React.lazy(() => import('./pages/admin/Members'));
const AdminBilling = React.lazy(() => import('./pages/admin/Billing'));
const AdminBillingInvoices = React.lazy(() => import('./pages/admin/BillingInvoices'));
const AdminBillingPayments = React.lazy(() => import('./pages/admin/BillingPayments'));
const AdminAudit = React.lazy(() => import('./pages/admin/Audit'));
const AdminSettings = React.lazy(() => import('./pages/admin/Settings'));
const AdminSecurity = React.lazy(() => import('./pages/admin/Security'));
const AdminHealth = React.lazy(() => import('./pages/admin/Health'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/Analytics'));
const AdminCompliance = React.lazy(() => import('./pages/admin/Compliance'));
const AdminOnboarding = React.lazy(() => import('./pages/admin/Onboarding'));
const InvitationsAccept = React.lazy(() => import('./pages/admin/InvitationsAccept'));

function AdminSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingState message="Đang tải trang quản trị..." />}>
      {children}
    </Suspense>
  );
}

function CustomersWrapper(props: any) {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') === 'debt';
  const [localFilter, setLocalFilter] = useState(filter);

  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  return <Customers {...props} filterByDebt={localFilter} onClearFilter={() => setLocalFilter(false)} />;
}

function AppContent() {
  const { user, signOut, loading: authLoading, mfaPending } = useAuth();
  const { tenant, membership, isLoading: tenantLoading } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [posInvoices, setPosInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('pos_invoices');
      if (!saved) {
        return [{ id: 1, name: 'Hóa đơn 1', cart: [], customerId: '', redeemedRewards: [] }];
      }
      const parsed: Invoice[] = JSON.parse(saved);
      // Chỉ giữ lại các hóa đơn đang dang dở (có hàng trong giỏ) khi mở lại POS
      const draftInvoices = parsed.filter(inv => inv.cart && inv.cart.length > 0);
      if (draftInvoices.length > 0) {
        return draftInvoices;
      }
      return [{ id: 1, name: 'Hóa đơn 1', cart: [], customerId: '', redeemedRewards: [] }];
    } catch (e) {

      return [{ id: 1, name: 'Hóa đơn 1', cart: [], customerId: '', redeemedRewards: [] }];
    }
  });
  
  const [posActiveTabId, setPosActiveTabId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pos_active_tab');
      return saved ? parseInt(saved) : 1;
    } catch (e) {
      return 1;
    }
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('pos_invoices', JSON.stringify(posInvoices));
    }, 1000);
    return () => clearTimeout(handler);
  }, [posInvoices]);

  useEffect(() => {
    localStorage.setItem('pos_active_tab', posActiveTabId.toString());
  }, [posActiveTabId]);

  const [appSettings, setAppSettings] = useState<AppSettings>({ 
    pointConversionRate: 100000,
    storeName: 'Cửa hàng Sữa Mẹ và Bé - Sữa Cậu Ba',
    storePhone: '0933 010 849 - 0986 495 913',
    storeAddress: '392, Xóm 1, Thôn 4, X.Gia An',
    bankInfo: 'STK: 1018676803\nVietcombank\nNGUYEN TAN PHAT',
    printSize: '80mm',
    fontSize: 11,
    fontFamily: 'Arial'
  });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);

  const loadedForUserId = useRef<{ userId: string; tenantId: string | null } | null>(null);

  // Viewport detection
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) setViewport('mobile');
      else if (w < 1024) setViewport('tablet');
      else setViewport('desktop');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isDesktopView = viewport === 'desktop';

  // ponytail: kiểm tra system admin khi user thay đổi; chỉ chạy khi đang ở admin subdomain hoặc route /admin.
  useEffect(() => {
    if (!user) {
      setIsSystemAdmin(false);
      setIsAdminLoading(false);
      return;
    }
    const subdomain = getSubdomain();
    const isAdminPath = location.pathname.startsWith('/admin');
    if (subdomain !== 'admin' && !isAdminPath) {
      setIsSystemAdmin(false);
      setIsAdminLoading(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      setIsAdminLoading(true);
      try {
        if (!cancelled) setIsSystemAdmin(await checkSystemAdmin());
      } catch (e) {
        if (!cancelled) setIsSystemAdmin(false);
      } finally {
        if (!cancelled) setIsAdminLoading(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user) {
      loadedForUserId.current = null;
      setIsLoading(false);
      return;
    }
    // ponytail: global data chỉ load sau khi tenant đã xác định.
    if (tenantLoading) return;
    if (!tenant) {
      loadedForUserId.current = null;
      setIsLoading(false);
      return;
    }
    const tenantId = tenant.id;
    if (loadedForUserId.current?.userId === user.id && loadedForUserId.current?.tenantId === tenantId) return;
    loadedForUserId.current = { userId: user.id, tenantId };

    const fetchData = async () => {
      setIsLoading(true);
      if (!isOnline() && offlineCache.hasData()) {
        const cachedSettings = offlineCache.getSettings();
        if (cachedSettings) setAppSettings(cachedSettings);
        setRewards(offlineCache.getRewards());
        setIsLoading(false);
        return;
      }

      try {
        const [
          fetchedOrdersData,
          fetchedSettings,
          fetchedRewards,
          fetchedHistory,
          fetchedCategories,
          fetchedBrands,
          fetchedInventoryCounts,
          fetchedPromotions
        ] = await Promise.all([
          // 50 đơn gần nhất — dùng cho ReturnOrders (create-return flow: chọn đơn gốc,
          // search đơn, recent orders của KH). Orders/Reports main list tự fetch server-side.
          // Offline sync handler cũng reload 50 đơn này sau khi sync xong.
          supabaseService.getOrdersPaginated(1, 50),
          supabaseService.getSettings(),
          supabaseService.getRewards(),
          supabaseService.getPointHistory(),
          supabaseService.getCategories(),
          supabaseService.getBrands(),
          supabaseService.getInventoryCounts(),
          supabaseService.getPromotions()
        ]);

        setOrders(fetchedOrdersData.orders);
        if (fetchedSettings) setAppSettings(fetchedSettings);
        setRewards(fetchedRewards);
        setPointHistory(fetchedHistory);
        setCategories(fetchedCategories);
        setBrands(fetchedBrands);
        setInventoryCounts(fetchedInventoryCounts);
        setPromotions(fetchedPromotions);

        if (fetchedSettings) offlineCache.setSettings(fetchedSettings);
        offlineCache.setRewards(fetchedRewards);
        offlineCache.markUpdated();
      } catch (error) {

        if (isNetworkError(error) && offlineCache.hasData()) {
          const cachedSettings = offlineCache.getSettings();
          if (cachedSettings) setAppSettings(cachedSettings);
          setRewards(offlineCache.getRewards());
        }
        const cachedPromotions = localStorage.getItem('vietsale_promotions');
        if (cachedPromotions) {
          try { setPromotions(JSON.parse(cachedPromotions)); } catch(e) {}
        } else {
          alert("Lỗi tải dữ liệu từ hệ thống. Vui lòng kiểm tra kết nối.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, tenantLoading, tenant?.id]);

  useEffect(() => {
    try { localStorage.setItem('vietsale_promotions', JSON.stringify(promotions)); } catch(e) {}
  }, [promotions]);

  useEffect(() => {
    const handleOnline = async () => {

      try {
        const result = await supabaseService.syncOfflineQueue();
        if (result.synced > 0) {
          const [orderData, freshRewards] = await Promise.all([
            supabaseService.getOrdersPaginated(1, 50),
            supabaseService.getRewards()
          ]);
          setOrders(orderData.orders);
          setRewards(freshRewards);
          offlineCache.setRewards(freshRewards);
          offlineCache.markUpdated();
          alert(`Đã đồng bộ ${result.synced} đơn hàng offline lên hệ thống.`);
        }
      } catch (error) {

      }
    };
    if (isOnline() && offlineQueue.count() > 0) {
      handleOnline();
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  

  const handleViewDebtCustomers = () => {
    navigate('/customers?filter=debt');
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      await supabaseService.saveSettings(newSettings);
      setAppSettings(newSettings);
    } catch (error) {

      alert("Lỗi lưu cài đặt.");
      throw error;
    }
  };

  const handleAddReward = async (reward: Reward) => {
    try {
      await supabaseService.upsertReward(reward);
      setRewards(prev => [...prev, reward]);
    } catch (error) {

      alert("Lỗi thêm quà tặng.");
    }
  };

  const handleDeleteReward = async (id: string) => {
    try {
      await supabaseService.deleteReward(id);
      setRewards(prev => prev.filter(r => r.id !== id));
    } catch (error) {

      alert("Lỗi xoá quà tặng.");
    }
  };

  const handleAdjustPoints = async (customerId: string, amount: number, description: string) => {
    try {
      const diff = amount;
      await supabaseService.adjustCustomerPoints(customerId, diff, description);
      const allHistory = await supabaseService.getPointHistory();
      setPointHistory(allHistory);
    } catch (error) {

      alert("Lỗi cập nhật điểm.");
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      await supabaseService.addCategory(name);
      const updated = await supabaseService.getCategories();
      setCategories(updated);
    } catch (error) {

      alert("Lỗi thêm danh mục.");
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    try {
      await supabaseService.updateCategory(id, name);
      const updated = await supabaseService.getCategories();
      setCategories(updated);
    } catch (error) {

      alert("Lỗi cập nhật danh mục.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Xoá danh mục này?')) {
      try {
        await supabaseService.deleteCategory(id);
        setCategories(prev => prev.filter(c => c.id !== id));
      } catch (error) {

        alert("Lỗi xoá danh mục.");
      }
    }
  };

  const handleAddBrand = async (name: string) => {
    try {
      await supabaseService.addBrand(name);
      const updated = await supabaseService.getBrands();
      setBrands(updated);
    } catch (error) {

      alert("Lỗi thêm thương hiệu.");
    }
  };

  const handleUpdateBrand = async (id: string, name: string) => {
    try {
      await supabaseService.updateBrand(id, name);
      const updated = await supabaseService.getBrands();
      setBrands(updated);
    } catch (error) {

      alert("Lỗi cập nhật thương hiệu.");
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (confirm('Xoá thương hiệu này?')) {
      try {
        await supabaseService.deleteBrand(id);
        setBrands(prev => prev.filter(b => b.id !== id));
      } catch (error) {

        alert("Lỗi xoá thương hiệu.");
      }
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      // PHASE 2G.2: Upsert core product fields (KHÔNG ghi lots vào JSONB)
      await supabaseService.upsertProduct(product);
      // PHASE 2G.2: Ghi lots vào product_lots TABLE (chỉ khi có lots)
      if (product.hasBatches && product.lots && product.lots.length > 0) {
        await supabaseService.replaceProductLots(product.id, product.lots);
      }
    } catch (error) {

      alert("Lỗi thêm sản phẩm.");
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      // PHASE 2G.2: Upsert core product fields (KHÔNG ghi lots vào JSONB)
      await supabaseService.upsertProduct(updatedProduct);
      // PHASE 2G.2: Replace lots trong product_lots TABLE
      // - hasBatches=true và có lots → replace với lots mới
      // - hasBatches=false → xoá hết lots (replaceProductLots với [])
      if (updatedProduct.hasBatches) {
        await supabaseService.replaceProductLots(updatedProduct.id, updatedProduct.lots || []);
      } else {
        // Khi tắt quản lý lô, xoá hết lots khỏi product_lots TABLE
        await supabaseService.replaceProductLots(updatedProduct.id, []);
      }
    } catch (error) {

      alert("Lỗi cập nhật sản phẩm.");
    }
  };

  const handleBulkImport = async (newProducts: Product[], updatedProducts: Product[]) => {
    try {
      // PHASE 2G.2: Upsert core fields trước (KHÔNG ghi lots vào JSONB)
      const promises = [
        ...newProducts.map(p => supabaseService.upsertProduct(p)),
        ...updatedProducts.map(p => supabaseService.upsertProduct(p))
      ];
      await Promise.all(promises);
      // PHASE 2G.2: Sau đó ghi lots vào product_lots TABLE (nếu có)
      // Bulk import thường không có lots nên bỏ qua nếu không có
      const lotPromises = [
        ...newProducts
          .filter(p => p.hasBatches && p.lots && p.lots.length > 0)
          .map(p => supabaseService.replaceProductLots(p.id, p.lots!)),
        ...updatedProducts
          .filter(p => p.hasBatches && p.lots && p.lots.length > 0)
          .map(p => supabaseService.replaceProductLots(p.id, p.lots!))
      ];
      if (lotPromises.length > 0) {
        await Promise.all(lotPromises);
      }
      alert("Nhập dữ liệu thành công!");
    } catch (error) {

      alert("Lỗi nhập dữ liệu hàng loạt.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xoá sản phẩm này?')) {
      try {
        await supabaseService.deleteProduct(id);
      } catch (error) {

        alert("Lỗi xoá sản phẩm.");
      }
    }
  };

  const handleBulkDeleteProducts = async (ids: string[]) => {
    try {
      await supabaseService.deleteProducts(ids);
      alert(`Đã xoá ${ids.length} sản phẩm.`);
    } catch (error) {

      alert("Lỗi xoá sản phẩm hàng loạt.");
    }
  };

  const handleBulkUpdateProducts = async (ids: string[], updates: Partial<Product>) => {
    try {
      await supabaseService.updateProducts(ids, updates);
      alert(`Đã cập nhật ${ids.length} sản phẩm.`);
    } catch (error) {

      alert("Lỗi cập nhật sản phẩm hàng loạt.");
    }
  };

  /**
   * Lưu phiếu kiểm kê - Phase 3:
   * - Draft: chỉ lưu header + items, KHÔNG đụng tồn kho
   * - Completed: gọi RPC `complete_inventory_count` để cập nhật tồn kho atomic
   *   (khóa dòng, tính delta, không ghi đè, tự rollback nếu lỗi)
   * - Sau khi hoàn thành, reload products + inventoryCounts từ DB để đồng bộ 100%
   */
  const handleSaveInventoryCount = async (count: InventoryCount) => {
    try {
      // === VALIDATE CLIENT-SIDE (phòng thủ tầng 1) ===
      if (!count.items || count.items.length === 0) {
        alert('Phiếu kiểm kê phải có ít nhất 1 sản phẩm.');
        return;
      }

      if (count.status === 'completed') {
        // Validate số lượng thực tế đã nhập đầy đủ
        for (const item of count.items) {
          if (item.actualQuantity == null || item.actualQuantity < 0) {
            alert(`Sản phẩm "${item.productName}" chưa nhập số lượng thực tế hợp lệ (phải >= 0).`);
            return;
          }
        }
      }

      if (count.status === 'draft') {
        // === LƯU NHÁP: chỉ lưu header + items, KHÔNG cập nhật tồn kho ===
        await supabaseService.upsertInventoryCount(count);
        
        setInventoryCounts(prev => {
          const exists = prev.find(c => c.id === count.id);
          if (exists) {
            return prev.map(c => c.id === count.id ? count : c);
          }
          return [count, ...prev];
        });
        
        alert('Đã lưu nháp phiếu kiểm kê (chưa ghi nhận tồn kho).');
        
      } else if (count.status === 'completed') {
        // === HOÀN THÀNH: lưu items trước, sau đó gọi RPC để cập nhật tồn kho ===
        
        // Bước 1: Lưu/cập nhật header + items (status vẫn là draft tạm thời)
        await supabaseService.upsertInventoryCount({ ...count, status: 'draft' });
        
        // Bước 2: Gọi RPC hoàn thành (atomic: khóa dòng, tính delta, cập nhật tồn kho + status)
        await supabaseService.completeInventoryCount(count.id);
        
        // Bước 3: Reload dữ liệu từ DB để đồng bộ 100% (tồn kho, system_quantity, status)
        const freshCounts = await supabaseService.getInventoryCounts();
        setInventoryCounts(freshCounts);
        
        alert('Hoàn thành kiểm kê! Tồn kho đã được cập nhật.');
        
      } else {
        // Trạng thái khác (cancelled, etc.) - chỉ lưu header + items
        await supabaseService.upsertInventoryCount(count);
        
        setInventoryCounts(prev => {
          const exists = prev.find(c => c.id === count.id);
          if (exists) {
            return prev.map(c => c.id === count.id ? count : c);
          }
          return [count, ...prev];
        });
        
        alert('Đã lưu phiếu kiểm kê.');
      }
      
    } catch (error: any) {

      // PostgreSQL function đã tự rollback - DB ở trạng thái nhất quán
      alert(error?.message || 'Lỗi lưu phiếu kiểm kê. Vui lòng thử lại.');
    }
  };

  const handleDeleteInventoryCount = async (id: string) => {
    const count = inventoryCounts.find(c => c.id === id);
    if (!count) return;
    // Phase 7a: Xóa hẳn chỉ cho phiếu draft hoặc cancelled (đã hủy).
    // Phiếu completed phải dùng "Hủy phiếu" (cancel) để giữ lịch sử + hoàn kho.
    if (count.status === 'completed') {
      alert('Phiếu đã hoàn thành không thể xoá hẳn. Vui lòng dùng "Hủy phiếu" để hoàn kho và giữ lịch sử truy vết.');
      return;
    }
    if (count.status !== 'draft' && count.status !== 'cancelled') {
      alert('Chỉ được xoá phiếu kiểm kê ở trạng thái Nháp hoặc Đã hủy.');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xoá hẳn phiếu kiểm kê này? (Phiếu sẽ bị xoá vĩnh viễn.)')) {
      try {
        await supabaseService.deleteInventoryCount(id);

        // Tải lại dữ liệu kiểm kê và tồn kho từ DB để đảm bảo đồng bộ
        const freshCounts = await supabaseService.getInventoryCounts();
        setInventoryCounts(freshCounts);

        alert('Đã xoá phiếu kiểm kê.');
      } catch (error: any) {

        alert(error?.message || "Lỗi xoá phiếu kiểm kê.");
      }
    }
  };

  /**
   * Phase 7a: Hủy phiếu kiểm kê (cancel) — khác với xóa hẳn.
   * - Đổi status thành 'cancelled' + hoàn kho (bút toán đảo).
   * - GIỮ LỊCH SỬ header + items để truy vết.
   * - Chỉ cho phiếu 'draft' hoặc 'completed'.
   */
  const handleCancelInventoryCount = async (id: string) => {
    const count = inventoryCounts.find(c => c.id === id);
    if (!count) return;
    if (count.status === 'cancelled') {
      alert('Phiếu kiểm kê đã bị hủy trước đó.');
      return;
    }
    if (count.status !== 'draft' && count.status !== 'completed') {
      alert('Chỉ được hủy phiếu kiểm kê ở trạng thái Nháp hoặc Hoàn thành.');
      return;
    }
    const msg = count.status === 'completed'
      ? 'Hủy phiếu sẽ hoàn lại tồn kho về trạng thái trước kiểm kê và đổi trạng thái thành "Đã hủy" (giữ lịch sử để truy vết). Bạn có chắc chắn?'
      : 'Hủy phiếu nháp sẽ đổi trạng thái thành "Đã hủy" (giữ lịch sử). Bạn có chắc chắn?';
    if (confirm(msg)) {
      try {
        await supabaseService.cancelInventoryCount(id);

        // Tải lại dữ liệu kiểm kê và tồn kho từ DB để đảm bảo đồng bộ
        const freshCounts = await supabaseService.getInventoryCounts();
        setInventoryCounts(freshCounts);

        alert('Đã hủy phiếu kiểm kê. Tồn kho đã được hoàn lại (nếu phiếu đã hoàn thành).');
      } catch (error: any) {

        alert(error?.message || "Lỗi hủy phiếu kiểm kê.");
      }
    }
  };

  const handleAddCustomer = async (customer: Customer) => {
    try {
      await supabaseService.upsertCustomer(customer);
    } catch (error) {

      alert("Lỗi thêm khách hàng.");
    }
  };

  const handleUpdateCustomer = async (updated: Customer) => {
    try {
      await supabaseService.upsertCustomer(updated);
    } catch (error) {

      alert("Lỗi cập nhật khách hàng.");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Xoá khách hàng?')) {
      try {
        await supabaseService.deleteCustomer(id);
      } catch (error) {

        alert("Lỗi xoá khách hàng.");
      }
    }
  };

  const handleBulkDeleteCustomers = async (ids: string[]) => {
    try {
      await supabaseService.deleteCustomers(ids);
      alert(`Đã xoá ${ids.length} khách hàng.`);
    } catch (error) {

      alert("Lỗi xoá khách hàng hàng loạt.");
    }
  };

  const handleAddSupplier = async (supplier: Supplier) => {
    try {
      await supabaseService.upsertSupplier(supplier);
    } catch (error) {

      alert("Lỗi thêm nhà cung cấp.");
    }
  };

  const handleUpdateSupplier = async (updated: Supplier) => {
    try {
      await supabaseService.upsertSupplier(updated);
    } catch (error) {

      alert("Lỗi cập nhật nhà cung cấp.");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Xoá nhà cung cấp?')) {
      try {
        await supabaseService.deleteSupplier(id);
      } catch (error) {

        alert("Lỗi xoá nhà cung cấp.");
      }
    }
  };

  const handleSeedData = async () => {
    if (!confirm("Hành động này sẽ thêm dữ liệu mẫu vào hệ thống. Tiếp tục?")) return;
    setIsLoading(true);
    try {
      await supabaseService.seedData(INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS);
      alert("Đã đồng bộ dữ liệu mẫu thành công!");
    } catch (error) {

      alert("Lỗi đồng bộ dữ liệu mẫu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePosCheckout = async (
    invoiceId: number,
    paymentMethod: string,
    amountPaid: number,
    customerId?: string,
    appliedPromotions?: Promotion[]
  ) => {
    const invoice = posInvoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    const cartItems = invoice.cart;
    const total = cartItems.reduce((sum, item) => sum + (item.price ?? 0) * (item.cartQuantity ?? 0), 0);
    const targetCustomerId = customerId || invoice.customerId;
    let promotionCustomer: Customer | undefined;
    if (targetCustomerId) {
      promotionCustomer = (await supabaseService.getCustomerById(targetCustomerId)) ?? undefined;
    }
    const appPromotions: AppliedPromotion[] = (appliedPromotions || []).map(p => {
      const { discount, description } = calculatePromotionDiscount(p, cartItems, promotionCustomer);
      return {
        promotionId: p.id,
        promotionName: p.name,
        discountAmount: discount,
        description
      };
    });
    await handleCheckout(
      cartItems,
      customerId || invoice.customerId || '',
      total,
      amountPaid,
      invoice.redeemedRewards || [],
      paymentMethod,
      appPromotions,
      invoice.note || ''
    );
  };

  const handleCheckout = async (
    cartItems: CartItem[],
    customerId: string,
    total: number,
    amountPaid: number,
    rewardsRedeemed: { rewardId: string; rewardName: string; pointCost: number; quantity: number }[] = [],
    paymentMethod: string = 'Tiền mặt',
    appliedPromotions: AppliedPromotion[] = [],
    note: string = ''
  ) => {
    const promotionDiscount = appliedPromotions.reduce((sum, ap) => sum + ap.discountAmount, 0);
    const finalTotal = Math.max(0, total - promotionDiscount);
    const debtIncurred = Math.max(0, finalTotal - amountPaid);

    // Phase 6: Fetch all products needed for checkout
    const cartProductIds = cartItems.map(item => item.id);
    const allProducts = await supabaseService.getProductsByIds(cartProductIds);

    const eligibleTotal = cartItems.reduce((sum, item) => {
      const product = allProducts.find(p => p.id === item.id);
      if (product?.isPointAccumulationEnabled) {
        return sum + (item.price ?? 0) * (item.cartQuantity ?? 0);
      }
      return sum;
    }, 0);

    const pointsEarned = Math.floor(eligibleTotal / (appSettings.pointConversionRate || 1));
    const pointsRedeemed = rewardsRedeemed.reduce((sum, r) => sum + (r.pointCost * r.quantity), 0);

    // STEP 4: Kiểm tra không đổi quá số điểm hiện có
    let validationCustomer: Customer | undefined;
    if (customerId) {
      validationCustomer = (await supabaseService.getCustomerById(customerId)) ?? undefined;
    }
    if (rewardsRedeemed.length > 0) {
      const currentPoints = (validationCustomer as any)?.loyaltyPoints || (validationCustomer as any)?.points || 0;
      if (pointsRedeemed > currentPoints) {
        throw new AppError(`Không đủ điểm để đổi quà. Cần ${pointsRedeemed} điểm, hiện có ${currentPoints} điểm.`, 'INSUFFICIENT_POINTS');
      }
    } else if (pointsRedeemed > 0) {
      // fallback nếu không có customer
      throw new AppError('Không thể đổi quà: chưa chọn khách hàng.', 'CUSTOMER_NOT_SELECTED');
    }

    let finalCustomerId = customerId;
    if (!finalCustomerId || finalCustomerId === '' || finalCustomerId === 'guest') {
      let guestCustomer = await supabaseService.getGuestCustomer();
      if (guestCustomer) {
        finalCustomerId = guestCustomer.id;
      }
    }

    let customer = await supabaseService.getCustomerById(finalCustomerId);
    if (!customer && finalCustomerId) {
      customer = await supabaseService.getCustomerById(finalCustomerId);
    }
    const isCustomerOrder = !!customer && finalCustomerId !== 'guest';
    const effectiveSpent = finalTotal;

    // ─── Helper: tạo order + op và gửi server/queue offline ──────────────
    const buildOrderAndPush = async (orderId: string): Promise<{ order: Order; productUpdates: Product[] }> => {
      const newOrder: Order = {
        id: orderId,
        date: new Date().toISOString(),
        customerId: finalCustomerId,
        customerName: customer?.name || 'Khách lẻ',
        items: cartItems.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.cartQuantity ?? 0,
          unitName: item.selectedUnit?.name || item.unit,
          price: item.price ?? 0,
          // Phase 3B.2: persist lot reference into order_items
          lotId: (item as any).selectedLot?.id || undefined,
          lotCode: (item as any).selectedLot?.code || undefined,
        })),
        totalAmount: finalTotal,
        paidAmount: amountPaid,
        debtRecorded: debtIncurred,
        paymentMethod,
        status: 'completed',
        pointsEarned,
        pointsRedeemed,
        rewardsRedeemed,
        appliedPromotions,
        note
      };

      const productDeltas = cartItems
        .map(item => {
          const product = allProducts.find(p => p.id === item.id);
          if (!product) return null;
          let deductBaseQty = item.cartQuantity ?? 0;
          if (item.selectedUnit) deductBaseQty *= item.selectedUnit.ratio ?? 1;
          // Phase 4: nếu product có lot và user đã chọn lot trong cart, đính kèm lotId
          // để RPC trừ vào dòng product_lots tương ứng (thay vì products.quantity).
          const lotId = (item as any).selectedLot?.id || undefined;
          return { productId: item.id, deductBaseQty, lotId };
        })
        .filter(Boolean) as { productId: string; deductBaseQty: number; lotId?: string }[];

      const productUpdates = productDeltas
        .map(d => {
          const product = allProducts.find(p => p.id === d.productId);
          if (!product) return null;
          return { ...product, quantity: (product.quantity ?? 0) - d.deductBaseQty };
        })
        .filter(Boolean) as Product[];

      const pointHistoryEntries: PointHistory[] = [];
      if (isCustomerOrder) {
        if (pointsEarned > 0) {
          pointHistoryEntries.push({
            id: `PH_E_${newOrder.id}`,
            customerId: finalCustomerId,
            date: newOrder.date,
            type: 'earn',
            amount: pointsEarned,
            description: `Tích điểm từ đơn hàng ${newOrder.id}`,
            orderId: newOrder.id
          });
        }
        if (pointsRedeemed > 0) {
          const rewardNames = rewardsRedeemed.map(r => `${r.quantity}x ${r.rewardName}`).join(', ');
          pointHistoryEntries.push({
            id: `PH_R_${newOrder.id}`,
            customerId: finalCustomerId,
            date: newOrder.date,
            type: 'redeem',
            amount: -pointsRedeemed,
            description: `Đổi quà: ${rewardNames} (Đơn hàng ${newOrder.id})`,
            orderId: newOrder.id
          });
        }
      }

      const op: CheckoutOp = {
        type: 'checkout',
        // Phase 2: sinh opId duy nhất TẠI ĐÂY (không phải khi sync).
        // Nhờ vậy nếu op bị retry hoặc sync 2 lần, server vẫn nhận đúng 1 opId
        // → idempotency check trong RPC sẽ skip lần thứ 2.
        opId: generateOpId(),
        order: newOrder,
        productDeltas,
        rewardDeltas: rewardsRedeemed.map(r => ({ rewardId: r.rewardId, quantity: r.quantity })),
        customerUpdate: isCustomerOrder
          ? {
              customerId: finalCustomerId,
              addSpent: effectiveSpent,
              addDebt: debtIncurred,
              addPoints: pointsEarned - pointsRedeemed
            }
          : undefined,
        pointHistory: pointHistoryEntries,
        timestamp: Date.now()
      };

      // ─── Gọi server / queue offline ────────────────────────────────────
      // Phase 1: phân biệt rõ lỗi NETWORK (queue + thử lại) vs lỗi BUSINESS
      // (vd: tồn kho không đủ — KHÔNG queue, KHÔNG cập nhật state, throw cho UI hiển thị).
      try {
        if (isOnline()) {
          // Phase 7.3: truyền cờ allowNegativeStock từ Settings xuống RPC
          const allowNeg = (appSettings as any).allowNegativeStock === true;
          await supabaseService.pushCheckout(op, allowNeg);
        } else {
          offlineQueue.add(op);
        }
      } catch (error: any) {
        if (isNetworkError(error)) {
          // Mất mạng giữa chừng → queue để sync sau

          offlineQueue.add(op);
        } else {
          // Lỗi nghiệp vụ từ RPC (tồn kho không đủ, sản phẩm không tồn tại, ...)
          // KHÔNG cập nhật state client, KHÔNG queue → throw cho usePOS hiển thị toast đỏ.
          // DB đã tự rollback (transaction trong RPC).

          throw new AppError(error?.message || 'Lỗi xử lý đơn hàng', 'ORDER_PROCESSING_ERROR', { originalError: error });
        }
      }

      return { order: newOrder, productUpdates };
    };

    // ─── Sinh mã hóa đơn HDXXXXXXX ─────────────────────────────────────
    let orderId: string;
    try {
      orderId = isOnline() ? await generateInvoiceNumber() : generateOfflineInvoiceNumber();
    } catch (error) {

      orderId = generateOfflineInvoiceNumber();
    }

    // ─── Retry nếu mã hóa đơn bị trùng (race condition giữa các client) ──
    let newOrder: Order;
    let productUpdates: Product[];
    let attempts = 0;
    const maxAttempts = 3;

    while (true) {
      try {
        const result = await buildOrderAndPush(orderId);
        newOrder = result.order;
        productUpdates = result.productUpdates;
        break;
      } catch (error: any) {
        attempts++;
        if (isDuplicateInvoiceNumberError(error) && attempts < maxAttempts) {

          try {
            orderId = await generateInvoiceNumber();
          } catch (e) {
            orderId = generateOfflineInvoiceNumber();
          }
          continue;
        }
        throw error;
      }
    }

    // ─── Cập nhật state client (chỉ chạy khi server đã chấp nhận hoặc đã queue) ─
    setOrders(prev => [newOrder, ...prev]);

    

    

    if (rewardsRedeemed.length > 0) {
      const newRewards = rewards.map(rw => {
        const redeemed = rewardsRedeemed.find(r => r.rewardId === rw.id);
        if (redeemed) return { ...rw, stock: Math.max(0, (rw.stock || 0) - redeemed.quantity) };
        return rw;
      });
      setRewards(newRewards);
      offlineCache.setRewards(newRewards);
    }

    // No extra alert here — handleDirectCheckout shows the toast
  };

  /**
   * Phase 14: Thanh toán công nợ — Server-authoritative.
   *
   * ✅ Fix các bug:
   *   1. Race condition khi loop sequential (mode multi) — server lock + validate
   *   2. Optimistic update che lỗi — gọi RPC trước, sau đó cập nhật state từ kết quả thật
   *   3. paid_amount vượt total — RPC clamp về remaining_debt
   *   4. Tiền dư biến mất — RPC trả về change_amount để client biết
   *   5. Mất nhất quán DB — RPC atomic 1 transaction
   *   7. Khách vãng lai — RPC tự bỏ qua customers UPDATE khi customer_id null/guest
   *
   * Throw lỗi business để PayDebtModal hiển thị message rõ ràng cho user.
   */
  const handlePayCustomerDebt = async (orderId: string, amount: number): Promise<void> => {
    // 1. Gọi RPC atomic — đây là source of truth
    const result = await supabaseService.payOrderDebt(orderId, amount);

    // 2. Cập nhật state CHÍNH XÁC theo kết quả từ server (không tính ở client)
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          paidAmount: result.newOrderPaid,
          debtRecorded: result.newOrderDebt,
        };
      }
      return o;
    }));

    // 3. Cập nhật customer state nếu RPC đã update customer (newCustomerDebt != null)
    

    // Note: không alert ở đây — caller (PayDebtModal) sẽ hiển thị toast theo result
    // (bao gồm cả tiền thừa nếu result.changeAmount > 0)
  };

  /**
   * Xoá đơn hàng — Phase 5: dùng RPC atomic.
   *
   * Toàn bộ logic hoàn kho/customer/points/lot do RPC `delete_order` xử lý ATOMIC.
   * Client chỉ:
   *   1. Confirm với user.
   *   2. Gọi RPC.
   *   3. Hiển thị lỗi business (vd: "đã có phiếu trả") cho user.
   *   4. Reload state từ DB để đồng bộ 100%.
   */
  const handleDeleteOrder = async (orderId: string) => {
    // Phase 11: Đổi semantics 'Xoá' → 'Huỷ' (soft-delete, đơn vẫn lưu DB với status='cancelled')
    if (!confirm('Bạn có chắc muốn HUỶ hoá đơn này?\n\n• Đơn sẽ được đánh dấu "Đã huỷ" (vẫn giữ trong lịch sử để tra cứu).\n• Tồn kho, công nợ và điểm thưởng sẽ được hoàn tác.\n• Không thể trả hàng hoặc thao tác thêm trên đơn đã huỷ.')) return;

    try {
      // RPC atomic: hoàn kho (lock + lot) + hoàn customer + xoá point_history,
      // sau đó UPDATE status='cancelled' (giữ orders + order_items).
      // Tự RAISE nếu đơn còn phiếu trả hiệu lực hoặc đã ở trạng thái cancelled.
      await supabaseService.cancelOrder(orderId);

      // Phase 5: không tải lại toàn bộ list. Các tab server-side tự refetch.
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));

      alert("Đã huỷ đơn hàng và hoàn tác dữ liệu.");
    } catch (error: any) {

      // Lỗi business (đơn có phiếu trả, đơn đã huỷ, ...) → hiển thị nguyên message tiếng Việt
      alert(error?.message || "Lỗi khi huỷ đơn hàng.");
    }
  };

  /**
   * Nhập hàng - Phase 3:
   * - Toàn bộ logic (cộng kho, tính giá vốn BQGQ, cộng nợ NCC) được xử lý
   *   atomic trong PostgreSQL function `create_import_receipt` (Phase 1).
   * - Frontend chỉ validate input và gọi 1 RPC duy nhất.
   * - Sau khi thành công, reload dữ liệu từ DB để đảm bảo state đồng bộ 100%.
   */
  const handleImport = async (
    items: ImportItemInput[],
    supplierId: string,
    totalCost: number,
    paidAmount: number,
    invoiceNumber: string,
    importDate: string,
    shippingCost: number = 0,
    // Phase 10: status / discountTotal / note → round-trip draft
    status: 'draft' | 'completed' = 'completed',
    discountTotal: number = 0,
    note: string = '',
    receiptId?: string
  ) => {
    // ===== VALIDATE CLIENT-SIDE (Defense in depth - tầng phòng thủ 1) =====
    if (!items || items.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để nhập.');
      return;
    }
    if (!supplierId) {
      alert('Vui lòng chọn nhà cung cấp.');
      return;
    }
    if (paidAmount < 0) {
      alert('Số tiền đã trả không được âm.');
      return;
    }
    if (shippingCost < 0) {
      alert('Phí vận chuyển không được âm.');
      return;
    }
    if (discountTotal < 0) {
      alert('Giảm giá toàn phiếu không được âm.');
      return;
    }
    // Fetch products to get names for validation
    const productIds = items.map(item => item.productId);
    const fetchedProducts = await supabaseService.getProductsByIds(productIds);
    
    for (const item of items) {
      const product = fetchedProducts.find(p => p.id === item.productId);
      const productName = product?.name || item.productId;
      if (!item.quantity || item.quantity <= 0) {
        alert(`Sản phẩm "${productName}" có số lượng không hợp lệ (phải > 0).`);
        return;
      }
      if (item.cost == null || item.cost < 0) {
        alert(`Sản phẩm "${productName}" có giá nhập không hợp lệ (phải >= 0).`);
        return;
      }
    }

    // Phase 5a: Kiểm tra trùng số hóa đơn NCC (theo supplier hoặc toàn bộ)
    if (invoiceNumber?.trim()) {
      const existingInvoice = await supabaseService.getImportReceiptByInvoiceNumber(invoiceNumber, supplierId);
      if (existingInvoice && existingInvoice.id !== receiptId) {
        alert('Số hóa đơn NCC đã tồn tại.');
        return;
      }
    }

    // Phase 5a: Kiểm tra mã phiếu đã tồn tại ở trạng thái hoàn thành
    if (receiptId) {
      const existingReceipt = await supabaseService.getImportReceiptById(receiptId);
      if (existingReceipt && existingReceipt.status !== 'draft') {
        alert('Mã phiếu đã tồn tại.');
        return;
      }
    }

    const needToPay = Math.max(0, totalCost + shippingCost - discountTotal);
    const debtIncurred = Math.max(0, needToPay - paidAmount);
    const supplier = await supabaseService.getSupplierById(supplierId);

    // Đính kèm thông tin name vào items để hiển thị tốt trong DB
    // (productIds & fetchedProducts đã được fetch ở trên để validation)
    const itemsWithName = items.map(item => {
      const product = fetchedProducts.find(p => p.id === item.productId);
      return {
        ...item,
        name: (item as any).name || product?.name || item.productId
      };
    });

    // Phase 10: draft KHÔNG ghi công nợ (DB cũng bỏ qua, nhưng tránh truyền nhầm)
    const isDraft = status === 'draft';
    const receiptPayload = {
      id: receiptId || `PN${Date.now()}`,
      invoice_number: invoiceNumber || null,
      date: importDate,
      supplier_id: supplierId,
      supplier_name: supplier?.name || 'N/A',
      total_cost: totalCost,
      shipping_cost: shippingCost,
      paid_amount: paidAmount,
      debt_recorded: isDraft ? 0 : debtIncurred,
      status,
      discount_total: discountTotal,
      note: note || null,
      items: itemsWithName
    };

    try {
      // 🚀 GỌI 1 LỆNH RPC DUY NHẤT - Atomic, Row-locked, tự rollback nếu lỗi
      await supabaseService.createImportReceipt(receiptPayload);

      // Phase 5: không tải lại toàn bộ products/suppliers. Tab nhập hàng server-side tự refetch.
      const newReceipt: ImportReceipt = {
        id: receiptPayload.id,
        supplierId,
        supplierName: receiptPayload.supplier_name,
        totalCost,
        shippingCost,
        discountTotal,
        paidAmount,
        debtRecorded: receiptPayload.debt_recorded,
        invoiceNumber,
        date: importDate,
        status,
        note,
        items
      };
      

      alert(isDraft ? 'Đã lưu tạm phiếu nhập (chưa ghi nhận tồn kho/công nợ).' : 'Nhập hàng thành công!');
    } catch (error: any) {

      // PostgreSQL function đã rollback - DB ở trạng thái nhất quán
      alert(error?.message || 'Lỗi nhập hàng. Vui lòng kiểm tra lại kết nối.');
    }
  };

  const handleDeleteImport = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá phiếu nhập này? Tồn kho và công nợ sẽ được hoàn tác.')) return;

    const parseDeleteError = (message: string): string => {
      if (!message) return 'Lỗi khi xoá phiếu nhập. Vui lòng thử lại.';
      const productMatch = message.match(/Sản phẩm\s+(.+?)\s+đã bán vượt quá số lượng nhập/);
      if (productMatch) {
        return `Không thể xóa: sản phẩm ${productMatch[1].trim()} đã bán vượt quá lượng nhập. Vui lòng kiểm tra tồn kho.`;
      }
      const lotMatch = message.match(/Lô\s+(.+?)\s+của sản phẩm\s+(.+?)\s+không đủ tồn kho/);
      if (lotMatch) {
        return `Không thể xóa: lô ${lotMatch[1].trim()} của sản phẩm ${lotMatch[2].trim()} không đủ tồn kho.`;
      }
      return message;
    };

    try {
      // REBUILD V2: Luồng xóa chứng từ hoàn kho atomic 100% bằng RPC delete_import_v2
      await supabaseService.deleteImportReceipt(id);

      alert('Đã xoá phiếu nhập và hoàn kho thành công!');
    } catch (err: any) {

      alert(parseDeleteError(err?.message || ''));
    }
  };

  const handleUpdateImport = async (updatedReceipt: ImportReceipt) => {
    try {
      // REBUILD V2: Gọi update_import_v2 để xử lý atomic:
      // - draft -> draft/completed: xóa + tạo lại
      // - completed -> completed: đảo ngược kho + nhập lại
      await supabaseService.updateImportReceipt(updatedReceipt);

      alert(updatedReceipt.status === 'draft'
        ? 'Đã lưu tạm phiếu nhập.'
        : 'Đã cập nhật và hoàn thành phiếu nhập kho thành công!');
    } catch (error: any) {

      alert(error?.message || "Lỗi cập nhật phiếu nhập. Vui lòng thử lại.");
    }
  };

  const handlePayDebt = async (receiptId: string, amount: number) => {
    // Phase 8d: Dùng RPC atomic pay_supplier_debt (đã ghi supplier_payment_ledger từ 8a).
    // Thay cho 2 query rời rạc cũ (updateImportReceiptPayment + upsertSupplier) không atomic.
    try {
      await supabaseService.paySupplierDebt(receiptId, amount);
    } catch (error: any) {

      alert(error?.message || "Lỗi khi lưu thanh toán công nợ nhà cung cấp vào hệ thống.");
    }
  };

  if (authLoading || tenantLoading || isAdminLoading || (isLoading && user)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu từ hệ thống...</p>
        </div>
      </div>
    );
  }

  if (mfaPending) {
    return <MfaChallenge />;
  }

  // ponytail: route accept invitation cần truy cập bởi mọi user đã đăng nhập,
  // không phụ thuộc system admin role hay tenant membership.
  if (location.pathname === '/admin/invitations/accept') {
    if (!user) return <Login redirectTo={location.pathname + location.search} />;
    return (
      <ToastProvider>
        <Suspense fallback={<LoadingState message="Đang tải lời mời..." />}>
          <InvitationsAccept />
        </Suspense>
      </ToastProvider>
    );
  }

  const subdomain = getSubdomain();
  const isAdminPath = location.pathname.startsWith('/admin');

  // ponytail: admin subdomain hoặc route /admin/* đều vào admin dashboard; user thường bị chặn.
  if (subdomain === 'admin' || isAdminPath) {
    if (!user) return <Login />;
    if (!isSystemAdmin) return <TenantForbiddenPage />;
    return (
      <ToastProvider>
        <Routes>
          <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
          <Route path="/" element={<Navigate to="/admin/overview" replace />} />
          <Route path="/admin/*" element={<AdminSuspense><AdminLayout /></AdminSuspense>}>
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview" element={<AdminSuspense><AdminOverview /></AdminSuspense>} />
            <Route path="tenants" element={<AdminSuspense><AdminTenants /></AdminSuspense>} />
            <Route path="tenants/:id" element={<AdminSuspense><AdminTenantDetail /></AdminSuspense>} />
            <Route path="members" element={<AdminSuspense><AdminMembers /></AdminSuspense>} />
            <Route path="billing" element={<AdminSuspense><AdminBilling /></AdminSuspense>} />
            <Route path="billing/invoices" element={<AdminSuspense><AdminBillingInvoices /></AdminSuspense>} />
            <Route path="billing/payments" element={<AdminSuspense><AdminBillingPayments /></AdminSuspense>} />
            <Route path="audit" element={<AdminSuspense><AdminAudit /></AdminSuspense>} />
            <Route path="settings" element={<AdminSuspense><AdminSettings /></AdminSuspense>} />
            <Route path="security" element={<AdminSuspense><AdminSecurity /></AdminSuspense>} />
            <Route path="health" element={<AdminSuspense><AdminHealth /></AdminSuspense>} />
            <Route path="analytics" element={<AdminSuspense><AdminAnalytics /></AdminSuspense>} />
            <Route path="compliance" element={<AdminSuspense><AdminCompliance /></AdminSuspense>} />
            <Route path="onboarding" element={<AdminSuspense><AdminOnboarding /></AdminSuspense>} />
          </Route>
        </Routes>
      </ToastProvider>
    );
  }

  // ponytail: root domain không resolve tenant; hiển thị landing page.
  if (!subdomain) {
    return <LandingPage />;
  }

  // Subdomain là cửa hàng: phải tồn tại, không bị tạm dừng, và user phải là thành viên.
  if (!tenant) {
    return <TenantNotFoundPage />;
  }

  if (tenant.status === 'suspended') {
    return <TenantSuspendedPage />;
  }

  if (!user) {
    return <Login />;
  }

  if (!membership) {
    return <TenantForbiddenPage />;
  }

  const isPosView = location.pathname === '/pos';

  // Landing page hiển thị TOÀN MÀN HÌNH, không bao bọc bởi Sidebar/BottomNav/MobileLayout.
  // Phải đặt sau `if (!user)` để giữ nguyên behavior: route chỉ truy cập được khi đã đăng nhập
  // (các link tới /gioi-thieu đều nằm trong Sidebar/Settings/MobileSettings — vùng post-login).
  if (location.pathname === '/gioi-thieu') {
    return <LandingPage />;
  }

  // ==============================
  // Shared route definitions
  // ==============================
  const sharedRoutes = (
    <>
      <Route path="/products" element={
        <Products
          categories={categories}
          brands={brands}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onBulkDelete={handleBulkDeleteProducts}
          onBulkUpdate={handleBulkUpdateProducts}
          onBulkImport={handleBulkImport}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddBrand={handleAddBrand}
          onUpdateBrand={handleUpdateBrand}
          onDeleteBrand={handleDeleteBrand}
        />
      } />
      <Route path="/inventory-count/create" element={
        <InventoryCountPage
          inventoryCounts={inventoryCounts}
          onSaveInventoryCount={handleSaveInventoryCount}
          onDeleteInventoryCount={handleDeleteInventoryCount}
          onCancelInventoryCount={handleCancelInventoryCount}
        />
      } />
      <Route path="/inventory-count" element={
        <InventoryCountPage
          inventoryCounts={inventoryCounts}
          onSaveInventoryCount={handleSaveInventoryCount}
          onDeleteInventoryCount={handleDeleteInventoryCount}
          onCancelInventoryCount={handleCancelInventoryCount}
        />
      } />
      <Route path="/brands" element={
        <BrandManagement 
          brands={brands}
          onAddBrand={handleAddBrand}
          onUpdateBrand={handleUpdateBrand}
          onDeleteBrand={handleDeleteBrand}
        />
      } />
      <Route path="/categories" element={
        <CategoryManagement
          categories={categories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      } />
      <Route path="/customers" element={

        <CustomersWrapper
          pointHistory={pointHistory}
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onBulkDelete={handleBulkDeleteCustomers}
          onPayDebt={handlePayCustomerDebt}
          onDeleteOrder={handleDeleteOrder}
          onAdjustPoints={handleAdjustPoints}
        />
      } />
      <Route path="/suppliers" element={
        <Suppliers
          onAddSupplier={handleAddSupplier}
          onUpdateSupplier={handleUpdateSupplier}
          onDeleteSupplier={handleDeleteSupplier}
          onPayDebt={handlePayDebt}
        />
      } />
      <Route path="/pos" element={
        <POS 
          invoices={posInvoices}
          activeTabId={posActiveTabId}
          onUpdateInvoices={setPosInvoices}
          onSetActiveTabId={setPosActiveTabId}
          onCheckout={handlePosCheckout} 
          onAddCustomer={handleAddCustomer}
          appSettings={appSettings}
          rewards={rewards}
          promotions={promotions}
        />
      } />
      <Route path="/import/create" element={
        <ImportGoods
          onImport={handleImport}
          onAddSupplier={handleAddSupplier}
          onDeleteImport={handleDeleteImport}
          onUpdateImport={handleUpdateImport}
        />
      } />
      <Route path="/import" element={
        <ImportGoods
          onImport={handleImport}
          onAddSupplier={handleAddSupplier}
          onDeleteImport={handleDeleteImport}
          onUpdateImport={handleUpdateImport}
        />
      } />
      <Route path="/orders" element={
        <Orders 
          onDeleteOrder={handleDeleteOrder}
          onPayDebt={handlePayCustomerDebt}
          appSettings={appSettings} 
        />
      } />
      <Route path="/return-orders" element={
        <ReturnOrders 
          orders={orders} 
          appSettings={appSettings} 
          isAppLocked={isAppLocked}
          setIsAppLocked={setIsAppLocked}
        />
      } />
      {/* ─── MODULE XUẤT HỦY ─── */}
      <Route path="/inventory/disposals" element={<Disposals />} />
      <Route path="/inventory/disposals/create" element={<DisposalForm />} />
      <Route path="/inventory/disposals/:id/view" element={<DisposalForm />} />
      <Route path="/inventory/disposals/:id/edit" element={<DisposalForm />} />
      {/* ─── MODULE ĐỔI TRẢ HÀNG NCC ─── */}
      <Route path="/inventory/supplier-exchanges" element={
        <SupplierExchanges
          appSettings={appSettings}
        />
      } />
      <Route path="/inventory/supplier-exchanges/create" element={
        <SupplierExchanges
          appSettings={appSettings}
        />
      } />
      <Route path="/reports" element={
        <Reports />
      } />
      <Route path="/audit-log" element={<AuditLog />} />
      <Route path="/stock-ledger" element={<StockLedger />} />
      <Route path="/tax" element={<TaxCalculation />} />
      <Route path="/settings" element={
        <div className="space-y-6">
          <Settings 
            settings={appSettings}
            rewards={rewards}
            onUpdateSettings={handleUpdateSettings}
            onAddReward={handleAddReward}
            onDeleteReward={handleDeleteReward}
            promotions={promotions}
            onAddPromotion={(p) => {
              setPromotions(prev => {
                const updated = [...prev, p];
                try { localStorage.setItem('vietsale_promotions', JSON.stringify(updated)); } catch(e) {}
                return updated;
              });
            }}
            onUpdatePromotion={(p) => {
              setPromotions(prev => {
                const updated = prev.map(pr => pr.id === p.id ? p : pr);
                try { localStorage.setItem('vietsale_promotions', JSON.stringify(updated)); } catch(e) {}
                return updated;
              });
            }}
            onDeletePromotion={(id) => {
              setPromotions(prev => {
                const updated = prev.filter(p => p.id !== id);
                try { localStorage.setItem('vietsale_promotions', JSON.stringify(updated)); } catch(e) {}
                return updated;
              });
            }}
          />
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Quản lý dữ liệu</h3>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSeedData}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Đồng bộ dữ liệu mẫu (Reset)
              </button>
              <p className="text-sm text-gray-500">
                Sử dụng tính năng này nếu cơ sở dữ liệu trống hoặc bạn muốn khôi phục dữ liệu mẫu ban đầu.
              </p>
            </div>
          </div>
        </div>
      } />
      <Route path="/profile" element={<Profile />} />
      <Route path="/members" element={<MemberManagement isTenantAdmin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ====== DESKTOP LAYOUT (lg+) ====== */}
      {/* Dùng hidden lg:block thay vì isDesktopView && để đồng bộ CSS thuần, không phụ thuộc React state */}
      {useNewAppShell ? (
        <div className="hidden lg:block">
          <AppShell isLocked={isAppLocked} isPosView={isPosView}>
            <Routes>
              <Route path="/" element={<Navigate to="/tong-quan" replace />} />
              <Route path="/tong-quan" element={
                <Dashboard
                  onViewDebtCustomers={handleViewDebtCustomers}
                />
              } />
              {sharedRoutes}
            </Routes>
          </AppShell>
        </div>
      ) : (
        <div className="hidden lg:block">
          <AppTopbar
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            isLocked={isAppLocked}
          />
        </div>
      )}

      {/* Desktop content wrapper — legacy path only */}
      {!useNewAppShell && (
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          {/* pt-16 để tránh fixed topbar (h-16) */}
          <main className={isPosView
            ? 'h-[calc(100vh-78px)] overflow-hidden pt-16'
            : 'flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6 mt-16'
          }>
            <Routes>
              <Route path="/" element={<Navigate to="/tong-quan" replace />} />
              <Route path="/tong-quan" element={
                <Dashboard
                  onViewDebtCustomers={handleViewDebtCustomers}
                />
              } />
              {sharedRoutes}
            </Routes>
          </main>
        </div>
      )}

      {/* ====== MOBILE / TABLET LAYOUT (below lg) ====== */}
      <div className="lg:hidden h-full">
        <MobileLayout>
          <main className="flex-1 overflow-y-auto pb-24">
            <Routes>
              <Route path="/" element={<Navigate to="/tong-quan" replace />} />
              <Route path="/tong-quan" element={
                <MobileHome
                  storeName={appSettings.storeName || ''}
                  onOpenSettings={() => setIsMobileMenuOpen(true)}
                />
              } />
              <Route path="/pos" element={
                <MobilePOS 
                  invoices={posInvoices}
                  activeTabId={posActiveTabId}
                  onUpdateInvoices={setPosInvoices}
                  onSetActiveTabId={setPosActiveTabId}
                  onCheckout={handlePosCheckout} 
                  onAddCustomer={handleAddCustomer}
                  appSettings={appSettings}
                  rewards={rewards}
                  promotions={promotions}
                />
              } />
              <Route path="/orders" element={
                <MobileOrders 
                  onDeleteOrder={handleDeleteOrder}
                  onPayDebt={handlePayCustomerDebt}
                  appSettings={appSettings} 
                />
              } />
              <Route path="/customers" element={
                <MobileCustomers
                  appSettings={appSettings}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onBulkDelete={handleBulkDeleteCustomers}
                  onPayDebt={handlePayCustomerDebt}
                  onDeleteOrder={handleDeleteOrder}
                  onAdjustPoints={handleAdjustPoints}
                />
              } />
              <Route path="/products" element={
                <MobileInventory 
                  categories={categories}
                  brands={brands}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onAddBrand={handleAddBrand}
                  onUpdateBrand={handleUpdateBrand}
                  onDeleteBrand={handleDeleteBrand}
                />
              } />
              <Route path="/tong-quan-chi-tiet" element={
                <Dashboard 
                  onViewDebtCustomers={handleViewDebtCustomers}
                />
              } />
              <Route element={<MobileSharedLayout />}>
                {sharedRoutes}
              </Route>
            </Routes>
          </main>
        </MobileLayout>
        <BottomNav onMenuClick={() => setIsMobileMenuOpen(true)} isLocked={isAppLocked} />
        
        {/* Mobile Settings Bottom Sheet */}
        <MobileSettings
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          settings={appSettings}
          rewards={rewards}
          onUpdateSettings={handleUpdateSettings}
          onAddReward={handleAddReward}
          onDeleteReward={handleDeleteReward}
          promotions={promotions}
          onAddPromotion={(p) => {
            setPromotions(prev => {
              const updated = [...prev, p];
              try { localStorage.setItem('vietsale_promotions', JSON.stringify(updated)); } catch(e) {}
              return updated;
            });
          }}
          onUpdatePromotion={(p) => {
            setPromotions(prev => {
              const updated = prev.map(pr => pr.id === p.id ? p : pr);
              try { localStorage.setItem('vietsale_promotions', JSON.stringify(updated)); } catch(e) {}
              return updated;
            });
          }}
          onDeletePromotion={(id) => {
            setPromotions(prev => {
              const updated = prev.filter(p => p.id !== id);
              try { localStorage.setItem('vietsale_promotions', JSON.stringify(updated)); } catch(e) {}
              return updated;
            });
          }}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <AppContent />
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
