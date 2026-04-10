/**
 * CDN Configuration for AuriPlan
 * Manages asset loading from cloud storage
 */

export interface CDNConfig {
  baseUrl: string;
  modelsPath: string;
  texturesPath: string;
  materialsPath: string;
  thumbnailsPath: string;
  cacheEnabled: boolean;
  cacheDuration: number; // in hours
  fallbackToLocal: boolean;
}

// Default CDN configuration
export const defaultCDNConfig: CDNConfig = {
  baseUrl: import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.auriplan.com',
  modelsPath: '/models/v1',
  texturesPath: '/textures/v1',
  materialsPath: '/materials/v1',
  thumbnailsPath: '/thumbnails/v1',
  cacheEnabled: true,
  cacheDuration: 24, // 24 hours
  fallbackToLocal: true,
};

// Environment-specific configurations
export const cdnConfigs: Record<string, CDNConfig> = {
  development: {
    ...defaultCDNConfig,
    baseUrl: import.meta.env.VITE_CDN_BASE_URL || 'http://localhost:3001/assets',
    cacheEnabled: false,
  },
  staging: {
    ...defaultCDNConfig,
    baseUrl: 'https://cdn-staging.auriplan.com',
  },
  production: {
    ...defaultCDNConfig,
    baseUrl: 'https://cdn.auriplan.com',
  },
};

// Get current environment config
export function getCDNConfig(): CDNConfig {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  return cdnConfigs[env] || cdnConfigs.development;
}

// URL builders
export function getModelUrl(modelId: string, config: CDNConfig = getCDNConfig()): string {
  return `${config.baseUrl}${config.modelsPath}/${modelId}.glb`;
}

export function getTextureUrl(textureId: string, config: CDNConfig = getCDNConfig()): string {
  return `${config.baseUrl}${config.texturesPath}/${textureId}.jpg`;
}

export function getMaterialUrl(materialId: string, config: CDNConfig = getCDNConfig()): string {
  return `${config.baseUrl}${config.materialsPath}/${materialId}.json`;
}

export function getThumbnailUrl(thumbnailId: string, config: CDNConfig = getCDNConfig()): string {
  return `${config.baseUrl}${config.thumbnailsPath}/${thumbnailId}.png`;
}

export default getCDNConfig;
