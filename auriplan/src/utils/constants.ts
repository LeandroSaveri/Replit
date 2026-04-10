// ============================================
// CONSTANTS - Constantes da Aplicação
// ============================================

// App Info
export const APP_NAME = 'AuriPlan';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Professional Interior Design Tool';

// API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

// Grid Settings
export const DEFAULT_GRID_SIZE = 0.5;
export const DEFAULT_GRID_DIVISIONS = 10;
export const MIN_GRID_SIZE = 0.1;
export const MAX_GRID_SIZE = 2;

// Wall Settings
export const DEFAULT_WALL_HEIGHT = 2.8;
export const DEFAULT_WALL_THICKNESS = 0.15;
export const MIN_WALL_THICKNESS = 0.05;
export const MAX_WALL_THICKNESS = 0.5;

// Room Settings
export const DEFAULT_ROOM_HEIGHT = 2.8;
export const MIN_ROOM_HEIGHT = 2;
export const MAX_ROOM_HEIGHT = 5;

// Camera Settings
export const DEFAULT_CAMERA_ZOOM = 1;
export const MIN_CAMERA_ZOOM = 0.1;
export const MAX_CAMERA_ZOOM = 10;
export const CAMERA_ZOOM_STEP = 0.1;

// Snap Settings
export const SNAP_DISTANCE = 0.3;
export const SNAP_ANGLE_STEP = 15;

// History Settings
export const MAX_HISTORY_SIZE = 100;

// Export Settings
export const EXPORT_QUALITY = {
  low: 0.5,
  medium: 1,
  high: 2,
};

// Colors
export const COLORS = {
  // Primary
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  
  // Secondary
  secondary: '#8b5cf6',
  secondaryDark: '#7c3aed',
  secondaryLight: '#a78bfa',
  
  // Success
  success: '#22c55e',
  successDark: '#16a34a',
  successLight: '#4ade80',
  
  // Error
  error: '#ef4444',
  errorDark: '#dc2626',
  errorLight: '#f87171',
  
  // Warning
  warning: '#eab308',
  warningDark: '#ca8a04',
  warningLight: '#facc15',
  
  // Info
  info: '#3b82f6',
  infoDark: '#2563eb',
  infoLight: '#60a5fa',
  
  // Background
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  
  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
};

// Wall Colors
export const WALL_COLORS = [
  '#8B4513', // Saddle Brown
  '#D2691E', // Chocolate
  '#F5F5DC', // Beige
  '#4a5568', // Gray
  '#2F4F4F', // Dark Slate Gray
  '#228B22', // Forest Green
  '#1a1a1a', // Black
  '#ffffff', // White
];

// Floor Colors
export const FLOOR_COLORS = [
  '#CD853F', // Peru
  '#8B0000', // Dark Red
  '#191970', // Midnight Blue
  '#556B2F', // Dark Olive Green
  '#8B008B', // Dark Magenta
  '#FF6347', // Tomato
  '#4682B4', // Steel Blue
  '#DAA520', // Golden Rod
];

// Furniture Categories
export const FURNITURE_CATEGORIES = [
  { id: 'living', name: 'Living Room', icon: 'Sofa' },
  { id: 'bedroom', name: 'Bedroom', icon: 'Bed' },
  { id: 'kitchen', name: 'Kitchen', icon: 'Utensils' },
  { id: 'bathroom', name: 'Bathroom', icon: 'Bath' },
  { id: 'lighting', name: 'Lighting', icon: 'Lightbulb' },
  { id: 'decor', name: 'Decor', icon: 'Palette' },
  { id: 'office', name: 'Office', icon: 'Briefcase' },
  { id: 'appliances', name: 'Appliances', icon: 'Monitor' },
];

// Design Styles
export const DESIGN_STYLES = [
  { id: 'modern', name: 'Modern', description: 'Clean lines and minimalism' },
  { id: 'classic', name: 'Classic', description: 'Timeless elegance' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simplicity and functionality' },
  { id: 'industrial', name: 'Industrial', description: 'Metal and rustic wood' },
  { id: 'scandinavian', name: 'Scandinavian', description: 'Light and cozy' },
  { id: 'bohemian', name: 'Bohemian', description: 'Colorful and eclectic' },
  { id: 'luxury', name: 'Luxury', description: 'Premium materials' },
  { id: 'cozy', name: 'Cozy', description: 'Warm and inviting' },
];

// Units
export const UNITS = {
  metric: {
    name: 'Metric',
    length: 'm',
    area: 'm²',
    volume: 'm³',
  },
  imperial: {
    name: 'Imperial',
    length: 'ft',
    area: 'ft²',
    volume: 'ft³',
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  token: 'auriaplan_token',
  user: 'auriaplan_user',
  settings: 'auriaplan_settings',
  recentProjects: 'auriaplan_recent_projects',
  theme: 'auriaplan_theme',
  language: 'auriaplan_language',
};

// Feature Flags
export const FEATURES = {
  enableAI: import.meta.env.VITE_ENABLE_AI === 'true',
  enableCollaboration: import.meta.env.VITE_ENABLE_COLLABORATION === 'true',
  enableExport: import.meta.env.VITE_ENABLE_EXPORT !== 'false',
  enableSocialLogin: true,
  enablePayments: false,
};

// Subscription Plans
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '1 project',
      'Basic furniture',
      '2D view',
      'Export PNG',
    ],
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    features: [
      'Unlimited projects',
      'Full furniture catalog',
      '2D & 3D views',
      'All export formats',
      'AI design assistant',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 49.99,
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Custom furniture',
      'API access',
      'Dedicated support',
      'SSO',
    ],
  },
};
