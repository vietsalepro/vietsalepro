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
    const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
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
