import { ReturnOrder, AppSettings, Customer } from '../types';

/**
 * Phát hiện thiết bị iOS
 */
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Format tiền tệ (VND)
 */
const formatCurrency = (amount: number) => (amount || 0).toLocaleString('vi-VN');

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
 * Tạo text in cho máy in nhiệt (iOS RawPrinter)
 */
const buildRawPrintText = (ret: ReturnOrder, settings: any, customer?: Customer) => {
  const width = settings.printSize === '58mm' ? 32 : 48;
  const line = '-'.repeat(width);

  let text = '';

  // Header
  text += center((settings.storeName || 'Cửa hàng').toUpperCase(), width) + '\n';
  text += center('Địa chỉ: ' + (settings.storeAddress || ''), width) + '\n';
  if (settings.taxCode) text += center('MST: ' + settings.taxCode, width) + '\n';

  text += '\n';
  text += center('PHIẾU TRẢ HÀNG / HOÀN TIỀN', width) + '\n';
  text += line + '\n';

  // Phiếu info
  text += center('Số phiếu: ' + ret.id, width) + '\n';
  if (ret.originalOrderId) text += center('Đơn gốc: ' + ret.originalOrderId, width) + '\n';
  text += center('Ngày ' + new Date(ret.createdAt || ret.date || Date.now()).toLocaleDateString('vi-VN'), width) + '\n';

  text += '\n';
  text += `Khách hàng: ${ret.customerName || 'Khách lẻ'}\n`;
  if (customer?.phone) text += `SĐT: ${customer.phone}\n`;

  text += line + '\n';

  // Items
  (ret.items || []).forEach(item => {
    text += `✿ ${item.productName}\n`;
    const unit = item.unitName || '';
    const qty = item.quantity;
    const price = formatCurrency(item.unitPrice);
    const total = formatCurrency(item.unitPrice * item.quantity);
    const details = `${unit}   ${qty}   ${price}`;
    text += leftRight(details, total, width) + '\n';
    text += '- '.repeat(Math.floor(width / 2)) + '\n';
  });

  text += line + '\n';

  // Totals
  text += leftRight('Tổng tiền hoàn:', formatCurrency(ret.totalRefundAmount || 0), width) + '\n';
  text += leftRight('Giảm trừ công nợ:', formatCurrency(ret.debtReduction || 0), width) + '\n';
  text += leftRight('Tiền mặt hoàn:', formatCurrency(ret.cashRefund || 0), width) + '\n';

  text += '\n';
  if (ret.reason) {
    text += `Lý do: ${ret.reason}\n`;
  }
  text += '\n';

  // Chữ ký
  text += leftRight('Khách hàng', 'Nhân viên', width) + '\n';
  text += leftRight('(Ký, ghi rõ họ tên)', '(Ký, ghi rõ họ tên)', width) + '\n';

  text += '\n';
  if (settings.storePhone) text += center('☎ : ' + settings.storePhone, width) + '\n';
  text += center('Cảm ơn quý khách!', width) + '\n';
  text += '\n\n\n';

  return text;
};

/**
 * Mở BR RawPrinter bằng form POST ẩn
 */
const openRawPrinterWithForm = (text: string, paperSize: string) => {
  return new Promise<boolean>((resolve) => {
    try {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'rawprinter://print';
      form.style.display = 'none';
      form.setAttribute('target', '_blank');

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

      setTimeout(() => {
        form.submit();
      }, 100);

      setTimeout(() => {
        if (!appOpened) {
          cleanup();
          resolve(false);
        }
      }, 3000);
    } catch (error) {

      resolve(false);
    }
  });
};

export const printReturnOrder = async (ret: ReturnOrder, settings: AppSettings, customer?: Customer) => {
  const s = settings as any;

  // iOS Printing via BR RawPrinter
  if (isIOS()) {
    try {
      const text = buildRawPrintText(ret, s, customer);
      const paperSize = s.printSize === '58mm' ? '58mm' : '80mm';
      const opened = await openRawPrinterWithForm(text, paperSize);
      if (!opened) {
        alert('Không mở được ứng dụng in. Vui lòng kiểm tra BR RawPrinter.');
      }
    } catch (error) {

    }
    return;
  }

  // Desktop/Android Printing via Browser
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để in phiếu trả hàng!');
    return;
  }

  const {
    storeName = 'Cửa hàng',
    storeAddress = '',
    storePhone = '',
    taxCode = '',
    printSize = '80mm',
    fontSize = 11,
    fontFamily = 'Arial',
    logo = '',
  } = s;

  const nl2br = (str: string) =>
    String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/\n/g, '<br/>');

  const width = printSize === '80mm' ? '72mm' : printSize === '58mm' ? '48mm' : '100%';
  const bodyWidth = printSize === 'A4' ? '210mm' : '100%';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>In phiếu trả hàng - ${ret.id}</title>
      <style>
        @page { margin: 0; size: auto; }
        @media print { .no-print { display: none !important; } }
        .close-btn {
          position: fixed; top: 15px; right: 15px;
          background: #ef4444; color: white; border: none; border-radius: 50%;
          width: 40px; height: 40px; font-size: 24px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 9999;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .close-btn:hover { background-color: #dc2626; }
        * { box-sizing: border-box; }
        body {
          font-family: "${fontFamily}", sans-serif;
          font-size: ${fontSize}px; line-height: 1.3;
          margin: 0 auto; padding: 2mm;
          width: ${bodyWidth}; max-width: ${width}; overflow-x: hidden;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .italic { font-style: italic; }
        .store-name { font-size: 1.2em; font-weight: bold; color: #6C4DFF; word-wrap: break-word; }
        .address { font-size: 0.9em; font-style: italic; word-wrap: break-word; }
        .title { font-size: 1.3em; font-weight: bold; margin: 5px 0; color: #6C4DFF; text-transform: uppercase; }
        .dashed-line { border-top: 1px dashed #000; margin: 5px 0; }
        .info-row { display: flex; justify-content: space-between; flex-wrap: wrap; }
        .item-name { font-weight: bold; display: block; word-wrap: break-word; }
        .item-details { display: flex; justify-content: space-between; font-size: 0.9em; }
        .totals { margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .final-total { font-size: 1.2em; font-weight: bold; color: #ef4444; }
        .reason-box { margin-top: 8px; font-size: 0.9em; }
        .sign-row { display: flex; justify-content: space-between; margin-top: 20px; text-align: center; }
        .sign-col { flex: 1; }
        .footer { margin-top: 10px; text-align: center; }
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

      <div class="title text-center">PHIẾU TRẢ HÀNG / HOÀN TIỀN</div>
      <div class="dashed-line"></div>

      <div class="text-center font-bold">Số phiếu: ${ret.id}</div>
      ${ret.originalOrderId ? `<div class="text-center">Đơn gốc: ${ret.originalOrderId}</div>` : ''}
      <div class="text-center">Ngày ${new Date(ret.createdAt || ret.date || Date.now()).toLocaleDateString('vi-VN')}</div>

      <div class="info-row" style="margin-top: 10px;">
        <div>Khách hàng: <span class="font-bold">${ret.customerName || 'Khách lẻ'}</span></div>
        <div>SĐT: ${customer?.phone || ''}</div>
      </div>

      <div class="dashed-line"></div>

      <table style="width:100%; border-collapse:collapse; margin-top:5px; table-layout:fixed;">
        <thead>
          <tr>
            <th style="width: 50%; text-align:left; border-bottom:2px solid #000; padding:2px 0;">Tên hàng</th>
            <th style="width: 20%; text-align:center; border-bottom:2px solid #000; padding:2px 0;">SL</th>
            <th style="width: 30%; text-align:right; border-bottom:2px solid #000; padding:2px 0;">Đơn giá</th>
          </tr>
        </thead>
        <tbody>
          ${(ret.items || []).map(item => `
            <tr>
              <td colspan="3" style="padding:2px 0;">
                <div class="item-name">✿ ${item.productName}</div>
                <div class="item-details">
                  <span>${item.unitName || ''}</span>
                  <span>${item.quantity}</span>
                  <span>${(item.unitPrice).toLocaleString('vi-VN')}</span>
                  <span class="font-bold">${(item.unitPrice * item.quantity).toLocaleString('vi-VN')}</span>
                </div>
                <div class="dashed-line" style="border-top-style: dotted; opacity: 0.5;"></div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span class="font-bold">Tổng tiền hoàn:</span>
          <span class="final-total">${(ret.totalRefundAmount || 0).toLocaleString('vi-VN')}</span>
        </div>
        <div class="total-row">
          <span>Giảm trừ công nợ:</span>
          <span>${(ret.debtReduction || 0).toLocaleString('vi-VN')}</span>
        </div>
        <div class="total-row">
          <span>Tiền mặt hoàn lại:</span>
          <span class="font-bold">${(ret.cashRefund || 0).toLocaleString('vi-VN')}</span>
        </div>
      </div>

      ${ret.reason ? `<div class="reason-box"><span class="font-bold">Lý do trả:</span> ${nl2br(ret.reason)}</div>` : ''}
      ${ret.note ? `<div class="reason-box"><span class="font-bold">Ghi chú:</span> ${nl2br(ret.note)}</div>` : ''}

      <div class="sign-row">
        <div class="sign-col">
          <div class="font-bold">Khách hàng</div>
          <div class="italic" style="font-size:0.85em;">(Ký, ghi rõ họ tên)</div>
        </div>
        <div class="sign-col">
          <div class="font-bold">Nhân viên</div>
          <div class="italic" style="font-size:0.85em;">(Ký, ghi rõ họ tên)</div>
        </div>
      </div>

      <div class="footer">
        ${storePhone ? `<div>☎ : ${storePhone}</div>` : ''}
        <div class="italic">Cảm ơn quý khách!</div>
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
