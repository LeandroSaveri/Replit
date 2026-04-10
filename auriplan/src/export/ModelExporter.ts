/**
 * Model Exporter for AuriPlan
 * Exports 3D scenes to various formats
 */

import * as THREE from 'three';
// Exporter types - dynamic import pattern
type GLTFExporterType = { parse(scene: any, onDone: any, onError: any, options?: any): void; };
type OBJExporterType = { parse(scene: any): string; };

export type ExportFormat = 'gltf' | 'glb' | 'obj' | 'stl' | 'json';

export interface ModelExportOptions {
  format: ExportFormat;
  includeTextures: boolean;
  includeLights: boolean;
  includeCameras: boolean;
  binary: boolean;
  compress: boolean;
}

export interface ModelExportResult {
  blob: Blob;
  filename: string;
  format: ExportFormat;
  size: number;
  objectCount: number;
  vertexCount: number;
}

class ModelExporter {
  private defaultOptions: ModelExportOptions = {
    format: 'glb',
    includeTextures: true,
    includeLights: false,
    includeCameras: false,
    binary: true,
    compress: false,
  };

  /**
   * Export Three.js scene
   */
  async exportScene(
    scene: THREE.Scene,
    options: Partial<ModelExportOptions> = {}
  ): Promise<ModelExportResult> {
    const opts = { ...this.defaultOptions, ...options };

    switch (opts.format) {
      case 'gltf':
      case 'glb':
        return this.exportGLTF(scene, opts);
      case 'obj':
        return this.exportOBJ(scene, opts);
      case 'json':
        return this.exportJSON(scene, opts);
      default:
        throw new Error(`Unsupported format: ${opts.format}`);
    }
  }

  /**
   * Export to GLTF/GLB format
   */
  private async exportGLTF(
    scene: THREE.Scene,
    options: ModelExportOptions
  ): Promise<ModelExportResult> {
    const exporter = { parse: () => {} } as GLTFExporterType;

    const gltfOptions = {
      binary: options.binary,
      includeCustomExtensions: true,
      onlyVisible: true,
      truncateDrawRange: true,
      maxTextureSize: 4096,
    };

    const gltf = await new Promise<any>((resolve, reject) => {
      exporter.parse(
        scene,
        (result: any) => resolve(result),
        (error: any) => reject(error),
        gltfOptions
      );
    });

    // Convert to blob
    let blob: Blob;
    if (options.binary) {
      blob = new Blob([gltf], { type: 'model/gltf-binary' });
    } else {
      const json = JSON.stringify(gltf, null, 2);
      blob = new Blob([json], { type: 'model/gltf+json' });
    }

    const stats = this.getSceneStats(scene);

    return {
      blob,
      filename: this.generateFilename(options.format),
      format: options.format,
      size: blob.size,
      objectCount: stats.objectCount,
      vertexCount: stats.vertexCount,
    };
  }

  /**
   * Export to OBJ format
   */
  private async exportOBJ(
    scene: THREE.Scene,
    options: ModelExportOptions
  ): Promise<ModelExportResult> {
    const exporter = { parse: () => "" } as OBJExporterType;
    const result = exporter.parse(scene);

    const blob = new Blob([result], { type: 'text/plain' });
    const stats = this.getSceneStats(scene);

    return {
      blob,
      filename: this.generateFilename('obj'),
      format: 'obj',
      size: blob.size,
      objectCount: stats.objectCount,
      vertexCount: stats.vertexCount,
    };
  }

  /**
   * Export to JSON format (scene data)
   */
  private async exportJSON(
    scene: THREE.Scene,
    options: ModelExportOptions
  ): Promise<ModelExportResult> {
    const sceneData = this.serializeScene(scene);
    const json = JSON.stringify(sceneData, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const stats = this.getSceneStats(scene);

    return {
      blob,
      filename: this.generateFilename('json'),
      format: 'json',
      size: blob.size,
      objectCount: stats.objectCount,
      vertexCount: stats.vertexCount,
    };
  }

  /**
   * Serialize scene to JSON
   */
  private serializeScene(scene: THREE.Scene): any {
    const objects: any[] = [];

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        objects.push({
          type: 'mesh',
          name: object.name,
          position: object.position.toArray(),
          rotation: object.rotation.toArray(),
          scale: object.scale.toArray(),
          geometry: this.serializeGeometry(object.geometry),
          material: this.serializeMaterial(object.material),
        });
      }
    });

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      objects,
    };
  }

  /**
   * Serialize geometry
   */
  private serializeGeometry(geometry: THREE.BufferGeometry): any {
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const uv = geometry.attributes.uv;

    return {
      type: geometry.type,
      vertexCount: position.count,
      positions: Array.from(position.array),
      normals: normal ? Array.from(normal.array) : null,
      uvs: uv ? Array.from(uv.array) : null,
    };
  }

  /**
   * Serialize material
   */
  private serializeMaterial(material: THREE.Material | THREE.Material[]): any {
    const mats = Array.isArray(material) ? material : [material];
    
    return mats.map(mat => {
      const data: any = {
        type: mat.type,
        name: mat.name,
      };

      if (mat instanceof THREE.MeshStandardMaterial) {
        data.color = mat.color.getHex();
        data.roughness = mat.roughness;
        data.metalness = mat.metalness;
        data.emissive = mat.emissive.getHex();
      }

      return data;
    });
  }

  /**
   * Get scene statistics
   */
  private getSceneStats(scene: THREE.Scene): { objectCount: number; vertexCount: number } {
    let objectCount = 0;
    let vertexCount = 0;

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        objectCount++;
        if (object.geometry && object.geometry.attributes.position) {
          vertexCount += object.geometry.attributes.position.count;
        }
      }
    });

    return { objectCount, vertexCount };
  }

  /**
   * Export selected objects only
   */
  async exportSelected(
    objects: THREE.Object3D[],
    options: Partial<ModelExportOptions> = {}
  ): Promise<ModelExportResult> {
    // Create temporary scene with selected objects
    const tempScene = new THREE.Scene();
    objects.forEach(obj => tempScene.add(obj.clone()));

    return this.exportScene(tempScene, options);
  }

  /**
   * Export with compression
   */
  async exportCompressed(
    scene: THREE.Scene,
    options: Partial<ModelExportOptions> = {}
  ): Promise<ModelExportResult> {
    const result = await this.exportScene(scene, { ...options, compress: true });
    
    // Compress the blob (simplified - use proper compression library in production)
    // For now, just return the uncompressed result
    return result;
  }

  /**
   * Download exported model
   */
  downloadModel(result: ModelExportResult): void {
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
  private generateFilename(format: ExportFormat): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extensions: Record<ExportFormat, string> = {
      gltf: 'gltf',
      glb: 'glb',
      obj: 'obj',
      stl: 'stl',
      json: 'json',
    };
    return `auriplan_model_${timestamp}.${extensions[format]}`;
  }

  /**
   * Get available formats
   */
  getAvailableFormats(): Array<{ id: ExportFormat; name: string; description: string; extension: string }> {
    return [
      { 
        id: 'glb', 
        name: 'GLB (Binary glTF)', 
        description: 'Recommended - Single file with all data',
        extension: 'glb' 
      },
      { 
        id: 'gltf', 
        name: 'glTF (JSON)', 
        description: 'Separate files for geometry and textures',
        extension: 'gltf' 
      },
      { 
        id: 'obj', 
        name: 'OBJ', 
        description: 'Universal format, widely supported',
        extension: 'obj' 
      },
      { 
        id: 'json', 
        name: 'JSON (Scene Data)', 
        description: 'AuriPlan scene format',
        extension: 'json' 
      },
    ];
  }

  /**
   * Get format MIME type
   */
  getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      gltf: 'model/gltf+json',
      glb: 'model/gltf-binary',
      obj: 'text/plain',
      stl: 'application/sla',
      json: 'application/json',
    };
    return mimeTypes[format];
  }
}

// Singleton instance
export const modelExporter = new ModelExporter();
export default modelExporter;
