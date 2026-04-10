/**
 * Post-Processing Pipeline
 * Sistema de pós-processamento para efeitos visuais avançados
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export interface PostProcessConfig {
  enabled: boolean;
  bloom: {
    enabled: boolean;
    strength: number;
    radius: number;
    threshold: number;
  };
  ssao: {
    enabled: boolean;
    kernelRadius: number;
    minDistance: number;
    maxDistance: number;
  };
  antialiasing: {
    enabled: boolean;
    type: 'smaa' | 'fxaa' | 'none';
  };
  toneMapping: {
    enabled: boolean;
    exposure: number;
    type: 'aces' | 'reinhard' | 'linear';
  };
  colorCorrection: {
    enabled: boolean;
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

export interface QualityPreset {
  name: string;
  description: string;
  config: PostProcessConfig;
}

export class PostProcessingPipeline {
  private static instance: PostProcessingPipeline;
  private composer: EffectComposer | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private renderPass: RenderPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private ssaoPass: SSAOPass | null = null;
  private smaaPass: SMAAPass | null = null;
  private outputPass: OutputPass | null = null;

  private config: PostProcessConfig = {
    enabled: true,
    bloom: {
      enabled: false,
      strength: 0.5,
      radius: 0.4,
      threshold: 0.85,
    },
    ssao: {
      enabled: true,
      kernelRadius: 16,
      minDistance: 0.005,
      maxDistance: 0.1,
    },
    antialiasing: {
      enabled: true,
      type: 'smaa',
    },
    toneMapping: {
      enabled: true,
      exposure: 1.0,
      type: 'aces',
    },
    colorCorrection: {
      enabled: false,
      brightness: 0.0,
      contrast: 1.0,
      saturation: 1.0,
    },
  };

  // Quality presets
  private readonly qualityPresets: QualityPreset[] = [
    {
      name: 'Low',
      description: 'Optimized for performance',
      config: {
        enabled: false,
        bloom: { enabled: false, strength: 0, radius: 0, threshold: 1 },
        ssao: { enabled: false, kernelRadius: 8, minDistance: 0.01, maxDistance: 0.1 },
        antialiasing: { enabled: true, type: 'fxaa' },
        toneMapping: { enabled: false, exposure: 1.0, type: 'linear' },
        colorCorrection: { enabled: false, brightness: 0, contrast: 1, saturation: 1 },
      },
    },
    {
      name: 'Medium',
      description: 'Balanced quality and performance',
      config: {
        enabled: true,
        bloom: { enabled: false, strength: 0.3, radius: 0.3, threshold: 0.9 },
        ssao: { enabled: true, kernelRadius: 12, minDistance: 0.005, maxDistance: 0.08 },
        antialiasing: { enabled: true, type: 'smaa' },
        toneMapping: { enabled: true, exposure: 1.0, type: 'reinhard' },
        colorCorrection: { enabled: false, brightness: 0, contrast: 1, saturation: 1 },
      },
    },
    {
      name: 'High',
      description: 'High quality rendering',
      config: {
        enabled: true,
        bloom: { enabled: true, strength: 0.4, radius: 0.4, threshold: 0.85 },
        ssao: { enabled: true, kernelRadius: 16, minDistance: 0.005, maxDistance: 0.1 },
        antialiasing: { enabled: true, type: 'smaa' },
        toneMapping: { enabled: true, exposure: 1.0, type: 'aces' },
        colorCorrection: { enabled: true, brightness: 0, contrast: 1.05, saturation: 1.1 },
      },
    },
    {
      name: 'Ultra',
      description: 'Maximum quality for high-end systems',
      config: {
        enabled: true,
        bloom: { enabled: true, strength: 0.5, radius: 0.5, threshold: 0.8 },
        ssao: { enabled: true, kernelRadius: 32, minDistance: 0.002, maxDistance: 0.15 },
        antialiasing: { enabled: true, type: 'smaa' },
        toneMapping: { enabled: true, exposure: 1.1, type: 'aces' },
        colorCorrection: { enabled: true, brightness: 0.02, contrast: 1.08, saturation: 1.15 },
      },
    },
    {
      name: 'Photorealistic',
      description: 'Optimized for realistic interior rendering',
      config: {
        enabled: true,
        bloom: { enabled: false, strength: 0.2, radius: 0.3, threshold: 0.95 },
        ssao: { enabled: true, kernelRadius: 24, minDistance: 0.003, maxDistance: 0.12 },
        antialiasing: { enabled: true, type: 'smaa' },
        toneMapping: { enabled: true, exposure: 0.9, type: 'aces' },
        colorCorrection: { enabled: true, brightness: -0.02, contrast: 1.02, saturation: 0.95 },
      },
    },
  ];

  private constructor() {}

  static getInstance(): PostProcessingPipeline {
    if (!PostProcessingPipeline.instance) {
      PostProcessingPipeline.instance = new PostProcessingPipeline();
    }
    return PostProcessingPipeline.instance;
  }

  /**
   * Initialize post-processing pipeline
   */
  initialize(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number
  ): void {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Create composer
    this.composer = new EffectComposer(renderer);

    // Add render pass
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Setup passes based on config
    this.setupPasses(width, height);

    // Apply initial tone mapping settings
    this.applyToneMapping();
  }

  /**
   * Setup post-processing passes
   */
  private setupPasses(width: number, height: number): void {
    if (!this.composer) return;

    // Remove existing passes (except render pass)
    while (this.composer.passes.length > 1) {
      this.composer.removePass(this.composer.passes[this.composer.passes.length - 1]);
    }

    // SSAO Pass
    if (this.config.ssao.enabled) {
      this.ssaoPass = new SSAOPass(this.scene!, this.camera!, width, height);
      this.ssaoPass.kernelRadius = this.config.ssao.kernelRadius;
      this.ssaoPass.minDistance = this.config.ssao.minDistance;
      this.ssaoPass.maxDistance = this.config.ssao.maxDistance;
      this.composer.addPass(this.ssaoPass);
    }

    // Bloom Pass
    if (this.config.bloom.enabled) {
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        this.config.bloom.strength,
        this.config.bloom.radius,
        this.config.bloom.threshold
      );
      this.composer.addPass(this.bloomPass);
    }

    // Antialiasing Pass
    if (this.config.antialiasing.enabled && this.config.antialiasing.type === 'smaa') {
      this.smaaPass = new SMAAPass(width, height);
      this.composer.addPass(this.smaaPass);
    }

    // Output pass (tone mapping)
    if (this.config.toneMapping.enabled) {
      this.outputPass = new OutputPass();
      this.composer.addPass(this.outputPass);
    }
  }

  /**
   * Apply tone mapping settings
   */
  private applyToneMapping(): void {
    if (!this.renderer) return;

    switch (this.config.toneMapping.type) {
      case 'aces':
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        break;
      case 'reinhard':
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        break;
      case 'linear':
      default:
        this.renderer.toneMapping = THREE.LinearToneMapping;
        break;
    }

    this.renderer.toneMappingExposure = this.config.toneMapping.exposure;
  }

  /**
   * Render frame with post-processing
   */
  render(): void {
    if (this.config.enabled && this.composer) {
      this.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Resize pipeline
   */
  resize(width: number, height: number): void {
    if (this.composer) {
      this.composer.setSize(width, height);
    }

    // Recreate passes with new dimensions
    this.setupPasses(width, height);
  }

  /**
   * Apply quality preset
   */
  applyPreset(presetName: string): boolean {
    const preset = this.qualityPresets.find(p => p.name === presetName);
    if (!preset) return false;

    this.config = { ...preset.config };
    
    // Re-setup passes
    if (this.renderer && this.scene && this.camera) {
      const size = this.renderer.getSize(new THREE.Vector2());
      this.setupPasses(size.width, size.height);
    }

    this.applyToneMapping();
    return true;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PostProcessConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update individual pass settings
    if (this.bloomPass && config.bloom) {
      this.bloomPass.strength = config.bloom.strength ?? this.bloomPass.strength;
      this.bloomPass.radius = config.bloom.radius ?? this.bloomPass.radius;
      this.bloomPass.threshold = config.bloom.threshold ?? this.bloomPass.threshold;
    }

    if (this.ssaoPass && config.ssao) {
      this.ssaoPass.kernelRadius = config.ssao.kernelRadius ?? this.ssaoPass.kernelRadius;
      this.ssaoPass.minDistance = config.ssao.minDistance ?? this.ssaoPass.minDistance;
      this.ssaoPass.maxDistance = config.ssao.maxDistance ?? this.ssaoPass.maxDistance;
    }

    if (config.toneMapping) {
      this.applyToneMapping();
    }
  }

  /**
   * Enable/disable post-processing
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Toggle specific effect
   */
  toggleEffect(effect: keyof Omit<PostProcessConfig, 'enabled'>): void {
    const effectConfig = this.config[effect] as any;
    if (effectConfig && 'enabled' in effectConfig) {
      effectConfig.enabled = !effectConfig.enabled;
      
      // Re-setup passes
      if (this.renderer && this.scene && this.camera) {
        const size = this.renderer.getSize(new THREE.Vector2());
        this.setupPasses(size.width, size.height);
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PostProcessConfig {
    return { ...this.config };
  }

  /**
   * Get available quality presets
   */
  getQualityPresets(): QualityPreset[] {
    return [...this.qualityPresets];
  }

  /**
   * Get performance metrics
   */
  getPerformanceInfo(): {
    passCount: number;
    estimatedCost: 'low' | 'medium' | 'high' | 'ultra';
  } {
    let passCount = 1; // Render pass always present
    let cost = 0;

    if (this.config.ssao.enabled) {
      passCount++;
      cost += 3; // SSAO is expensive
    }
    if (this.config.bloom.enabled) {
      passCount++;
      cost += 2; // Bloom is moderately expensive
    }
    if (this.config.antialiasing.enabled && this.config.antialiasing.type === 'smaa') {
      passCount++;
      cost += 1;
    }
    if (this.config.toneMapping.enabled) {
      passCount++;
      cost += 0.5;
    }

    let estimatedCost: 'low' | 'medium' | 'high' | 'ultra';
    if (cost <= 1) estimatedCost = 'low';
    else if (cost <= 3) estimatedCost = 'medium';
    else if (cost <= 5) estimatedCost = 'high';
    else estimatedCost = 'ultra';

    return { passCount, estimatedCost };
  }

  /**
   * Auto-configure based on device performance
   */
  autoConfigure(): void {
    // Detect device capabilities
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    const hasHighDPI = window.devicePixelRatio > 1.5;
    const memory = (navigator as any).deviceMemory || 4;

    if (isMobile || memory < 4) {
      this.applyPreset('Low');
    } else if (memory < 8 || hasHighDPI) {
      this.applyPreset('Medium');
    } else if (memory < 16) {
      this.applyPreset('High');
    } else {
      this.applyPreset('Ultra');
    }
  }

  /**
   * Take screenshot with post-processing
   */
  takeScreenshot(options?: {
    width?: number;
    height?: number;
    format?: 'png' | 'jpg';
    quality?: number;
  }): string {
    if (!this.composer) return '';

    // Render one frame
    this.render();

    // Get canvas and convert to data URL
    const canvas = this.composer.renderer.domElement;
    
    const format = options?.format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = options?.quality ?? 0.92;

    return canvas.toDataURL(format, quality);
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.composer) {
      this.composer.dispose();
    }
    if (this.bloomPass) {
      this.bloomPass.dispose();
    }
    if (this.ssaoPass) {
      this.ssaoPass.dispose();
    }
    if (this.smaaPass) {
      this.smaaPass.dispose();
    }
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}

// Export singleton
export const postProcessingPipeline = PostProcessingPipeline.getInstance();
