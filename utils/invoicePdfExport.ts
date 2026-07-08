/**
 * Xuất một phần tử HTML thành file PDF dùng jsPDF + html2canvas (lazy load).
 * ponytail: chỉ load library khi xuất PDF, tránh phình bundle chính.
 * Hạn chế: PDF chứa ảnh, text không chọn được; nếu cần text chọn được thì dùng
 * jsPDF với font custom hoặc pdfmake.
 */
export async function exportInvoiceToPdf(
  element: HTMLElement | null,
  filename: string
): Promise<void> {
  if (!element) return;

  const [{ jsPDF }, html2canvasMod] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = (html2canvasMod as any).default || html2canvasMod;

  // ponytail: clone element ra container off-screen để tránh bị cắt bởi
  // modal scrollable/overflow khi hóa đơn dài hơn viewport.
  const clone = element.cloneNode(true) as HTMLElement;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.visibility = 'hidden';
  container.style.overflow = 'visible';
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(clone, { 
      scale: 2, 
      useCORS: true,
      onclone: (clonedDoc: Document) => {
        // ponytail: fix html2canvas không hỗ trợ oklch color function từ Tailwind v4
        // Convert computed styles sang inline styles để browser convert oklch -> rgb
        const convertColors = (el: HTMLElement) => {
          const computed = (clonedDoc.defaultView || window).getComputedStyle(el);
          const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'];
          colorProps.forEach(prop => {
            const value = computed.getPropertyValue(prop);
            if (value && value !== 'none' && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
              (el.style as any)[prop] = value;
            }
          });
          Array.from(el.children).forEach(child => convertColors(child as HTMLElement));
        };
        convertColors(clonedDoc.body.firstChild as HTMLElement);
      }
    });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}
