/**
 * PDF Exporter for AuriPlan
 * Exports floor plans and designs as PDF documents
 */

export interface PDFExportOptions {
  pageSize: 'A4' | 'A3' | 'A2' | 'A1' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  scale: number;
  includeTitle: boolean;
  includeDimensions: boolean;
  includeLegend: boolean;
  includeNotes: boolean;
  title?: string;
  author?: string;
  date?: string;
}

export interface PDFPage {
  title: string;
  imageDataUrl: string;
  width: number;
  height: number;
}

export interface PDFExportResult {
  blob: Blob;
  filename: string;
  pageCount: number;
  size: number;
}

class PDFExporter {
  private defaultOptions: PDFExportOptions = {
    pageSize: 'A4',
    orientation: 'landscape',
    scale: 1,
    includeTitle: true,
    includeDimensions: true,
    includeLegend: true,
    includeNotes: true,
  };

  private pageSizes: Record<string, { width: number; height: number }> = {
    A4: { width: 595, height: 842 },
    A3: { width: 842, height: 1191 },
    A2: { width: 1191, height: 1684 },
    A1: { width: 1684, height: 2384 },
    Letter: { width: 612, height: 792 },
    Legal: { width: 612, height: 1008 },
  };

  /**
   * Export floor plan to PDF
   */
  async exportFloorPlan(
    pages: PDFPage[],
    options: Partial<PDFExportOptions> = {}
  ): Promise<PDFExportResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Get page dimensions
    const pageDims = this.pageSizes[opts.pageSize];
    const pageWidth = opts.orientation === 'landscape' ? pageDims.height : pageDims.width;
    const pageHeight = opts.orientation === 'landscape' ? pageDims.width : pageDims.height;

    // Generate PDF content
    const pdfContent = this.generatePDFContent(pages, opts, pageWidth, pageHeight);
    
    // Create blob
    const blob = new Blob([pdfContent as BlobPart], { type: 'application/pdf' });

    return {
      blob,
      filename: this.generateFilename(),
      pageCount: pages.length,
      size: blob.size,
    };
  }

  /**
   * Generate PDF content (simplified PDF generation)
   * In production, use a library like jsPDF or pdfmake
   */
  private generatePDFContent(
    pages: PDFPage[],
    options: PDFExportOptions,
    pageWidth: number,
    pageHeight: number
  ): Uint8Array {
    // This is a simplified placeholder
    // In production, use a proper PDF library
    
    const pdfHeader = `%PDF-1.4\n`;
    let content = pdfHeader;

    // Add pages
    pages.forEach((page, index) => {
      content += this.generatePage(page, options, pageWidth, pageHeight, index);
    });

    content += `%%EOF\n`;

    return new TextEncoder().encode(content);
  }

  /**
   * Generate a single PDF page
   */
  private generatePage(
    page: PDFPage,
    options: PDFExportOptions,
    pageWidth: number,
    pageHeight: number,
    pageIndex: number
  ): string {
    let pageContent = '';

    // Page object
    pageContent += `${pageIndex + 1} 0 obj\n`;
    pageContent += `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${pageIndex + 10} 0 R >>\n`;
    pageContent += `endobj\n`;

    // Content stream (simplified)
    pageContent += `${pageIndex + 10} 0 obj\n`;
    pageContent += `<< /Length 100 >>\n`;
    pageContent += `stream\n`;
    
    // Title
    if (options.includeTitle && options.title) {
      pageContent += `BT /F1 24 Tf 50 ${pageHeight - 50} Td (${options.title}) Tj ET\n`;
    }

    // Page title
    pageContent += `BT /F1 18 Tf 50 ${pageHeight - 100} Td (${page.title}) Tj ET\n`;

    // Image placeholder
    pageContent += `q ${pageWidth - 100} 0 0 ${pageHeight - 200} 50 50 cm /Im${pageIndex} Do Q\n`;

    pageContent += `endstream\n`;
    pageContent += `endobj\n`;

    return pageContent;
  }

  /**
   * Export using html2canvas and jsPDF approach
   * This is the recommended approach for production
   */
  async exportWithHtml2Canvas(
    element: HTMLElement,
    options: Partial<PDFExportOptions> = {}
  ): Promise<PDFExportResult> {
    // This would use html2canvas to capture the element
    // and then create a PDF from the canvas
    
    // For now, return a placeholder
    const placeholderContent = 'PDF Export - Use html2canvas + jsPDF in production';
    const blob = new Blob([placeholderContent], { type: 'application/pdf' });

    return {
      blob,
      filename: this.generateFilename(),
      pageCount: 1,
      size: blob.size,
    };
  }

  /**
   * Create a multi-page PDF from images
   */
  async createMultiPagePDF(
    images: Array<{ dataUrl: string; title: string }>,
    options: Partial<PDFExportOptions> = {}
  ): Promise<PDFExportResult> {
    const pages: PDFPage[] = images.map(img => ({
      title: img.title,
      imageDataUrl: img.dataUrl,
      width: 1920,
      height: 1080,
    }));

    return this.exportFloorPlan(pages, options);
  }

  /**
   * Export project summary
   */
  async exportProjectSummary(
    projectData: {
      name: string;
      rooms: Array<{ name: string; area: number }>;
      totalArea: number;
      materials: Array<{ name: string; quantity: string }>;
    },
    options: Partial<PDFExportOptions> = {}
  ): Promise<PDFExportResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Create summary content
    let content = `%PDF-1.4\n`;
    content += `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n`;
    content += `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n`;
    content += `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >> endobj\n`;
    content += `4 0 obj << /Length 500 >> stream\n`;
    
    // Title
    content += `BT /F1 24 Tf 50 750 Td (Project Summary: ${projectData.name}) Tj ET\n`;
    
    // Rooms
    content += `BT /F1 14 Tf 50 700 Td (Rooms) Tj ET\n`;
    let y = 680;
    projectData.rooms.forEach(room => {
      content += `BT /F1 12 Tf 70 ${y} Td (${room.name}: ${room.area.toFixed(2)} m²) Tj ET\n`;
      y -= 20;
    });

    // Total
    content += `BT /F1 14 Tf 50 ${y - 10} Td (Total Area: ${projectData.totalArea.toFixed(2)} m²) Tj ET\n`;

    // Materials
    y -= 40;
    content += `BT /F1 14 Tf 50 ${y} Td (Materials) Tj ET\n`;
    y -= 20;
    projectData.materials.forEach(mat => {
      content += `BT /F1 12 Tf 70 ${y} Td (${mat.name}: ${mat.quantity}) Tj ET\n`;
      y -= 20;
    });

    content += `endstream endobj\n`;
    content += `xref\n0 5\n0000000000 65535 f\n`;
    content += `trailer << /Size 5 /Root 1 0 R >>\n`;
    content += `startxref\n0\n%%EOF\n`;

    const blob = new Blob([content], { type: 'application/pdf' });

    return {
      blob,
      filename: `project_summary_${Date.now()}.pdf`,
      pageCount: 1,
      size: blob.size,
    };
  }

  /**
   * Download PDF
   */
  downloadPDF(result: PDFExportResult): void {
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate filename
   */
  private generateFilename(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `auriplan_floorplan_${timestamp}.pdf`;
  }

  /**
   * Get available page sizes
   */
  getAvailablePageSizes(): Array<{ id: string; name: string; width: number; height: number }> {
    return [
      { id: 'A4', name: 'A4', width: 210, height: 297 },
      { id: 'A3', name: 'A3', width: 297, height: 420 },
      { id: 'A2', name: 'A2', width: 420, height: 594 },
      { id: 'A1', name: 'A1', width: 594, height: 841 },
      { id: 'Letter', name: 'US Letter', width: 216, height: 279 },
      { id: 'Legal', name: 'US Legal', width: 216, height: 356 },
    ];
  }

  /**
   * Get recommended scale for page size
   */
  getRecommendedScale(pageSize: string): number {
    switch (pageSize) {
      case 'A1':
      case 'A2':
        return 1;
      case 'A3':
        return 0.75;
      case 'A4':
      case 'Letter':
      default:
        return 0.5;
    }
  }
}

// Singleton instance
export const pdfExporter = new PDFExporter();
export default pdfExporter;
