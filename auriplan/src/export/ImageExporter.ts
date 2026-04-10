/**
 * Image Exporter for AuriPlan
 * Exports rendered scenes as images
 */
import type * as THREE from 'three';

export interface ImageExportOptions {
  format: 'png' | 'jpg' | 'webp';
  quality: number; // 0-1 for jpg/webp
  width: number;
  height: number;
  transparent?: boolean;
  includeGrid?: boolean;
}

export interface ImageExportResult {
  dataUrl: string;
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  size: number; // in bytes
}

class ImageExporter {
  private defaultOptions: ImageExportOptions = {
    format: 'png',
    quality: 0.95,
    width: 1920,
    height: 1080,
    transparent: false,
    includeGrid: false,
  };

  /**
   * Export canvas to image
   */
  async exportCanvas(
    canvas: HTMLCanvasElement,
    options: Partial<ImageExportOptions> = {}
  ): Promise<ImageExportResult> {
    const opts = { ...this.defaultOptions, ...options };

    // Create a temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = opts.width;
    tempCanvas.height = opts.height;
    const ctx = tempCanvas.getContext('2d')!;

    // Fill background if not transparent
    if (!opts.transparent) {
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, opts.width, opts.height);
    }

    // Draw original canvas scaled to target size
    ctx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      opts.width,
      opts.height
    );

    // Convert to blob
    const mimeType = this.getMimeType(opts.format);
    const blob = await new Promise<Blob>((resolve) => {
      tempCanvas.toBlob(
        (b) => resolve(b!),
        mimeType,
        opts.quality
      );
    });

    // Create data URL
    const dataUrl = tempCanvas.toDataURL(mimeType, opts.quality);

    return {
      dataUrl,
      blob,
      filename: this.generateFilename(opts.format),
      width: opts.width,
      height: opts.height,
      size: blob.size,
    };
  }

  /**
   * Export from Three.js renderer
   */
  async exportThreeRenderer(
    renderer: THREE.WebGLRenderer,
    options: Partial<ImageExportOptions> = {}
  ): Promise<ImageExportResult> {
    const canvas = renderer.domElement;
    return this.exportCanvas(canvas, options);
  }

  /**
   * Export 2D canvas (floor plan view)
   */
  async export2DCanvas(
    canvas: HTMLCanvasElement,
    options: Partial<ImageExportOptions> = {}
  ): Promise<ImageExportResult> {
    return this.exportCanvas(canvas, {
      ...options,
      transparent: false, // 2D view should have background
    });
  }

  /**
   * Export with watermark
   */
  async exportWithWatermark(
    canvas: HTMLCanvasElement,
    watermarkText: string,
    options: Partial<ImageExportOptions> = {}
  ): Promise<ImageExportResult> {
    const opts = { ...this.defaultOptions, ...options };

    // Create temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = opts.width;
    tempCanvas.height = opts.height;
    const ctx = tempCanvas.getContext('2d')!;

    // Draw original
    ctx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      opts.width,
      opts.height
    );

    // Add watermark
    ctx.save();
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    
    const text = watermarkText;
    const metrics = ctx.measureText(text);
    const x = opts.width - metrics.width - 20;
    const y = opts.height - 30;
    
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();

    // Convert to blob
    const mimeType = this.getMimeType(opts.format);
    const blob = await new Promise<Blob>((resolve) => {
      tempCanvas.toBlob(
        (b) => resolve(b!),
        mimeType,
        opts.quality
      );
    });

    const dataUrl = tempCanvas.toDataURL(mimeType, opts.quality);

    return {
      dataUrl,
      blob,
      filename: this.generateFilename(opts.format),
      width: opts.width,
      height: opts.height,
      size: blob.size,
    };
  }

  /**
   * Export multiple views (2D and 3D)
   */
  async exportMultipleViews(
    canvas2D: HTMLCanvasElement,
    canvas3D: HTMLCanvasElement,
    options: Partial<ImageExportOptions> = {}
  ): Promise<ImageExportResult[]> {
    const [export2D, export3D] = await Promise.all([
      this.export2DCanvas(canvas2D, options),
      this.exportCanvas(canvas3D, options),
    ]);

    return [
      { ...export2D, filename: `floorplan_2d_${Date.now()}.${options.format || 'png'}` },
      { ...export3D, filename: `floorplan_3d_${Date.now()}.${options.format || 'png'}` },
    ];
  }

  /**
   * Download image
   */
  downloadImage(result: ImageExportResult): void {
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Get MIME type from format
   */
  private getMimeType(format: string): string {
    switch (format) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      case 'png':
      default:
        return 'image/png';
    }
  }

  /**
   * Generate filename
   */
  private generateFilename(format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `auriplan_export_${timestamp}.${format}`;
  }

  /**
   * Get available formats
   */
  getAvailableFormats(): Array<{ id: string; name: string; mimeType: string }> {
    return [
      { id: 'png', name: 'PNG (Best Quality)', mimeType: 'image/png' },
      { id: 'jpg', name: 'JPEG (Smaller Size)', mimeType: 'image/jpeg' },
      { id: 'webp', name: 'WebP (Modern)', mimeType: 'image/webp' },
    ];
  }

  /**
   * Get recommended size for quality
   */
  getRecommendedSize(quality: 'low' | 'medium' | 'high' | 'ultra'): { width: number; height: number } {
    switch (quality) {
      case 'low':
        return { width: 1280, height: 720 };
      case 'medium':
        return { width: 1920, height: 1080 };
      case 'high':
        return { width: 2560, height: 1440 };
      case 'ultra':
        return { width: 3840, height: 2160 };
      default:
        return { width: 1920, height: 1080 };
    }
  }
}

// Singleton instance
export const imageExporter = new ImageExporter();
export default imageExporter;
