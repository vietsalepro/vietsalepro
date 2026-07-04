import { Order, AppSettings, Customer } from '../types';

/**
 * Phát hiện thiết bị iOS
 */
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Format tiền tệ
 */
const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN');

/**
 * Căn giữa text
 */
const center = (text: string, width: number) => {
  const len = text.length;
  if (len >= width) return text;
  const left = Math.floor((width - len) / 2);
  return ' '.repeat(left) + text;
};

/**
 * Căn trái - phải
 */
const leftRight = (left: string, right: string, width: number) => {
  const combinedLen = left.length + right.length;
  if (combinedLen >= width) {
     return left + '\n' + right.padStart(width); 
  }
  return left + ' '.repeat(width - combinedLen) + right;
};

/**
 * Tạo text in cho máy in nhiệt
 */
const buildRawPrintText = (order: Order, settings: AppSettings, customer?: Customer) => {
    const width = settings.printSize === '58mm' ? 32 : 48;
    const line = '-'.repeat(width);
    
    let text = '';
    
    // Header
    text += center((settings.storeName || 'Cửa hàng').toUpperCase(), width) + '\n';
    text += center('Địa chỉ: ' + (settings.storeAddress || ''), width) + '\n';
    if (settings.taxCode) text += center('MST: ' + settings.taxCode, width) + '\n';
    
    text += '\n';
    text += center((settings.invoiceTitle || 'HÓA ĐƠN THANH TOÁN').toUpperCase(), width) + '\n';
    text += line + '\n';

    
    // Invoice info
    text += center('Số HĐ: ' + order.id, width) + '\n';
    text += center('Ngày ' + new Date(order.date).toLocaleDateString('vi-VN'), width) + '\n';
    
    text += '\n';
    text += `Khách hàng: ${order.customerName}\n`;
    if (customer?.phone) text += `SĐT: ${customer.phone}\n`;
    
    // Loyalty points
    text += leftRight(`Tổng điểm: ${customer?.loyaltyPoints || 0}`, `Điểm lần này: ${order.pointsEarned}`, width) + '\n';
    
    text += line + '\n';
    
    // Items
    order.items.forEach(item => {
        text += `✿ ${item.productName}\n`;
        
        const unit = item.unitName;
        const qty = item.quantity;
        const price = formatCurrency(item.price);
        const total = formatCurrency(item.quantity * item.price);
        
        const details = `${unit}   ${qty}   ${price}`;
        text += leftRight(details, total, width) + '\n';
        text += '- '.repeat(Math.floor(width/2)) + '\n'; 
    });
    
    text += line + '\n';
    
    // Totals
    text += leftRight('Tổng tiền hàng:', formatCurrency(order.totalAmount), width) + '\n';
    text += leftRight('Giảm giá:', '0', width) + '\n';
    text += leftRight('TỔNG THANH TOÁN:', formatCurrency(order.totalAmount), width) + '\n';
    
    text += '\n';
    
    // Footer - Chính sách tích điểm / đổi trả (tuỳ biến)
    if (settings.loyaltyPolicy && settings.loyaltyPolicy.trim()) {
        settings.loyaltyPolicy.split('\n').forEach(l => { text += l + '\n'; });
    }

    // Thông tin chuyển khoản
    if (settings.bankInfo) {
        text += '\n';
        text += center('THÔNG TIN CHUYỂN KHOẢN', width) + '\n';
        text += settings.bankInfo + '\n';
    }

    // Thông tin khuyến mãi (tuỳ biến)
    if (settings.promoInfo && settings.promoInfo.trim()) {
        text += '\n';
        settings.promoInfo.split('\n').forEach(l => { text += center(l, width) + '\n'; });
    }

    text += '\n';
    if (settings.storePhone) text += center('☎ : ' + settings.storePhone, width) + '\n';
    text += center(settings.thankYouMessage || 'Cảm ơn và hẹn gặp lại!', width) + '\n';
    text += '\n\n\n';

    
    return text;
};

/**
 * Mở BR RawPrinter bằng cách tạo một form POST ẩn
 * Cách này tránh được lỗi "địa chỉ không hợp lệ" của Safari
 */
const openRawPrinterWithForm = (text: string, paperSize: string) => {
  return new Promise<boolean>((resolve) => {
    try {
      // Tạo một form ẩn
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'rawprinter://print';
      form.style.display = 'none';
      form.setAttribute('target', '_blank'); // Mở trong tab mới để tránh lỗi
      
      // Tạo input chứa dữ liệu
      const textInput = document.createElement('input');
      textInput.type = 'hidden';
      textInput.name = 'text';
      textInput.value = text;
      
      const paperSizeInput = document.createElement('input');
      paperSizeInput.type = 'hidden';
      paperSizeInput.name = 'paperSize';
      paperSizeInput.value = paperSize;
      
      const encodingInput = document.createElement('input');
      encodingInput.type = 'hidden';
      encodingInput.name = 'encoding';
      encodingInput.value = 'utf8';
      
      form.appendChild(textInput);
      form.appendChild(paperSizeInput);
      form.appendChild(encodingInput);
      document.body.appendChild(form);
      
      let appOpened = false;
      
      // Lắng nghe sự kiện
      const onVisibilityChange = () => {
        if (document.hidden) {
          appOpened = true;
          cleanup();
          resolve(true);
        }
      };
      
      const onBlur = () => {
        appOpened = true;
        cleanup();
        resolve(true);
      };
      
      const cleanup = () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', onBlur);
        setTimeout(() => {
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
        }, 1000);
      };
      
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('blur', onBlur);
      
      // Submit form sau 100ms
      setTimeout(() => {
        form.submit();
      }, 100);
      
      // Timeout sau 3 giây
      setTimeout(() => {
        if (!appOpened) {
          cleanup();
          resolve(false);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Lỗi khi mở BR RawPrinter:', error);
      resolve(false);
    }
  });
};

/**
 * Phương thức dự phòng: sử dụng iframe với sandbox
 */
const openRawPrinterWithIframe = (url: string) => {
  return new Promise<boolean>((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.sandbox.add('allow-same-origin'); // Cho phép mở URL scheme
      
      let appOpened = false;
      
      const onVisibilityChange = () => {
        if (document.hidden) {
          appOpened = true;
          cleanup();
          resolve(true);
        }
      };
      
      const onBlur = () => {
        appOpened = true;
        cleanup();
        resolve(true);
      };
      
      const cleanup = () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', onBlur);
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      };
      
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('blur', onBlur);
      
      iframe.onload = () => {
        // Thử set src sau khi iframe load
        iframe.src = url;
      };
      
      iframe.src = url;
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        if (!appOpened) {
          cleanup();
          resolve(false);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Lỗi iframe:', error);
      resolve(false);
    }
  });
};

/**
 * Hiển thị dialog hướng dẫn chi tiết
 */
const showPrintInstructions = () => {
  const oldModal = document.getElementById('print-instructions-modal');
  if (oldModal) {
    oldModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'print-instructions-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  const box = document.createElement('div');
  box.style.cssText = `
    background: white;
    border-radius: 20px;
    padding: 24px;
    max-width: 340px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;
  `;
  
  // Thêm animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  const title = document.createElement('h3');
  title.innerHTML = '🖨️ <span style="color: #2563eb;">Hướng dẫn in hóa đơn trên iPhone</span>';
  title.style.cssText = `
    margin: 0 0 16px 0;
    font-size: 20px;
    color: #1a1a1a;
    font-weight: 600;
    line-height: 1.3;
  `;
  
  const steps = [
    {
      icon: '📲',
      title: 'Bước 1: Mở app BR RawPrinter',
      desc: 'Mở ứng dụng BR RawPrinter đã cài đặt từ App Store'
    },
    {
      icon: '⚙️',
      title: 'Bước 2: Cấu hình máy in',
      desc: 'Vào Settings, nhập đúng địa chỉ IP của máy in (ví dụ: 192.168.1.100)'
    },
    {
      icon: '✅',
      title: 'Bước 3: Kiểm tra kết nối',
      desc: 'Nhấn "Test Print" để đảm bảo máy in hoạt động'
    },
    {
      icon: '🔄',
      title: 'Bước 4: Quay lại và in',
      desc: 'Sau khi cấu hình xong, quay lại app và nhấn "In hoá đơn" lại'
    }
  ];
  
  const stepsHtml = steps.map(step => `
    <div style="margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #3b82f6;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 20px;">${step.icon}</span>
        <span style="font-weight: 600; color: #1e293b;">${step.title}</span>
      </div>
      <p style="margin: 4px 0 0 28px; color: #475569; font-size: 14px;">${step.desc}</p>
    </div>
  `).join('');
  
  const content = document.createElement('div');
  content.innerHTML = stepsHtml;
  
  const note = document.createElement('div');
  note.style.cssText = `
    margin: 16px 0;
    padding: 12px;
    background: #fffbeb;
    border-radius: 12px;
    border-left: 4px solid #f59e0b;
    font-size: 14px;
    color: #92400e;
  `;
  note.innerHTML = `
    <span style="font-weight: 600;">📌 Lưu ý:</span><br>
    • Đảm bảo iPhone và máy in cùng một mạng WiFi<br>
    • IP máy in có thể xem trong phần cài đặt mạng của máy in
  `;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 12px;
    margin-top: 20px;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '🔙 Đóng';
  closeBtn.style.cssText = `
    flex: 1;
    padding: 14px;
    background: #f1f5f9;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
    transition: all 0.2s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = '#e2e8f0';
  closeBtn.onmouseout = () => closeBtn.style.background = '#f1f5f9';
  closeBtn.onclick = () => modal.remove();
  
  const appStoreBtn = document.createElement('button');
  appStoreBtn.innerHTML = '📲 Mở App Store';
  appStoreBtn.style.cssText = `
    flex: 1;
    padding: 14px;
    background: #3b82f6;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  `;
  appStoreBtn.onmouseover = () => appStoreBtn.style.background = '#2563eb';
  appStoreBtn.onmouseout = () => appStoreBtn.style.background = '#3b82f6';
  appStoreBtn.onclick = () => {
    window.open('https://apps.apple.com/vn/app/br-rawprinter/id6751583298?l=vi', '_blank');
  };
  
  buttonContainer.appendChild(closeBtn);
  buttonContainer.appendChild(appStoreBtn);
  
  box.appendChild(title);
  box.appendChild(content);
  box.appendChild(note);
  box.appendChild(buttonContainer);
  modal.appendChild(box);
  document.body.appendChild(modal);
};

export const printOrder = async (order: Order, settings: AppSettings, customer?: Customer) => {
  // iOS Printing via BR RawPrinter
  if (isIOS()) {
    // Hiển thị loading
    const loading = document.createElement('div');
    loading.id = 'print-loading';
    loading.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      backdrop-filter: blur(5px);
    `;
    
    const spinner = document.createElement('div');
    spinner.innerHTML = `
      <div style="text-align: center;">
        <div style="
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3b82f6;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        "></div>
        <div style="color: #1e293b; font-weight: 500; margin-bottom: 8px;">Đang kết nối máy in...</div>
        <div style="color: #64748b; font-size: 14px;">Vui lòng đợi trong giây lát</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    loading.appendChild(spinner);
    document.body.appendChild(loading);
    
    try {
      const text = buildRawPrintText(order, settings, customer);
      const paperSize = settings.printSize === '58mm' ? '58mm' : '80mm';
      
      // Thử mở bằng form trước
      let opened = await openRawPrinterWithForm(text, paperSize);
      
      // Nếu không được, thử bằng iframe
      if (!opened) {
        const url = `rawprinter://print?text=${encodeURIComponent(text)}&paperSize=${paperSize}&encoding=utf8`;
        opened = await openRawPrinterWithIframe(url);
      }
      
      // Xóa loading
      loading.remove();
      
      // Nếu vẫn không mở được, hiển thị hướng dẫn
      if (!opened) {
        setTimeout(() => {
          showPrintInstructions();
        }, 500);
      }
      
    } catch (error) {
      loading.remove();
      showPrintInstructions();
    }
    
    return;
  }

  // Desktop/Android Printing via Browser
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để in hoá đơn!');
    return;
  }

  const {
    storeName = 'Cửa hàng',
    storeAddress = '',
    storePhone = '',
    taxCode = '',
    bankInfo = '',
    printSize = '80mm',
    fontSize = 11,
    fontFamily = 'Arial',
    logo = '',
    invoiceTitle = 'HÓA ĐƠN THANH TOÁN',
    loyaltyPolicy = '',
    promoInfo = '',
    thankYouMessage = 'Cảm ơn và hẹn gặp lại!'
  } = settings;

  // Chuyển ký tự xuống dòng thành <br/> để hiển thị an toàn trên HTML
  const nl2br = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');


  const width = printSize === '80mm' ? '72mm' : printSize === '58mm' ? '48mm' : '100%';
  const bodyWidth = printSize === 'A4' ? '210mm' : '100%';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>In hoá đơn - ${order.id}</title>
      <style>
        @page {
          margin: 0;
          size: auto;
        }
        @media print {
          .no-print { display: none !important; }
        }
        .close-btn {
          position: fixed;
          top: 15px;
          right: 15px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 24px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9999;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: background-color 0.2s;
        }
        .close-btn:hover {
          background-color: #dc2626;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: "${fontFamily}", sans-serif;
          font-size: ${fontSize}px;
          line-height: 1.3;
          margin: 0 auto;
          padding: 2mm;
          width: ${bodyWidth};
          max-width: ${width};
          overflow-x: hidden;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .italic { font-style: italic; }
        
        .header { margin-bottom: 5px; }
        .store-name { font-size: 1.2em; font-weight: bold; color: #0056b3; word-wrap: break-word; }
        .address { font-size: 0.9em; font-style: italic; word-wrap: break-word; }
        
        .title { 
          font-size: 1.3em; 
          font-weight: bold; 
          margin: 5px 0; 
          color: #0056b3;
          text-transform: uppercase;
        }
        
        .dashed-line { 
          border-top: 1px dashed #000; 
          margin: 5px 0; 
        }
        
        .info-row { display: flex; justify-content: space-between; flex-wrap: wrap; }
        
        .table { width: 100%; border-collapse: collapse; margin-top: 5px; table-layout: fixed; }
        .table th { border-bottom: 2px solid #000; text-align: left; padding: 2px 0; white-space: nowrap; }
        .table td { padding: 2px 0; vertical-align: top; }
        
        .item-name { font-weight: bold; display: block; word-wrap: break-word; }
        .item-details { display: flex; justify-content: space-between; font-size: 0.9em; }
        .item-details span { white-space: nowrap; }
        
        .totals { margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .final-total { font-size: 1.2em; font-weight: bold; }
        
        .loyalty-info { 
          margin-top: 10px; 
          font-style: italic; 
          font-size: 0.9em; 
          text-align: justify;
          word-wrap: break-word;
        }
        
        .footer { margin-top: 10px; text-align: center; font-weight: bold; }
        .bank-info { margin-top: 5px; white-space: pre-line; font-style: italic; word-wrap: break-word; }
        
        .contact { margin-top: 5px; }
        .thank-you { margin-top: 5px; font-style: italic; }
      </style>
    </head>
    <body>
      <button class="close-btn no-print" onclick="window.close()" aria-label="Đóng">&times;</button>
      ${logo ? `<div class="text-center" style="margin-bottom:5px;"><img src="${logo}" alt="Logo" style="max-width:60%;max-height:80px;object-fit:contain;"/></div>` : ''}
      <div class="header text-center">
        <div class="store-name uppercase">${storeName}</div>
        <div class="address">Địa chỉ: ${storeAddress}</div>
        ${taxCode ? `<div class="address">MST: ${taxCode}</div>` : ''}
      </div>
      
      <div class="title text-center">${nl2br(invoiceTitle)}</div>

      <div class="dashed-line"></div>
      
      <div class="text-center font-bold">Số HĐ: ${order.id}</div>
      <div class="text-center">Ngày ${new Date(order.date).toLocaleDateString('vi-VN')}</div>
      
      <div class="info-row" style="margin-top: 10px;">
        <div>Khách hàng: <span class="font-bold">${order.customerName}</span></div>
        <div>SĐT: ${customer?.phone || ''}</div>
      </div>
      
      <div class="info-row">
         <div>Tổng điểm: <span class="font-bold">${customer?.loyaltyPoints || 0}</span></div>
         <div>Điểm lần này: <span class="font-bold">${order.pointsEarned}</span></div>
      </div>

      <div class="dashed-line"></div>
      
      <table class="table">
        <thead>
          <tr>
            <th style="width: 50%">Tên hàng</th>
            <th style="width: 20%" class="text-center">SL</th>
            <th style="width: 30%" class="text-right">Đơn giá</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td colspan="3">
                <div class="item-name">✿ ${item.productName}</div>
                <div class="item-details">
                  <span>${item.unitName}</span>
                  <span>${item.quantity}</span>
                  <span>${item.price.toLocaleString('vi-VN')}</span>
                  <span class="font-bold">${(item.quantity * item.price).toLocaleString('vi-VN')}</span>
                </div>
                <div class="dashed-line" style="border-top-style: dotted; opacity: 0.5;"></div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span class="font-bold">Tổng tiền hàng:</span>
          <span class="font-bold">${order.totalAmount.toLocaleString('vi-VN')}</span>
        </div>
        <div class="total-row">
          <span>Giảm giá:</span>
          <span>0</span>
        </div>
        <div class="total-row" style="margin-top: 5px;">
          <span class="font-bold" style="font-size: 1.1em;">Tổng thanh toán:</span>
          <span class="final-total">${order.totalAmount.toLocaleString('vi-VN')}</span>
        </div>
      </div>
      
      ${loyaltyPolicy && loyaltyPolicy.trim() ? `<div class="loyalty-info">${nl2br(loyaltyPolicy)}</div>` : ''}

      ${promoInfo && promoInfo.trim() ? `<div class="loyalty-info text-center font-bold" style="font-style: normal;">${nl2br(promoInfo)}</div>` : ''}

      <div class="footer">
        ${bankInfo ? `<div class="uppercase" style="margin-bottom: 5px;">THÔNG TIN CHUYỂN KHOẢN</div>
        <div class="bank-info">${nl2br(bankInfo)}</div>` : ''}

        ${storePhone ? `<div class="contact">
          <div>☎ : ${storePhone}</div>
        </div>` : ''}
        <div class="thank-you">${nl2br(thankYouMessage)}</div>
      </div>

      
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};