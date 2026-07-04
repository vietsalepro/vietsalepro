import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt', // Thay đổi từ autoUpdate sang prompt để tránh tự động reload
          includeAssets: ['icon.svg'],
          manifest: {
            name: 'VietSales Pro',
            short_name: 'VietSales',
            description: 'Ứng dụng quản lý bán hàng chuyên nghiệp',
            theme_color: '#22c55e',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
              {
                src: 'icon.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              },
              {
                src: 'icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
            skipWaiting: false,
            clientsClaim: false
          },
  // Thêm dev options
  devOptions: {
    enabled: false, // Tắt PWA khi development
    type: 'module'
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Core framework
              'vendor-core': ['react', 'react-dom', 'react-router-dom'],
              // UI / animation / charts
              'vendor-icons': ['lucide-react'],
              'vendor-motion': ['framer-motion'],
              'vendor-charts': ['recharts'],
              // Data / heavy utilities
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-xlsx': ['xlsx'],
              'vendor-qrcode': ['html5-qrcode'],
              // Application business utilities (shared across many pages)
              'app-services': ['./services/supabaseService.ts', './utils/offlineManager.ts'],
              // Page-specific chunks
              'pages-dashboard': ['./pages/Dashboard.tsx'],
              'pages-pos': ['./pages/POS.tsx'],
              'pages-products': ['./pages/Products.tsx'],
              'pages-inventory-count': ['./pages/InventoryCount.tsx'],
              'pages-people': ['./pages/Customers.tsx', './pages/Orders.tsx'],
              'pages-suppliers': ['./pages/Suppliers.tsx'],
              'pages-import': ['./pages/ImportGoods.tsx'],
              'pages-settings': ['./pages/Settings.tsx', './components/MobileSettings.tsx'],
              'pages-reports': ['./pages/Reports.tsx'],
              'pages-tax': ['./pages/TaxCalculation.tsx'],
              'pages-landing': ['./pages/LandingPage.tsx'],
              'pages-disposal': ['./pages/Disposals.tsx', './pages/DisposalForm.tsx'],
              'pages-return': ['./pages/ReturnOrders.tsx'],
              'pages-catalog': ['./pages/BrandManagement.tsx', './pages/CategoryManagement.tsx'],
              'pages-profile': ['./pages/Profile.tsx'],
              'mobile-pages': ['./components/MobilePOS.tsx', './components/MobileOrders.tsx', './components/MobileCustomers.tsx', './components/MobileInventory.tsx'],
            }
          }
        }
      }
    };
});
