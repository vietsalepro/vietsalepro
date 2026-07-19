const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageNumber, PageBreak } = require('docx');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const margins = { top: 80, bottom: 80, left: 120, right: 120 };

const headerShading = { fill: "1E3A5F", type: ShadingType.CLEAR };
const altRowShading = { fill: "F5F7FA", type: ShadingType.CLEAR };
const sectionShading = { fill: "E8F0FE", type: ShadingType.CLEAR };

const WIDTH = 11386; // A4 content width (11906 - 520 margin*2)
const COL_INDEX = 700;
const COL_NAME = 1800;
const COL_FEATURE = 2800;
const COL_DESC = 6086;

const features = [
  // Đăng nhập
  {
    screen: "1. Đăng nhập",
    items: [
      { idx: 1, name: "Login", feature: "Xác thực người dùng", desc: "AuthProvider + Supabase authentication" },
      { idx: 2, name: "Loading spinner", feature: "Màn hình chờ", desc: "Spinner + 'Đang tải dữ liệu...' khi fetch dữ liệu" },
    ]
  },
  // Sidebar / Header
  {
    screen: "2. Sidebar (Header) - Navigation",
    items: [
      { idx: 3, name: "Logo + tên app", feature: "Branding", desc: "VietSales Pro gradient, link về Dashboard, hover animation" },
      { idx: 4, name: "Menu điều hướng desktop", feature: "Nav pills", desc: "8 item: Tổng quan, Hàng hoá, Khách hàng, Nhà cung cấp, Nhập hàng, Đơn hàng, Tính thuế, Báo cáo" },
      { idx: 5, name: "Active indicator", feature: "Highlight", desc: "Chấm tròn + màu nền active cho nav item" },
      { idx: 6, name: "User dropdown", feature: "Thông tin user", desc: "Avatar, email; dropdown: Hồ sơ, Cài đặt, Đăng xuất" },
      { idx: 7, name: "Nút Bán hàng", feature: "POS shortcut", desc: "Gradient emerald→teal, shimmer hiệu ứng, ping animation, active state" },
      { idx: 8, name: "Slide-down menu mobile", feature: "Mobile nav", desc: "Hamburger → glassmorphism menu trượt xuống, nav items + user section" },
      { idx: 9, name: "Bottom Navigation", feature: "Mobile bottom nav", desc: "5 tab chính di động" },
      { idx: 10, name: "Drawer phải", feature: "Mobile drawer", desc: "Menu trượt phải với backdrop blur, các link phụ" },
    ]
  },
  // Dashboard
  {
    screen: "3. Dashboard - Tổng quan",
    items: [
      { idx: 11, name: "Stat cards (3 cột)", feature: "Thống kê nhanh", desc: "Tổng doanh thu, Lợi nhuận, Số đơn hàng (StatCard với trend/subtitle)" },
      { idx: 12, name: "Bộ lọc ngày", feature: "Lọc thời gian", desc: "3 nút pill: 7 ngày, 30 ngày, Tất cả" },
      { idx: 13, name: "Segmented tabs (3 tab)", feature: "Chuyển tab", desc: "Doanh thu / Hàng hoá / Khách hàng — segment control gradient" },
      { idx: 14, name: "Biểu đồ doanh thu", feature: "BarChart", desc: "Recharts: doanh thu (indigo) + lợi nhuận (emerald), 2 cột song song" },
      { idx: 15, name: "Top 10 bán chạy", feature: "Bảng xếp hạng", desc: "Xếp hạng 1-10 với huy hiệu vàng/bạc/đồng, tên, số lượng, doanh thu" },
      { idx: 16, name: "Thẻ giá trị kho", feature: "Kho", desc: "Gradient indigo→purple, giá vốn + giá bán lẻ dự kiến" },
      { idx: 17, name: "Biểu đồ tròn danh mục", feature: "PieChart", desc: "Donut chart: Sữa bột, Bỉm tã, Đồ chơi, Khác" },
      { idx: 18, name: "Alert khách nợ", feature: "Cảnh báo", desc: "Banner đỏ gradient: số lượng + tổng tiền nợ, click → navigate" },
      { idx: 19, name: "Top khách hàng thân thiết", feature: "Xếp hạng KH", desc: "Avatar chữ cái, sao vàng top 3, tổng chi tiêu" },
      { idx: 20, name: "Biểu đồ tần suất mua", feature: "LineChart", desc: "Số đơn theo ngày" },
      { idx: 21, name: "Mini insight cards", feature: "Insight", desc: "Khách mới (24, +5%), Giữ chân (76%) — 2 card nhỏ" },
      { idx: 22, name: "Xuất Excel", feature: "Export", desc: "Export dữ liệu tab đang xem ra file .xlsx" },
    ]
  },
  // POS
  {
    screen: "4. POS - Bán hàng",
    items: [
      { idx: 23, name: "Tìm kiếm sản phẩm", feature: "Search", desc: "Search box với dropdown kết quả gợi ý" },
      { idx: 24, name: "Quét mã vạch", feature: "Scanner", desc: "Modal scanner (BarcodeScannerFix)" },
      { idx: 25, name: "Chọn khách hàng", feature: "Customer picker", desc: "Dropdown + tìm kiếm nâng cao + thêm nhanh khách hàng" },
      { idx: 26, name: "Multi-tab hóa đơn", feature: "Invoice tabs", desc: "Nhiều tab invoice, thêm/xoá tab, active tab persistence" },
      { idx: 27, name: "Giỏ hàng", feature: "Cart", desc: "Danh sách sản phẩm: tên, đơn giá, số lượng (+/-), tổng tiền từng dòng" },
      { idx: 28, name: "Edit số lượng inline", feature: "Inline edit", desc: "Click vào số lượng để nhập trực tiếp" },
      { idx: 29, name: "Xoá item khỏi giỏ", feature: "Remove", desc: "Nút X hoặc Trash2 trên mỗi dòng" },
      { idx: 30, name: "Chọn đơn vị tính", feature: "Unit conversion", desc: "Dropdown chọn đơn vị nếu sản phẩm có conversionUnits" },
      { idx: 31, name: "Đổi quà (Reward)", feature: "Reward modal", desc: "Modal chọn quà tặng từ điểm tích luỹ" },
      { idx: 32, name: "Khuyến mãi (Promotion)", feature: "Promo modal", desc: "Modal gợi ý khuyến mãi tự động dựa trên giỏ hàng" },
      { idx: 33, name: "Lịch sử đơn khách", feature: "Order history", desc: "Xem lịch sử mua hàng của khách đang chọn" },
      { idx: 34, name: "Thanh toán (Payment)", feature: "Payment modal", desc: "Phương thức (Tiền mặt/Chuyển khoản), số tiền nhận, tính tiền thừa" },
      { idx: 35, name: "Tích điểm", feature: "Loyalty points", desc: "Tự động tính điểm khi thanh toán" },
      { idx: 36, name: "Offline checkout", feature: "Offline queue", desc: "Lưu đơn vào queue khi mất mạng, tự đồng bộ khi có mạng" },
    ]
  },
  // Hàng hoá
  {
    screen: "5. Hàng hoá (Inventory)",
    items: [
      { idx: 37, name: "Danh sách sản phẩm", feature: "Product list", desc: "Table: tên, danh mục, thương hiệu, tồn kho, giá vốn, giá bán" },
      { idx: 38, name: "Thêm sản phẩm", feature: "Create product", desc: "Form thêm mới (tên, danh mục, thương hiệu, đơn vị, quy cách, giá, tồn...)" },
      { idx: 39, name: "Sửa sản phẩm", feature: "Edit product", desc: "Inline edit hoặc modal edit" },
      { idx: 40, name: "Xoá sản phẩm", feature: "Delete product", desc: "Confirm → xoá" },
      { idx: 41, name: "Xoá hàng loạt", feature: "Bulk delete", desc: "Checkbox chọn nhiều → bulk delete" },
      { idx: 42, name: "Cập nhật hàng loạt", feature: "Bulk update", desc: "Bulk update (giá, danh mục...)" },
      { idx: 43, name: "Import Excel", feature: "Bulk import", desc: "Import sản phẩm từ file" },
      { idx: 44, name: "Quản lý danh mục", feature: "Categories", desc: "Add/edit/delete category" },
      { idx: 45, name: "Quản lý thương hiệu", feature: "Brands", desc: "Add/edit/delete brand" },
      { idx: 46, name: "Kiểm kê kho", feature: "Inventory check", desc: "Tạo phiếu kiểm kê (hệ thống vs thực tế), hoàn thành → cập nhật tồn" },
    ]
  },
  // Khách hàng
  {
    screen: "6. Khách hàng",
    items: [
      { idx: 47, name: "Danh sách khách", feature: "Customer list", desc: "Table: tên, SĐT, tổng chi tiêu, điểm, công nợ" },
      { idx: 48, name: "Thêm/Sửa/Xoá KH", feature: "CRUD", desc: "Chi tiết + CRUD khách hàng" },
      { idx: 49, name: "Xoá hàng loạt KH", feature: "Bulk delete", desc: "Bulk delete khách hàng" },
      { idx: 50, name: "Lọc nợ", feature: "Debt filter", desc: "?filter=debt → chỉ hiện khách có công nợ" },
      { idx: 51, name: "Lịch sử điểm", feature: "Point history", desc: "Tích/đổi điểm theo thời gian" },
      { idx: 52, name: "Điều chỉnh điểm", feature: "Point adjustment", desc: "Admin cộng/trừ điểm thủ công" },
      { idx: 53, name: "Thanh toán công nợ", feature: "Debt payment", desc: "Trả tiền nợ của khách (chọn đơn → nhập số tiền)" },
    ]
  },
  // Nhà cung cấp
  {
    screen: "7. Nhà cung cấp",
    items: [
      { idx: 54, name: "Danh sách NCC", feature: "Supplier list", desc: "Table: tên, SĐT, công nợ" },
      { idx: 55, name: "Thêm/Sửa/Xoá NCC", feature: "CRUD", desc: "CRUD nhà cung cấp" },
      { idx: 56, name: "Thanh toán công nợ NCC", feature: "Debt payment", desc: "Trả tiền nợ theo phiếu nhập" },
    ]
  },
  // Nhập hàng
  {
    screen: "8. Nhập hàng",
    items: [
      { idx: 57, name: "Danh sách phiếu nhập", feature: "Import list", desc: "Table: số phiếu, NCC, ngày, tổng tiền, đã trả, còn nợ" },
      { idx: 58, name: "Tạo phiếu nhập", feature: "Create import", desc: "Chọn sản phẩm, số lượng, giá vốn, lô/hạn dùng, chọn NCC, phí ship" },
      { idx: 59, name: "Sửa phiếu nhập", feature: "Edit import", desc: "Điều chỉnh → tự động delta tồn kho + công nợ" },
      { idx: 60, name: "Xoá phiếu nhập", feature: "Delete import", desc: "Xoá → rollback tồn kho + công nợ" },
      { idx: 61, name: "Quản lý lô (Lot)", feature: "Lot/FEFO", desc: "Mỗi lô có mã + hạn dùng + số lượng, FEFO khi bán" },
    ]
  },
  // Đơn hàng
  {
    screen: "9. Đơn hàng",
    items: [
      { idx: 62, name: "Danh sách đơn", feature: "Order list", desc: "Table: mã đơn, khách, ngày, tổng, đã trả, còn nợ, thanh toán" },
      { idx: 63, name: "Lọc nâng cao", feature: "Advanced filters", desc: "Ngày bắt đầu/kết thúc, tên khách, mã đơn" },
      { idx: 64, name: "Phân trang", feature: "Pagination", desc: "20 đơn/trang" },
      { idx: 65, name: "Xem chi tiết đơn", feature: "Order detail modal", desc: "Modal: danh sách sản phẩm, khuyến mãi, quà tặng" },
      { idx: 66, name: "In hoá đơn", feature: "Print", desc: "PrintOrder utility" },
      { idx: 67, name: "Xoá đơn (rollback)", feature: "Delete with rollback", desc: "Xoá → hoàn tồn kho, điểm, công nợ" },
    ]
  },
  // Tính thuế + Báo cáo
  {
    screen: "10. Tính thuế & Báo cáo",
    items: [
      { idx: 68, name: "Tính thuế", feature: "TaxCalculation", desc: "Trang tính thuế" },
      { idx: 69, name: "Báo cáo tổng hợp", feature: "Reports", desc: "Tổng hợp products, orders, customers, suppliers" },
    ]
  },
  // Cài đặt
  {
    screen: "11. Cài đặt",
    items: [
      { idx: 70, name: "Cài đặt cửa hàng", feature: "Store settings", desc: "Tên, SĐT, địa chỉ, thông tin ngân hàng, kích cỡ in, font" },
      { idx: 71, name: "Quản lý quà tặng", feature: "Reward management", desc: "Thêm/xoá Reward (tên, điểm, tồn kho)" },
      { idx: 72, name: "Quản lý khuyến mãi", feature: "Promotion management", desc: "Thêm/sửa/xoá Promotion (điều kiện, % giảm, số tiền)" },
      { idx: 73, name: "Đồng bộ dữ liệu mẫu", feature: "Seed data", desc: "Reset dữ liệu mẫu" },
    ]
  },
  // Profile
  {
    screen: "12. Hồ sơ cá nhân",
    items: [
      { idx: 74, name: "Profile", feature: "Trang hồ sơ", desc: "Thông tin cá nhân người dùng" },
    ]
  },
  // Toàn app
  {
    screen: "13. Toàn ứng dụng",
    items: [
      { idx: 75, name: "Offline-first", feature: "Offline sync", desc: "Cache dữ liệu (localStorage), tự đồng bộ khi online" },
      { idx: 76, name: "Loading skeleton", feature: "Skeleton", desc: "Skeleton loading toàn bộ trang" },
      { idx: 77, name: "Responsive wrapper", feature: "RWD", desc: "md:block, lg:hidden, pb-20 cho bottom nav ..." },
    ]
  },
];

function createTableCell(text, opts = {}) {
  const { shading, width, bold, alignment, fontSize } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: shading || undefined,
    margins,
    verticalAlign: "center",
    children: [
      new Paragraph({
        alignment: alignment || AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: text,
            font: "Arial",
            size: fontSize || 20,
            bold: bold || false,
          }),
        ],
      }),
    ],
  });
}

function createHeaderRow() {
  return new TableRow({
    children: [
      createTableCell("#", { width: COL_INDEX, shading: headerShading, bold: true, fontSize: 20, alignment: AlignmentType.CENTER, color: "FFFFFF" }),
      createTableCell("Màn hình / Tính năng", { width: COL_NAME, shading: headerShading, bold: true, fontSize: 20, color: "FFFFFF" }),
      createTableCell("Tính năng", { width: COL_FEATURE, shading: headerShading, bold: true, fontSize: 20, color: "FFFFFF" }),
      createTableCell("Mô tả ngắn", { width: COL_DESC, shading: headerShading, bold: true, fontSize: 20, color: "FFFFFF" }),
    ],
  });
}

function createRow(item, isAlt) {
  return new TableRow({
    children: [
      createTableCell(String(item.idx), { width: COL_INDEX, shading: isAlt ? altRowShading : undefined, alignment: AlignmentType.CENTER, fontSize: 18 }),
      createTableCell(item.name, { width: COL_NAME, shading: isAlt ? altRowShading : undefined, fontSize: 18 }),
      createTableCell(item.feature, { width: COL_FEATURE, shading: isAlt ? altRowShading : undefined, fontSize: 18 }),
      createTableCell(item.desc, { width: COL_DESC, shading: isAlt ? altRowShading : undefined, fontSize: 18 }),
    ],
  });
}

function createSectionRow(screenName, count) {
  return new TableRow({
    children: [
      createTableCell("", { width: COL_INDEX, shading: sectionShading, fontSize: 18 }),
      createTableCell(screenName, { width: COL_NAME, shading: sectionShading, bold: true, fontSize: 20 }),
      createTableCell(`${count} tính năng`, { width: COL_FEATURE, shading: sectionShading, bold: true, fontSize: 18, alignment: AlignmentType.CENTER }),
      createTableCell("", { width: COL_DESC, shading: sectionShading, fontSize: 18 }),
    ],
  });
}

const children = [];

// Title
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({ text: "BẢNG PHÂN TÍCH TÍNH NĂNG ỨNG DỤNG VIETSALE PRO", font: "Arial", size: 32, bold: true }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({ text: "Desktop → Mobile & Tablet", font: "Arial", size: 26, color: "404040" }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({ text: "Tổng số tính năng: 77", font: "Arial", size: 22, color: "666666" }),
    ],
  }),
);

// Process each screen section
let rowCounter = 0;
for (const section of features) {
  // Section header row
  const sectionRows = [];
  sectionRows.push(createSectionRow(section.screen, section.items.length));
  rowCounter++;

  // Feature rows
  section.items.forEach((item, i) => {
    sectionRows.push(createRow(item, rowCounter % 2 === 0));
    rowCounter++;
  });

  children.push(
    new Table({
      width: { size: WIDTH, type: WidthType.DXA },
      columnWidths: [COL_INDEX, COL_NAME, COL_FEATURE, COL_DESC],
      rows: [createHeaderRow(), ...sectionRows],
    }),
    new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }),
  );
}

// Summary
children.push(
  new Paragraph({
    spacing: { before: 200 },
    children: [
      new TextRun({ text: "Tổng kết: ", font: "Arial", size: 22, bold: true }),
      new TextRun({ text: "13 màn hình chính, 77 tính năng", font: "Arial", size: 22 }),
    ],
  }),
);

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 720, right: 520, bottom: 720, left: 520 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "VietSales Pro - Feature Analysis", font: "Arial", size: 18, color: "999999" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Trang ", font: "Arial", size: 18, color: "999999" }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "999999" }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("B1_PhanTichTinhNang_VietSalesPro.docx", buffer);
  console.log("✅ File created: B1_PhanTichTinhNang_VietSalesPro.docx");
});