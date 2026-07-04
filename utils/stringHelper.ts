/**
 * Hàm chuẩn hóa tên sản phẩm: Viết hoa chữ cái đầu của mỗi từ, các chữ sau viết thường.
 * Xử lý chính xác 100% tiếng Việt có dấu (Đ, Ă, Â, Ô, Ơ, Ư,...) và xóa khoảng trắng thừa.
 *
 * Ví dụ:
 *   "SỬA BỘT ABBOTT"        → "Sữa Bột Abbott"
 *   "đồ chơi xe cần cẩu"   → "Đồ Chơi Xe Cần Cẩu"
 *   "LÓC SỮA 110ML"         → "Lóc Sữa 110ml"
 *   ""                       → ""
 */
export function capitalizeProductName(name: string): string {
  if (!name || typeof name !== 'string') return '';

  return name
    .trim()                          // 1. Loại bỏ khoảng trắng thừa ở đầu và cuối
    .toLowerCase()                   // 2. Chuyển toàn bộ chuỗi về chữ thường trước
    .replace(/\s+/g, ' ')           // 3. Thu gọn nhiều khoảng trắng ở giữa thành 1 khoảng trắng
    .split(' ')                      // 4. Tách chuỗi thành mảng các từ dựa vào khoảng trắng
    .map(word => {
      if (word.length === 0) return '';

      // 5. Lấy chữ cái đầu tiên viết hoa + ghép với phần còn lại của từ
      // charAt(0).toUpperCase() hoạt động hoàn hảo với Đ, Ă, Â, Ô, Ơ, Ư,... trong ES6+
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');                      // 6. Ghép các từ lại thành chuỗi hoàn chỉnh
}
