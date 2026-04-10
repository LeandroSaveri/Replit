/**
 * Lighting Manager for AuriPlan
 * Manages all lighting in the scene with realistic illumination
 */

import * as THREE from 'three';

export interface LightConfig {
  type: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere';
  intensity: number;
  color: string;
  position?: { x: number; y: number; z: number };
  target?: { x: number; y: number; z: number };
  castShadow?: boolean;
  shadowMapSize?: number;
}

export interface EnvironmentConfig {
  ambientIntensity: number;
  sunIntensity: number;
  sunPosition: { x: number; y: number; z: number };
  skyColor: string;
  groundColor: string;
}

export class LightingManager {
  private scene: THREE.Scene;
  private lights = new Map<string, THREE.Light>();
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private hemisphereLight: THREE.HemisphereLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Initialize default lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);

    this.setupDefaultLighting();
  }

  /**
   * Setup default lighting configuration
   */
  private setupDefaultLighting(): void {
    // Ambient light
    this.ambientLight.name = 'ambient';
    this.scene.add(this.ambientLight);
    this.lights.set('ambient', this.ambientLight);

    // Sun light (main directional)
    this.sunLight.position.set(10, 20, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 50;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.name = 'sun';
    this.scene.add(this.sunLight);
    this.lights.set('sun', this.sunLight);

    // Fill light
    this.fillLight.position.set(-10, 10, -10);
    this.fillLight.name = 'fill';
    this.scene.add(this.fillLight);
    this.lights.set('fill', this.fillLight);

    // Hemisphere light for ambient occlusion simulation
    this.hemisphereLight.position.set(0, 20, 0);
    this.hemisphereLight.name = 'hemisphere';
    this.scene.add(this.hemisphereLight);
    this.lights.set('hemisphere', this.hemisphereLight);
  }

  /**
   * Add a custom light
   */
  addLight(id: string, config: LightConfig): THREE.Light {
    let light: THREE.Light;

    switch (config.type) {
      case 'ambient':
        light = new THREE.AmbientLight(
          new THREE.Color(config.color),
          config.intensity
        );
        break;
      case 'directional':
        light = new THREE.DirectionalLight(
          new THREE.Color(config.color),
          config.intensity
        );
        if (config.position) {
          light.position.set(config.position.x, config.position.y, config.position.z);
        }
        if (config.castShadow) {
          light.castShadow = true;
          if (config.shadowMapSize) {
            if (light.shadow) light.shadow.mapSize.width = config.shadowMapSize!;
            if (light.shadow) light.shadow.mapSize.height = config.shadowMapSize!;
          }
        }
        break;
      case 'point':
        light = new THREE.PointLight(
          new THREE.Color(config.color),
          config.intensity,
          100
        );
        if (config.position) {
          light.position.set(config.position.x, config.position.y, config.position.z);
        }
        if (config.castShadow) {
          light.castShadow = true;
        }
        break;
      case 'spot':
        light = new THREE.SpotLight(
          new THREE.Color(config.color),
          config.intensity
        );
        if (config.position) {
          light.position.set(config.position.x, config.position.y, config.position.z);
        }
        if (config.target) {
          (light as THREE.SpotLight).target.position.set(
            config.target.x,
            config.target.y,
            config.target.z
          );
        }
        if (config.castShadow) {
          light.castShadow = true;
        }
        break;
      case 'hemisphere':
        light = new THREE.HemisphereLight(
          new THREE.Color(config.color),
          new THREE.Color(0x444444),
          config.intensity
        );
        break;
      default:
        throw new Error(`Unknown light type: ${config.type}`);
    }

    light.name = id;
    this.scene.add(light);
    this.lights.set(id, light);

    return light;
  }

  /**
   * Remove a light
   */
  removeLight(id: string): void {
    const light = this.lights.get(id);
    if (light) {
      this.scene.remove(light);
      this.lights.delete(id);
    }
  }

  /**
   * Get a light by ID
   */
  getLight(id: string): THREE.Light | undefined {
    return this.lights.get(id);
  }

  /**
   * Update sun position for time of day simulation
   */
  setSunPosition(azimuth: number, elevation: number): void {
    const radius = 20;
    const phi = (90 - elevation) * (Math.PI / 180);
    const theta = (azimuth + 180) * (Math.PI / 180);

    this.sunLight.position.x = radius * Math.sin(phi) * Math.cos(theta);
    this.sunLight.position.y = radius * Math.cos(phi);
    this.sunLight.position.z = radius * Math.sin(phi) * Math.sin(theta);

    // Adjust intensity based on elevation
    const intensity = Math.max(0, Math.sin(elevation * (Math.PI / 180)));
    this.sunLight.intensity = intensity;

    // Adjust color temperature based on elevation
    if (elevation < 10) {
      // Sunrise/sunset - warmer
      this.sunLight.color.setHSL(0.08, 1, 0.6);
    } else if (elevation > 60) {
      // Midday - cooler
      this.sunLight.color.setHSL(0.6, 0.3, 0.95);
    } else {
      // Normal
      this.sunLight.color.setHSL(0.1, 0.1, 1);
    }
  }

  /**
   * Set ambient light intensity
   */
  setAmbientIntensity(intensity: number): void {
    this.ambientLight.intensity = intensity;
  }

  /**
   * Set environment configuration
   */
  setEnvironment(config: EnvironmentConfig): void {
    this.ambientLight.intensity = config.ambientIntensity;
    this.sunLight.intensity = config.sunIntensity;
    this.sunLight.position.set(
      config.sunPosition.x,
      config.sunPosition.y,
      config.sunPosition.z
    );
    this.hemisphereLight.color.set(config.skyColor);
    this.hemisphereLight.groundColor.set(config.groundColor);
  }

  /**
   * Enable/disable shadows globally
   */
  setShadowsEnabled(enabled: boolean): void {
    this.sunLight.castShadow = enabled;
    this.lights.forEach(light => {
      if (light.castShadow !== undefined) {
        light.castShadow = enabled;
      }
    });
  }

  /**
   * Set shadow map size
   */
  setShadowMapSize(size: number): void {
    this.sunLight.shadow.mapSize.width = size;
    this.sunLight.shadow.mapSize.height = size;
    this.sunLight.shadow.needsUpdate = true;
  }

  /**
   * Get all lights
   */
  getAllLights(): THREE.Light[] {
    return Array.from(this.lights.values());
  }

  /**
   * Get lighting statistics
   */
  getStats(): {
    totalLights: number;
    shadowCasters: number;
    ambientIntensity: number;
    sunIntensity: number;
  } {
    let shadowCasters = 0;
    this.lights.forEach(light => {
      if (light.castShadow) shadowCasters++;
    });

    return {
      totalLights: this.lights.size,
      shadowCasters,
      ambientIntensity: this.ambientLight.intensity,
      sunIntensity: this.sunLight.intensity,
    };
  }

  /**
   * Dispose all lights
   */
  dispose(): void {
    this.lights.forEach(light => {
      this.scene.remove(light);
    });
    this.lights.clear();
  }
}

export default LightingManager;
