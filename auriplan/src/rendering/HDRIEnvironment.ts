/**
 * HDRI Environment System
 * Gerencia iluminação realista baseada em HDRI para renderização PBR
 */

import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
// PMREMGenerator is built into THREE

export interface HDRIConfig {
  intensity: number;
  rotation: number;
  blur: number;
}

export interface HDRIEnvironment {
  id: string;
  name: string;
  description: string;
  url: string;
  thumbnail: string;
  category: 'indoor' | 'outdoor' | 'studio' | 'sunset' | 'night';
  defaultIntensity: number;
  resolution: number;
}

export interface LightingPreset {
  name: string;
  environment: string;
  ambientIntensity: number;
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: { x: number; y: number; z: number };
  shadows: boolean;
  shadowMapSize: number;
}

export class HDRIManager {
  private static instance: HDRIManager;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private pmremGenerator: any = null;
  private currentEnvironment: THREE.Texture | null = null;
  private currentConfig: HDRIConfig = {
    intensity: 1.0,
    rotation: 0,
    blur: 0,
  };

  // HDRI Library
  private readonly hdriLibrary: HDRIEnvironment[] = [
    {
      id: 'studio-soft',
      name: 'Studio Soft',
      description: 'Soft studio lighting perfect for product visualization',
      url: '/assets/hdri/studio_soft.hdr',
      thumbnail: '/assets/hdri/thumbnails/studio_soft.jpg',
      category: 'studio',
      defaultIntensity: 1.0,
      resolution: 1024,
    },
    {
      id: 'studio-neutral',
      name: 'Studio Neutral',
      description: 'Neutral white studio environment',
      url: '/assets/hdri/studio_neutral.hdr',
      thumbnail: '/assets/hdri/thumbnails/studio_neutral.jpg',
      category: 'studio',
      defaultIntensity: 1.0,
      resolution: 1024,
    },
    {
      id: 'living-room-day',
      name: 'Living Room Day',
      description: 'Bright natural light from large windows',
      url: '/assets/hdri/living_room_day.hdr',
      thumbnail: '/assets/hdri/thumbnails/living_room_day.jpg',
      category: 'indoor',
      defaultIntensity: 1.2,
      resolution: 2048,
    },
    {
      id: 'living-room-evening',
      name: 'Living Room Evening',
      description: 'Warm evening indoor lighting',
      url: '/assets/hdri/living_room_evening.hdr',
      thumbnail: '/assets/hdri/thumbnails/living_room_evening.jpg',
      category: 'indoor',
      defaultIntensity: 0.8,
      resolution: 2048,
    },
    {
      id: 'kitchen-bright',
      name: 'Kitchen Bright',
      description: 'Bright kitchen with natural daylight',
      url: '/assets/hdri/kitchen_bright.hdr',
      thumbnail: '/assets/hdri/thumbnails/kitchen_bright.jpg',
      category: 'indoor',
      defaultIntensity: 1.3,
      resolution: 2048,
    },
    {
      id: 'bedroom-morning',
      name: 'Bedroom Morning',
      description: 'Soft morning light in bedroom',
      url: '/assets/hdri/bedroom_morning.hdr',
      thumbnail: '/assets/hdri/thumbnails/bedroom_morning.jpg',
      category: 'indoor',
      defaultIntensity: 0.9,
      resolution: 2048,
    },
    {
      id: 'city-day',
      name: 'City Day',
      description: 'Urban environment daylight',
      url: '/assets/hdri/city_day.hdr',
      thumbnail: '/assets/hdri/thumbnails/city_day.jpg',
      category: 'outdoor',
      defaultIntensity: 1.5,
      resolution: 4096,
    },
    {
      id: 'city-sunset',
      name: 'City Sunset',
      description: 'Golden hour urban lighting',
      url: '/assets/hdri/city_sunset.hdr',
      thumbnail: '/assets/hdri/thumbnails/city_sunset.jpg',
      category: 'sunset',
      defaultIntensity: 1.0,
      resolution: 4096,
    },
    {
      id: 'park-sunny',
      name: 'Park Sunny',
      description: 'Bright sunny day in park',
      url: '/assets/hdri/park_sunny.hdr',
      thumbnail: '/assets/hdri/thumbnails/park_sunny.jpg',
      category: 'outdoor',
      defaultIntensity: 1.4,
      resolution: 4096,
    },
    {
      id: 'beach-sunset',
      name: 'Beach Sunset',
      description: 'Warm beach sunset atmosphere',
      url: '/assets/hdri/beach_sunset.hdr',
      thumbnail: '/assets/hdri/thumbnails/beach_sunset.jpg',
      category: 'sunset',
      defaultIntensity: 0.9,
      resolution: 4096,
    },
    {
      id: 'night-city',
      name: 'Night City',
      description: 'Urban night scene with artificial lights',
      url: '/assets/hdri/night_city.hdr',
      thumbnail: '/assets/hdri/thumbnails/night_city.jpg',
      category: 'night',
      defaultIntensity: 0.6,
      resolution: 2048,
    },
    {
      id: 'night-street',
      name: 'Night Street',
      description: 'Street lighting at night',
      url: '/assets/hdri/night_street.hdr',
      thumbnail: '/assets/hdri/thumbnails/night_street.jpg',
      category: 'night',
      defaultIntensity: 0.5,
      resolution: 2048,
    },
    {
      id: 'overcast-sky',
      name: 'Overcast Sky',
      description: 'Soft diffused overcast lighting',
      url: '/assets/hdri/overcast_sky.hdr',
      thumbnail: '/assets/hdri/thumbnails/overcast_sky.jpg',
      category: 'outdoor',
      defaultIntensity: 0.8,
      resolution: 2048,
    },
    {
      id: 'cloudy-day',
      name: 'Cloudy Day',
      description: 'Cloudy day with soft shadows',
      url: '/assets/hdri/cloudy_day.hdr',
      thumbnail: '/assets/hdri/thumbnails/cloudy_day.jpg',
      category: 'outdoor',
      defaultIntensity: 0.9,
      resolution: 2048,
    },
    {
      id: 'warehouse-indoor',
      name: 'Warehouse Indoor',
      description: 'Large warehouse interior lighting',
      url: '/assets/hdri/warehouse_indoor.hdr',
      thumbnail: '/assets/hdri/thumbnails/warehouse_indoor.jpg',
      category: 'indoor',
      defaultIntensity: 0.7,
      resolution: 2048,
    },
    {
      id: 'modern-office',
      name: 'Modern Office',
      description: 'Contemporary office environment',
      url: '/assets/hdri/modern_office.hdr',
      thumbnail: '/assets/hdri/thumbnails/modern_office.jpg',
      category: 'indoor',
      defaultIntensity: 1.1,
      resolution: 2048,
    },
  ];

  // Lighting presets
  private readonly lightingPresets: LightingPreset[] = [
    {
      name: 'Natural Day',
      environment: 'living-room-day',
      ambientIntensity: 0.4,
      directionalIntensity: 1.0,
      directionalColor: '#FFF8E7',
      directionalPosition: { x: 10, y: 20, z: 10 },
      shadows: true,
      shadowMapSize: 2048,
    },
    {
      name: 'Golden Hour',
      environment: 'city-sunset',
      ambientIntensity: 0.3,
      directionalIntensity: 0.8,
      directionalColor: '#FFD700',
      directionalPosition: { x: -15, y: 8, z: -5 },
      shadows: true,
      shadowMapSize: 2048,
    },
    {
      name: 'Studio Setup',
      environment: 'studio-neutral',
      ambientIntensity: 0.5,
      directionalIntensity: 0.7,
      directionalColor: '#FFFFFF',
      directionalPosition: { x: 5, y: 10, z: 5 },
      shadows: true,
      shadowMapSize: 2048,
    },
    {
      name: 'Night Interior',
      environment: 'night-city',
      ambientIntensity: 0.2,
      directionalIntensity: 0.3,
      directionalColor: '#8A9BFF',
      directionalPosition: { x: 0, y: 10, z: 0 },
      shadows: true,
      shadowMapSize: 1024,
    },
    {
      name: 'Overcast',
      environment: 'overcast-sky',
      ambientIntensity: 0.6,
      directionalIntensity: 0.4,
      directionalColor: '#E8E8E8',
      directionalPosition: { x: 0, y: 20, z: 0 },
      shadows: true,
      shadowMapSize: 1024,
    },
  ];

  private constructor() {}

  static getInstance(): HDRIManager {
    if (!HDRIManager.instance) {
      HDRIManager.instance = new HDRIManager();
    }
    return HDRIManager.instance;
  }

  /**
   * Initialize HDRI manager with renderer and scene
   */
  initialize(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
    this.renderer = renderer;
    this.scene = scene;

    // Setup PMREM generator for HDRI processing
    this.pmremGenerator = new (THREE as any).PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();

    // Set default environment
    this.setDefaultEnvironment();
  }

  /**
   * Load and apply HDRI environment
   */
  async loadHDRI(hdriId: string, config?: Partial<HDRIConfig>): Promise<boolean> {
    if (!this.renderer || !this.scene) {
      console.error('HDRIManager not initialized');
      return false;
    }

    const hdri = this.hdriLibrary.find(h => h.id === hdriId);
    if (!hdri) {
      console.error(`HDRI not found: ${hdriId}`);
      return false;
    }

    try {
      const loader = new RGBELoader();
      loader.setDataType(THREE.HalfFloatType);

      const texture = await new Promise<THREE.DataTexture>((resolve, reject) => {
        loader.load(hdri.url, resolve, undefined, reject);
      });

      // Process HDRI with PMREM
      const envMap = this.pmremGenerator!.fromEquirectangular(texture).texture;

      // Apply to scene
      this.scene.environment = envMap;
      
      // Optional: Apply as background (can be disabled for transparent rendering)
      // this.scene.background = envMap;

      // Store current
      if (this.currentEnvironment) {
        this.currentEnvironment.dispose();
      }
      this.currentEnvironment = envMap;

      // Apply configuration
      const finalConfig = { ...this.currentConfig, ...config };
      this.applyConfig(finalConfig);

      // Dispose original texture (PMREM creates a new one)
      texture.dispose();

      return true;

    } catch (error) {
      console.error('Failed to load HDRI:', error);
      return false;
    }
  }

  /**
   * Apply HDRI configuration
   */
  private applyConfig(config: HDRIConfig): void {
    if (!this.scene) return;

    // Update environment intensity
    if (this.scene.environment) {
      // @ts-ignore - intensity property exists on newer Three.js versions
      this.scene.environmentIntensity = config.intensity;
    }

    // Update rotation if needed
    if (config.rotation !== 0 && this.scene.environment) {
      // Rotation would require reprocessing the HDRI
      // For now, we apply rotation to scene or lights
    }

    this.currentConfig = config;
  }

  /**
   * Set HDRI intensity
   */
  setIntensity(intensity: number): void {
    this.applyConfig({ ...this.currentConfig, intensity });
  }

  /**
   * Set default environment (fallback)
   */
  private setDefaultEnvironment(): void {
    if (!this.scene) return;

    // Create a simple cube environment as fallback
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    
    // Create a simple gradient environment
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E0F6FF');
    gradient.addColorStop(1, '#FFFFFF');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    if (this.pmremGenerator) {
      this.scene.environment = this.pmremGenerator.fromEquirectangular(texture).texture;
    }

    texture.dispose();
  }

  /**
   * Apply lighting preset
   */
  applyPreset(presetName: string): boolean {
    const preset = this.lightingPresets.find(p => p.name === presetName);
    if (!preset) return false;

    // Load HDRI environment
    this.loadHDRI(preset.environment, { intensity: preset.ambientIntensity });

    // Setup directional light
    this.setupDirectionalLight(preset);

    return true;
  }

  /**
   * Setup directional light from preset
   */
  private setupDirectionalLight(preset: LightingPreset): void {
    if (!this.scene) return;

    // Remove existing directional light
    const existingLight = this.scene.getObjectByName('main-directional-light');
    if (existingLight) {
      this.scene.remove(existingLight);
    }

    // Create new directional light
    const light = new THREE.DirectionalLight(
      preset.directionalColor,
      preset.directionalIntensity
    );
    light.name = 'main-directional-light';
    light.position.set(
      preset.directionalPosition.x,
      preset.directionalPosition.y,
      preset.directionalPosition.z
    );

    if (preset.shadows) {
      light.castShadow = true;
      light.shadow.mapSize.width = preset.shadowMapSize;
      light.shadow.mapSize.height = preset.shadowMapSize;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 50;
      light.shadow.camera.left = -20;
      light.shadow.camera.right = 20;
      light.shadow.camera.top = 20;
      light.shadow.camera.bottom = -20;
      light.shadow.bias = -0.0005;
    }

    this.scene.add(light);
  }

  /**
   * Get all available HDRIs
   */
  getAvailableHDRIs(): HDRIEnvironment[] {
    return [...this.hdriLibrary];
  }

  /**
   * Get HDRIs by category
   */
  getHDRIsByCategory(category: HDRIEnvironment['category']): HDRIEnvironment[] {
    return this.hdriLibrary.filter(h => h.category === category);
  }

  /**
   * Get all lighting presets
   */
  getLightingPresets(): LightingPreset[] {
    return [...this.lightingPresets];
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): HDRIConfig {
    return { ...this.currentConfig };
  }

  /**
   * Update HDRI configuration
   */
  updateConfig(config: Partial<HDRIConfig>): void {
    this.applyConfig({ ...this.currentConfig, ...config });
  }

  /**
   * Create custom lighting setup
   */
  createCustomLighting(config: {
    ambientColor?: string;
    ambientIntensity?: number;
    directionalColor?: string;
    directionalIntensity?: number;
    directionalPosition?: { x: number; y: number; z: number };
    fillLight?: boolean;
    rimLight?: boolean;
  }): void {
    if (!this.scene) return;

    // Clear existing lights
    this.scene.children
      .filter(child => child instanceof THREE.Light)
      .forEach(light => this.scene!.remove(light));

    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      config.ambientColor || '#404040',
      config.ambientIntensity || 0.5
    );
    this.scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(
      config.directionalColor || '#FFFFFF',
      config.directionalIntensity || 1.0
    );
    const pos = config.directionalPosition || { x: 10, y: 20, z: 10 };
    mainLight.position.set(pos.x, pos.y, pos.z);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // Fill light (optional)
    if (config.fillLight) {
      const fillLight = new THREE.DirectionalLight('#B0C4DE', 0.3);
      fillLight.position.set(-10, 10, -5);
      this.scene.add(fillLight);
    }

    // Rim light (optional)
    if (config.rimLight) {
      const rimLight = new THREE.SpotLight('#FFFFFF', 0.5);
      rimLight.position.set(0, 15, -15);
      rimLight.lookAt(0, 0, 0);
      this.scene.add(rimLight);
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.currentEnvironment) {
      this.currentEnvironment.dispose();
    }
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
    this.renderer = null;
    this.scene = null;
  }
}

// Export singleton
export const hdriManager = HDRIManager.getInstance();
