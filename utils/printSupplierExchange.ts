import { SupplierExchange, AppSettings } from '../types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

export const printSupplierExchange = (exchange: SupplierExchange, settings?: AppSettings) => {
  const s = settings || ({} as AppSettings);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để in phiếu đổi trả hàng NCC!');
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

  const width = printSize === '80mm' ? '72mm' : printSize === '58mm' ? '48mm' : '100%';
  const bodyWidth = printSize === 'A4' ? '210mm' : '100%';

  const returnRows = exchange.returnItems
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px dashed #ddd;">
          <div style="font-weight:600;font-size:0.95em;">${item.productName}</div>
          <div style="font-size:0.85em;color:#666;">Lô: ${item.lotCode || '—'} | HSD: ${formatDate(item.expiryDate)}</div>
        </td>
        <td style="padding:6px 0;border-bottom:1px dashed #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #ddd;text-align:right;">${formatCurrency(item.cost)}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #ddd;text-align:right;font-weight:600;">${formatCurrency(item.totalValue)}</td>
      </tr>
    `
    )
    .join('');

  const receivedRows = exchange.receivedItems
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px dashed #ddd;">
          <div style="font-weight:600;font-size:0.95em;">${item.productName}</div>
          <div style="font-size:0.85em;color:#666;">Lô: ${item.lotCode || '—'} | HSD: ${formatDate(item.expiryDate)}</div>
        </td>
        <td style="padding:6px 0;border-bottom:1px dashed #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #ddd;text-align:right;">${formatCurrency(item.cost)}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #ddd;text-align:right;font-weight:600;">${formatCurrency(item.totalValue)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>In phiếu đổi trả hàng NCC - ${exchange.code}</title>
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
          font-size: ${fontSize}px; line-height: 1.4;
          margin: 0 auto; padding: 3mm;
          width: ${bodyWidth}; max-width: ${width}; overflow-x: hidden;
          color: #1f2937;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .store-name { font-size: 1.25em; font-weight: bold; color: #4f46e5; word-wrap: break-word; }
        .address { font-size: 0.9em; color: #4b5563; word-wrap: break-word; }
        .title {
          font-size: 1.3em; font-weight: bold; margin: 8px 0;
          color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .dashed-line { border-top: 1px dashed #9ca3af; margin: 8px 0; }
        .info-row { display: flex; justify-content: space-between; flex-wrap: wrap; margin-bottom: 4px; }
        .info-label { color: #6b7280; }
        .section-title {
          font-weight: 700; font-size: 1em; margin: 12px 0 6px;
          display: flex; align-items: center; gap: 6px;
          color: #374151;
        }
        .section-title.old { color: #b91c1c; }
        .section-title.new { color: #15803d; }
        .badge {
          display: inline-block; padding: 2px 8px; border-radius: 999px;
          font-size: 0.75em; font-weight: 600;
        }
        .badge-old { background: #fee2e2; color: #991b1b; }
        .badge-new { background: #dcfce7; color: #166534; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 4px; }
        th { text-align: left; font-size: 0.8em; color: #6b7280; padding: 4px 0; border-bottom: 2px solid #d1d5db; }
        td { vertical-align: top; }
        .totals {
          margin-top: 10px; border-top: 2px solid #374151; padding-top: 10px;
        }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .total-row .value { font-weight: 700; }
        .debt-positive { color: #dc2626; }
        .debt-negative { color: #16a34a; }
        .signatures {
          display: flex; justify-content: space-between; margin-top: 28px;
          text-align: center; font-size: 0.9em;
        }
        .signature-box { flex: 1; }
        .signature-label { font-weight: 600; margin-bottom: 6px; }
        .signature-note { font-size: 0.8em; color: #6b7280; font-style: italic; }
        .footer { margin-top: 14px; text-align: center; font-size: 0.85em; color: #4b5563; }
        .note-box { margin-top: 8px; padding: 6px; background: #f9fafb; border-radius: 4px; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <button class="close-btn no-print" onclick="window.close()" aria-label="Đóng">&times;</button>

      ${logo ? `<div class="text-center" style="margin-bottom:6px;"><img src="${logo}" alt="Logo" style="max-width:55%;max-height:70px;object-fit:contain;"/></div>` : ''}

      <div class="text-center">
        <div class="store-name uppercase">${storeName}</div>
        <div class="address">${storeAddress}</div>
        ${taxCode ? `<div class="address">MST: ${taxCode}</div>` : ''}
      </div>

      <div class="title text-center">Phiếu đổi trả hàng NCC</div>
      <div class="text-center font-bold" style="font-size:1.05em;">Mã phiếu: ${exchange.code}</div>
      <div class="text-center" style="font-size:0.9em;color:#6b7280;">Ngày ${formatDate(exchange.date)}</div>

      <div class="dashed-line"></div>

      <div class="info-row">
        <span class="info-label">Nhà cung cấp:</span>
        <span class="font-bold">${exchange.supplierName || '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phiếu nhập gốc:</span>
        <span>${exchange.referenceReceiptId || '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Lý do:</span>
        <span>${exchange.reason || '—'}</span>
      </div>

      <div class="dashed-line"></div>

      <!-- Hàng trả -->
      <div class="section-title old">
        <span class="badge badge-old">TRẢ</span>
        Hàng trả (lô cũ)
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:40%;">Sản phẩm / Lô</th>
            <th style="width:15%;text-align:center;">SL</th>
            <th style="width:22%;text-align:right;">Giá vốn</th>
            <th style="width:23%;text-align:right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${returnRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:10px 0;">Không có hàng trả</td></tr>'}
        </tbody>
      </table>

      <!-- Hàng nhận -->
      <div class="section-title new">
        <span class="badge badge-new">NHẬN</span>
        Hàng nhận đổi (lô mới)
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:40%;">Sản phẩm / Lô</th>
            <th style="width:15%;text-align:center;">SL</th>
            <th style="width:22%;text-align:right;">Giá vốn</th>
            <th style="width:23%;text-align:right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${receivedRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:10px 0;">Không có hàng nhận</td></tr>'}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Tổng giá trị trả</span>
          <span class="value">${formatCurrency(exchange.returnTotalValue)}</span>
        </div>
        <div class="total-row">
          <span>Tổng giá trị nhận</span>
          <span class="value">${formatCurrency(exchange.receivedTotalValue)}</span>
        </div>
        <div class="total-row">
          <span class="font-bold">Chênh lệch công nợ</span>
          <span class="value ${exchange.debtAdjustment >= 0 ? 'debt-positive' : 'debt-negative'}">
            ${exchange.debtAdjustment >= 0 ? '+' : ''}${formatCurrency(exchange.debtAdjustment)}
          </span>
        </div>
        <div style="font-size:0.8em;color:#6b7280;text-align:right;margin-top:4px;">
          ${exchange.debtAdjustment >= 0 ? 'Cửa hàng nợ NCC thêm' : 'NCC hoàn/cấn trừ cho cửa hàng'}
        </div>
      </div>

      ${exchange.note ? `<div class="note-box"><span class="font-bold">Ghi chú:</span> ${exchange.note}</div>` : ''}

      <div class="signatures">
        <div class="signature-box">
          <div class="signature-label">Nhà cung cấp</div>
          <div class="signature-note">(Ký, ghi rõ họ tên)</div>
        </div>
        <div class="signature-box">
          <div class="signature-label">Cửa hàng</div>
          <div class="signature-note">(Ký, ghi rõ họ tên)</div>
        </div>
      </div>

      <div class="footer">
        ${storePhone ? `<div>☎ ${storePhone}</div>` : ''}
        <div style="margin-top:4px;font-style:italic;">Phiếu được lập trên hệ thống VietSales Pro</div>
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
