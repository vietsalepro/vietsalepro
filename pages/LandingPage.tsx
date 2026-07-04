import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Database,
  Gift,
  Headphones,
  Layers,
  Monitor,
  Package,
  Phone,
  Plus,
  Scan,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  WifiOff,
  Zap,
  BarChart3,
  ChevronUp,
  X,
  Menu,
} from 'lucide-react';
import './LandingPage.css';

// ─── Variants ───
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

// ─── Props ───
interface CounterProps {
  end: number;
  suffix: string;
  label: string;
  prefix?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<CounterProps> = ({ end, suffix, label, prefix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const duration = 2000;
          const step = Math.max(1, Math.floor(end / 60));
          const timer = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, duration / 60);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="lp-counter">
      <div className="lp-counter-value">
        {prefix}{count.toLocaleString('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
      </div>
      <div className="lp-counter-label">{label}</div>
    </div>
  );
};

// ─── Spotlight ───
const spotlightHandlers = {
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  },
};

// ─── FAQ Accordion ───
const faqs = [
  {
    q: 'Phần mềm có chạy được khi cửa hàng mất mạng internet không?',
    a: 'Có! Đây là tính năng "cốt lõi" của VietSales Pro v7. Nhờ kiến trúc Offline-first, hệ thống lưu toàn bộ giao dịch vào IndexedDB trên thiết bị của bạn. Nhân viên thu ngân vẫn quét mã vạch, chốt đơn, in hóa đơn bình thường. Khi có mạng trở lại, dữ liệu tự động đồng bộ lên Supabase (PostgreSQL) một cách an toàn, không lo mất số, không lo sót đơn.',
  },
  {
    q: 'Dữ liệu bán hàng của tôi có được bảo mật không?',
    a: 'Tuyệt đối an toàn. VietSales Pro v7 sử dụng Supabase PostgreSQL làm cơ sở dữ liệu nền — một hệ quản trị cơ sở dữ liệu đám mây đạt chuẩn doanh nghiệp. Mọi giao dịch đều được xử lý dưới dạng atomic transaction (giao dịch nguyên tử), đảm bảo tính nhất quán dữ liệu. Dữ liệu của bạn được mã hóa toàn bộ trên đường truyền (SSL/TLS) và chỉ có bạn mới có quyền truy cập thông qua tài khoản đăng nhập bảo mật.',
  },
  {
    q: 'Tôi có thể import dữ liệu hàng hóa từ file Excel cũ vào được không?',
    a: 'Hoàn toàn được. VietSales Pro v7 hỗ trợ tính năng Bulk Import — cho phép bạn tải lên file Excel danh sách sản phẩm (mã hàng, tên, giá vốn, giá bán, tồn kho, lô, hạn dùng…) và hệ thống tự động nhập vào cơ sở dữ liệu. Tiết kiệm hàng giờ nhập liệu thủ công so với các phần mềm khác. Bạn cũng có thể Export báo cáo ra Excel chỉ với 1 chạm.',
  },
];

// ─── Feature Cards ───
const coreFeatures = [
  {
    icon: Layers,
    title: 'POS Đa Nhiệm (Multi-tab)',
    desc: 'Bán hàng cho nhiều khách cùng lúc không phải chờ đợi. Mở nhiều hóa đơn riêng biệt trên nhiều tab, quét mã vạch siêu tốc bằng camera thiết bị, chốt đơn chỉ trong vài giây.',
    gradient: 'from-indigo-500/15 to-violet-500/10',
  },
  {
    icon: Package,
    title: 'Quản lý Lô & Hạn dùng (FEFO)',
    desc: 'Tự động cảnh báo hàng sắp hết hạn, triệt tiêu rủi ro lỗi date cho cửa hàng Mẹ & Bé, Tạp hóa, Thực phẩm chức năng. Xuất kho theo quy tắc FEFO — hàng gần hết hạn xuất trước.',
    gradient: 'from-emerald-500/15 to-teal-500/10',
  },
  {
    icon: WifiOff,
    title: 'Công nghệ Offline-First',
    desc: 'Mất mạng vẫn chốt đơn ầm ầm! Dữ liệu tự động xếp hàng chờ (IndexedDB) và đồng bộ lên Supabase ngay khi có kết nối trở lại. Không lo mất số, không lo gián đoạn kinh doanh.',
    gradient: 'from-amber-500/15 to-orange-500/10',
  },
  {
    icon: Users,
    title: 'CRM & Quản lý Công nợ chuyên sâu',
    desc: 'Tự động tích điểm, thăng hạng thành viên (5 bậc), đổi quà bằng điểm tích lũy. Theo dõi và thanh toán công nợ khách hàng lẫn Nhà cung cấp chỉ trong 1 màn hình — không còn cảnh "nợ dây cà ra dây muống".',
    gradient: 'from-cyan-500/15 to-sky-500/10',
  },
];

// ─── Component ───
const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="lp-shell">
      {/* ─── Decorative Blobs ─── */}
      <div className="lp-blobs">
        <div className="lp-blob lp-blob--1" />
        <div className="lp-blob lp-blob--2" />
        <div className="lp-blob lp-blob--3" />
      </div>

      {/* ════════════════════════════════════════
         NAVBAR
         ════════════════════════════════════════ */}
      <header className="lp-navbar">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <motion.a
            href="#"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="lp-logo-icon">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="lp-logo-text">
                VietSales Pro
              </div>
              <div className="lp-logo-version">v7</div>
            </div>
          </motion.a>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-1 md:flex">
            {[
              { label: 'Tính năng nổi bật', href: '#tinh-nang' },
              { label: 'Chi tiết bảng giá', href: '#bang-gia' },
              { label: 'Câu hỏi thường gặp', href: '#faq' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="lp-nav-link"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden items-center gap-3 sm:flex">
            <button className="lp-nav-btn">
              Đăng nhập
            </button>
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="lp-nav-cta relative overflow-hidden"
            >
              <span className="lp-shimmer" />
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Dùng thử miễn phí
              </span>
            </motion.button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lp-mobile-toggle sm:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lp-mobile-menu sm:hidden"
            >
              <div className="space-y-1 px-4 py-4">
                {[
                  { label: 'Tính năng nổi bật', href: '#tinh-nang' },
                  { label: 'Chi tiết bảng giá', href: '#bang-gia' },
                  { label: 'Câu hỏi thường gặp', href: '#faq' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="lp-mobile-link"
                  >
                    {link.label}
                  </a>
                ))}
                <hr className="lp-mobile-divider" />
                <button className="lp-nav-btn w-full">
                  Đăng nhập
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="lp-nav-cta relative overflow-hidden mt-2 w-full"
                >
                  <span className="lp-shimmer" />
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Dùng thử miễn phí
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ════════════════════════════════════════
         MAIN
         ════════════════════════════════════════ */}
      <main className="relative">
        {/* ─── 1. HERO ─── */}
        <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: Copy */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10">
              <motion.div
                variants={fadeUp}
                className="lp-hero-badge"
              >
                <Sparkles className="h-4 w-4" />
                Giải pháp bán lẻ dành cho cửa hàng hiện đại
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="lp-hero-title lg:text-6xl"
              >
                Thoát Khỏi Ác Mộng{' '}
                <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                  Thất Thoát Kho Hàng & Sót Đơn
                </span>{' '}
                Khi Bán Hàng
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-2xl text-lg leading-8 lp-hero-subtitle sm:text-xl"
              >
                <span className="lp-hero-subtitle-accent">"Quản lý bán hàng thông minh</span> — Bán hàng nhanh, quản lý chính xác, vận hành an tâm.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-4 sm:flex-row">
                <motion.button
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="lp-hero-btn-primary relative overflow-hidden"
                >
                  <span className="lp-shimmer" />
                  <span className="relative z-10 flex items-center gap-2">
                    Bắt đầu dùng thử (Miễn phí)
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="lp-hero-btn-secondary"
                >
                  <PlayCircle className="h-5 w-5" />
                  Xem Video Demo
                </motion.button>
              </motion.div>

              {/* Trust badges */}
              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-3">
                <div className="lp-trust-badge lp-trust-badge--success">
                  <ShieldCheck className="h-4 w-4" />
                  Cam kết bảo mật dữ liệu
                </div>
                <div className="lp-trust-badge lp-trust-badge--primary">
                  <WifiOff className="h-4 w-4" />
                  Chạy tốt khi mất mạng
                </div>
                <div className="lp-trust-badge lp-trust-badge--info">
                  <Smartphone className="h-4 w-4" />
                  PWA — Cài như App
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Dashboard Mockup */}
            <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10">
              <motion.div
                variants={fadeIn}
                className="lp-dashboard"
              >
                {/* Dashboard Header */}
                <div className="lp-dashboard-header">
                  <div>
                    <div className="lp-dashboard-header-title">
                      VietSales Pro Dashboard
                    </div>
                    <div className="lp-dashboard-header-subtitle">Tổng quan cửa hàng</div>
                  </div>
                  <div className="lp-dashboard-status">
                    <span className="lp-dashboard-status-dot" />
                    Đồng bộ Online
                  </div>
                </div>

                {/* Metric Cards Row */}
                <div className="mb-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Doanh thu hôm nay', value: '18.5Tr', sub: '+12.3% so với hqua', color: 'from-indigo-500 to-indigo-600' },
                    { label: 'Lợi nhuận ước tính', value: '4.2Tr', sub: 'Biên 22.7%', color: 'from-emerald-500 to-teal-600' },
                    { label: 'Giá trị kho hàng', value: '286Tr', sub: '1.247 sản phẩm', color: 'from-violet-500 to-purple-600' },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className={`lp-metric-card ${metric.color}`}
                    >
                      <div className="lp-metric-label">{metric.label}</div>
                      <div className="lp-metric-value">{metric.value}</div>
                      <div className="lp-metric-sub">{metric.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Chart Area (Fake Bar Chart) */}
                <div className="lp-chart">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="lp-chart-label">Xu hướng doanh thu 7 ngày</div>
                      <div className="lp-chart-value">+18.4%</div>
                    </div>
                    <div className="lp-chart-growth">
                      <TrendingUp className="h-4 w-4" />
                      Đang tăng trưởng
                    </div>
                  </div>
                  {/* Bar chart visual */}
                  <div className="flex items-end gap-1.5">
                    {[35, 52, 48, 61, 58, 73, 84].map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                          className={`lp-chart-bar ${i === 6 ? 'lp-chart-bar-active' : ''}`}
                          style={{ height: `${h}%` }}
                        />
                        <span className="lp-chart-axis">T{i + 2}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom row: POS tab indicator */}
                <div className="lp-pos-row">
                  <div className="flex items-center gap-3">
                    <div className="lp-pos-icon">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="lp-pos-label">POS Multi-tab</div>
                      <div className="lp-pos-sublabel">3 hóa đơn đang xử lý đồng thời</div>
                    </div>
                  </div>
                  <div className="lp-pos-live">
                    Live
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ─── 2. SOCIAL PROOF / TRUST BANNER ─── */}
        <section className="lp-trust-banner">
          <div className="lp-trust-banner-glow" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatedCounter end={10000} suffix="+" label="Cửa hàng tin dùng" />
              <AnimatedCounter end={50000000} suffix="+" label="Giao dịch an toàn" />
              <AnimatedCounter end={24} suffix="/7" label="Hỗ trợ kỹ thuật" prefix="" />
            </div>
          </div>
        </section>

        {/* ─── 3. CORE FEATURES ─── */}
        <section id="tinh-nang" className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="mb-14 text-center"
            >
              <motion.div
                variants={fadeUp}
                className="lp-section-pretitle"
              >
                <Zap className="h-3.5 w-3.5" />
                4 điểm mạnh cốt lõi
              </motion.div>
              <motion.h2
                variants={fadeUp}
                className="lp-section-title"
              >
                Được xây dựng để bạn{' '}
                <span className="lp-gradient-text">
                  bán hàng không còn lo lắng
                </span>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mx-auto mt-4 max-w-2xl lp-section-desc"
              >
                4 trụ cột công nghệ giúp cửa hàng của bạn vận hành trơn tru, chính xác và chuyên nghiệp hơn mỗi ngày.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid gap-6 sm:grid-cols-2"
            >
              {coreFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    variants={fadeUp}
                    whileHover={{ y: -6 }}
                    className="card-spotlight lp-feature-card group"
                    {...spotlightHandlers}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={`lp-feature-icon ${feature.gradient}`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="lp-feature-title">{feature.title}</h3>
                        <p className="lp-feature-desc">{feature.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Tech Stack Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <div className="lp-tech-badge">
                <Database className="lp-tech-icon" />
                <span className="font-semibold">Công nghệ nền tảng:</span>
                <span className="lp-tech-tag">React 19</span>
                <span className="lp-tech-tag">TailwindCSS v4</span>
                <span className="lp-tech-tag lp-tech-tag--success">Supabase (PostgreSQL)</span>
                <span className="lp-tech-tag lp-tech-tag--purple">PWA</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── 4. PRICING TABLE ─── */}
        <section id="bang-gia" className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="mb-14 text-center"
            >
              <motion.div
                variants={fadeUp}
                className="lp-section-pretitle lp-section-pretitle--success"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Bảng giá minh bạch
              </motion.div>
              <motion.h2
                variants={fadeUp}
                className="lp-section-title"
              >
                Chọn gói phù hợp với{' '}
                <span className="lp-gradient-text-success">
                  quy mô cửa hàng
                </span>{' '}
                của bạn
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mx-auto mt-4 max-w-2xl lp-section-desc"
              >
                Không chiêu trò, không phí ẩn. Tất cả tính năng đều có sẵn ngay từ gói Miễn phí — chỉ khác biệt về giới hạn sản phẩm và hóa đơn.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2"
            >
              {/* GÓI KHỞI NGHIỆP */}
              <motion.div
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="lp-pricing-card"
              >
                <div className="lp-pricing-name">
                  GÓI KHỞI NGHIỆP
                </div>
                <div className="flex items-end gap-2">
                  <div className="lp-pricing-price">MIỄN PHÍ</div>
                  <div className="lp-pricing-period">/ trọn đời</div>
                </div>
                <div className="lp-pricing-note">
                  ⚡ Dành cho cửa hàng mới bắt đầu: Tối đa <strong>50 sản phẩm</strong> và <strong>300 hóa đơn/tháng</strong>
                </div>

                <ul className="mt-7 space-y-3">
                  {[
                    'Sử dụng FULL tất cả tính năng của hệ thống VietSales Pro',
                    'Phân hệ POS Multi-tab bán hàng đa nhiệm, quét mã vạch siêu tốc',
                    'Quản lý Kho hàng thông minh (Theo lô, hạn dùng, cảnh báo hàng dưới định mức)',
                    'Quản lý Nhập hàng, Kiểm kê kho hàng atomic chính xác',
                    'Hệ thống CRM (Quản lý khách hàng, tự động tích điểm, phân hạng 5 bậc thành viên)',
                    'Theo dõi Công nợ khách hàng & Công nợ Nhà cung cấp',
                    'Phân hệ Báo cáo & Thống kê doanh thu, lợi nhuận, top sản phẩm bán chạy',
                    'Phân hệ Tính thuế GTGT (VAT) theo kỳ',
                    'Hỗ trợ chế độ Offline-first (Bán hàng khi mất mạng)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="lp-pricing-list-icon" />
                      <span className="lp-pricing-list-text">{item}</span>
                    </li>
                  ))}
                </ul>

                <button className="lp-pricing-btn">
                  Đăng Ký Trải Nghiệm Ngay
                  <ArrowRight className="h-5 w-5" />
                </button>
              </motion.div>

              {/* GÓI PRO */}
              <motion.div
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="lp-pricing-card lp-pricing-card--featured"
              >
                {/* Badge nổi bật */}
                <div className="absolute -right-1 -top-1">
                  <div className="lp-pricing-card-badge">
                    <Sparkles className="h-3.5 w-3.5" />
                    KHUYÊN DÙNG CHO CỬA HÀNG
                  </div>
                </div>

                <div className="lp-pricing-name">
                  GÓI PRO
                </div>
                <div className="flex items-end gap-2">
                  <div className="lp-pricing-price">100.000đ</div>
                  <div className="lp-pricing-period">/ tháng</div>
                </div>
                <div className="lp-pricing-note lp-pricing-note--primary">
                  🚀 <strong>KHÔNG GIỚI HẠN</strong> sản phẩm & hóa đơn — Thoải mái bùng nổ doanh số!
                </div>

                <ul className="mt-7 space-y-3">
                  {[
                    'Sử dụng FULL trọn bộ tính năng cao cấp nhất của phiên bản v7',
                    'Phân hệ POS Multi-tab bán hàng đa nhiệm, quét mã vạch siêu tốc',
                    'Quản lý Kho hàng theo Lô/Hạn dùng (Hỗ trợ quy tắc xuất kho FEFO tự động)',
                    'Quản lý Nhập hàng & Kiểm kê kho tự động tính toán chênh lệch',
                    'CRM tích điểm tự động, thăng hạng 5 bậc, đổi quà bằng điểm tích lũy',
                    'Quản lý công nợ Đối tác (Khách hàng & Nhà cung cấp) chuyên sâu',
                    'Báo cáo Doanh thu - Lợi nhuận (Tính theo giá vốn BQGQ thực tế), xuất Excel 1 chạm',
                    'Hỗ trợ đầy đủ chế độ Ngoại tuyến Offline-first (IndexedDB, tự đồng bộ an toàn)',
                    'Tích hợp In hóa đơn nhiệt khổ 80mm với form thiết kế custom tùy chỉnh',
                    'Ưu tiên cập nhật sớm các tính năng mới (Như phân hệ E-Invoice Hóa đơn điện tử)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="lp-pricing-list-icon lp-pricing-list-icon--primary" />
                      <span className="lp-pricing-list-text">{item}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="lp-pricing-btn-primary relative overflow-hidden"
                >
                  <span className="lp-shimmer" />
                  <span className="relative z-10 flex items-center gap-2">
                    Nâng Cấp Gói PRO Ngay
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ─── 5. FAQ ─── */}
        <section id="faq" className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="mb-12 text-center"
            >
              <motion.div
                variants={fadeUp}
                className="lp-section-pretitle"
              >
                <Headphones className="h-3.5 w-3.5" />
                Câu hỏi thường gặp
              </motion.div>
              <motion.h2
                variants={fadeUp}
                className="lp-section-title"
              >
                Những điều bạn có thể{' '}
                <span className="lp-gradient-text">
                  thắc mắc
                </span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="space-y-3"
            >
              {faqs.map((faq, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  className={`lp-faq-item ${openFaq === idx ? 'lp-faq-item-active' : ''}`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                  >
                    <span className="lp-faq-question">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: openFaq === idx ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="lp-faq-toggle"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="lp-faq-answer">
                          <p className="lp-faq-answer-text">{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── 6. CTA FINAL ─── */}
        <section className="relative px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="lp-cta"
            >
              {/* Decorative */}
              <div className="lp-cta-glow" />
              <div className="lp-cta-blob" />

              <motion.div variants={fadeUp} className="relative z-10">
                <motion.div
                  variants={fadeUp}
                  className="lp-cta-badge"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Bắt đầu ngay hôm nay
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  className="lp-cta-title"
                >
                  Sẵn sàng đưa cửa hàng của bạn{' '}
                  <span className="lp-cta-title-accent">lên một tầm cao mới</span>?
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  className="lp-cta-desc"
                >
                  Hàng ngàn chủ cửa hàng đã chuyển từ "làm theo cảm tính" sang vận hành có hệ thống với VietSales Pro.
                  Đến lượt bạn!
                </motion.p>
                <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="lp-cta-btn-primary relative overflow-hidden"
                  >
                    <span className="lp-shimmer" />
                    <span className="relative z-10 flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Tạo tài khoản miễn phí
                    </span>
                  </motion.button>
                  <motion.a
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    href="tel:0986495913"
                    className="lp-cta-btn-secondary"
                  >
                    <Phone className="h-5 w-5" />
                    Gọi tư vấn 0986 495 913
                  </motion.a>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ════════════════════════════════════════
         FOOTER
         ════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2">
                <div className="lp-footer-logo-icon">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="lp-logo-text">
                  VietSales Pro
                </div>
              </div>
              <p className="lp-footer-desc">
                Phần mềm quản lý bán hàng thông minh dành cho cửa hàng bán lẻ hiện đại. Bán hàng nhanh, quản lý chính xác, vận hành an tâm.
              </p>
            </div>

            <div className="flex flex-wrap gap-8">
              <div>
                <div className="lp-footer-col-title">Liên kết</div>
                <div className="mt-3 flex flex-col gap-2">
                  <a href="#tinh-nang" className="lp-footer-link">Tính năng</a>
                  <a href="#bang-gia" className="lp-footer-link">Bảng giá</a>
                  <a href="#faq" className="lp-footer-link">FAQ</a>
                </div>
              </div>
              <div>
                <div className="lp-footer-col-title">Chính sách</div>
                <div className="mt-3 flex flex-col gap-2">
                  <a href="#" className="lp-footer-link">Chính sách bảo mật</a>
                  <a href="#" className="lp-footer-link">Điều khoản sử dụng</a>
                  <a href="#" className="lp-footer-link">Hướng dẫn PWA</a>
                </div>
              </div>
              <div>
                <div className="lp-footer-col-title">Liên hệ</div>
                <div className="lp-footer-col-body">
                  <div className="font-semibold">HKD Sữa Cậu Ba</div>
                  <div>392, Thôn Duy Cần, Xã Tánh Linh, Tỉnh Lâm Đồng</div>
                  <a href="tel:0986495913" className="lp-footer-contact">0986 495 913</a>
                  <a href="mailto:vietsalepro@gmail.com" className="lp-footer-contact">vietsalepro@gmail.com</a>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-footer-copyright">
            © 2026 VietSales Pro v7 — Phát triển bởi{' '}
            <span className="lp-footer-copyright-brand">HKD Sữa Cậu Ba</span>
            {' '}| Tất cả quyền được bảo lưu.
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ─── Extra Icons ─── */
const PlayCircle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="10,8 16,12 10,16" fill="currentColor" />
  </svg>
);

export default LandingPage;