const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface EmailBrand {
  logo_url?: string;
  brand_color?: string;
  signature_html?: string;
  from_name?: string;
}

// Thay {{var}} trong chuỗi bằng giá trị từ variables. Biến không có giá trị → giữ nguyên placeholder.
export const renderTemplate = (tpl: string, variables: Record<string, string>): string => {
  return String(tpl ?? '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return escapeHtml(String(variables[key]));
    }
    return `{{${key}}}`;
  });
};

// Wrap body với header (logo + brand color) và footer (signature).
export const wrapWithBrand = (bodyHtml: string, brand: EmailBrand): string => {
  const color = brand.brand_color || '#2563eb';
  const logo = brand.logo_url
    ? `<img src="${escapeHtml(brand.logo_url)}" alt="logo" style="max-height:56px;max-width:180px;display:block;margin-bottom:12px" />`
    : '';
  const signature = brand.signature_html
    ? `<p style="margin-top:24px">${brand.signature_html}</p>`
    : '';
  return `
<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;max-width:640px;margin:0 auto">
  <div style="border-bottom:3px solid ${escapeHtml(color)};padding-bottom:12px;margin-bottom:16px">
    ${logo}
  </div>
  ${bodyHtml}
  ${signature}
</div>`;
};
