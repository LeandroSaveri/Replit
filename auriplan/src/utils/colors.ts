/**
 * Utilitários para manipulação de cores
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

/**
 * Converte hex para RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converte RGB para hex
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Converte RGB para HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Converte HSL para RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Converte RGB para HSV
 */
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

/**
 * Converte HSV para RGB
 */
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  let r = 0;
  let g = 0;
  let b = 0;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Ajusta o brilho de uma cor
 */
export function adjustBrightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Ajusta a saturação de uma cor
 */
export function adjustSaturation(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb);
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Ajusta o matiz de uma cor
 */
export function adjustHue(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb);
  hsl.h = (hsl.h + amount) % 360;
  if (hsl.h < 0) hsl.h += 360;
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Escurece uma cor
 */
export function darken(hex: string, amount: number = 10): string {
  return adjustBrightness(hex, -amount);
}

/**
 * Clareia uma cor
 */
export function lighten(hex: string, amount: number = 10): string {
  return adjustBrightness(hex, amount);
}

/**
 * Desatura uma cor
 */
export function desaturate(hex: string, amount: number = 10): string {
  return adjustSaturation(hex, -amount);
}

/**
 * Saturar uma cor
 */
export function saturate(hex: string, amount: number = 10): string {
  return adjustSaturation(hex, amount);
}

/**
 * Inverte uma cor
 */
export function invert(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  return rgbToHex({
    r: 255 - rgb.r,
    g: 255 - rgb.g,
    b: 255 - rgb.b,
  });
}

/**
 * Obtém a cor complementar
 */
export function complement(hex: string): string {
  return adjustHue(hex, 180);
}

/**
 * Gera uma paleta de cores análogas
 */
export function analogousPalette(hex: string, count: number = 3): string[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [hex];

  const hsl = rgbToHsl(rgb);
  const palette: string[] = [hex];

  const step = 30;
  for (let i = 1; i <= Math.floor((count - 1) / 2); i++) {
    const h1 = (hsl.h + i * step) % 360;
    const h2 = (hsl.h - i * step + 360) % 360;
    palette.push(rgbToHex(hslToRgb({ ...hsl, h: h1 })));
    palette.push(rgbToHex(hslToRgb({ ...hsl, h: h2 })));
  }

  return palette.slice(0, count);
}

/**
 * Gera uma paleta de cores triádicas
 */
export function triadicPalette(hex: string): string[] {
  return [hex, adjustHue(hex, 120), adjustHue(hex, 240)];
}

/**
 * Gera uma paleta de cores split-complementares
 */
export function splitComplementaryPalette(hex: string): string[] {
  return [hex, adjustHue(hex, 150), adjustHue(hex, 210)];
}

/**
 * Gera uma paleta de cores tetradic
 */
export function tetradicPalette(hex: string): string[] {
  return [hex, adjustHue(hex, 90), adjustHue(hex, 180), adjustHue(hex, 270)];
}

/**
 * Gera uma paleta de tons monocromáticos
 */
export function monochromaticPalette(hex: string, count: number = 5): string[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [hex];

  const hsl = rgbToHsl(rgb);
  const palette: string[] = [];

  const step = 100 / (count + 1);
  for (let i = 1; i <= count; i++) {
    palette.push(rgbToHex(hslToRgb({ ...hsl, l: i * step })));
  }

  return palette;
}

/**
 * Gera uma paleta de cores em degradê
 */
export function gradientPalette(
  startHex: string,
  endHex: string,
  steps: number
): string[] {
  const startRgb = hexToRgb(startHex);
  const endRgb = hexToRgb(endHex);
  if (!startRgb || !endRgb) return [startHex, endHex];

  const palette: string[] = [startHex];

  for (let i = 1; i < steps - 1; i++) {
    const t = i / (steps - 1);
    const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * t);
    const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * t);
    const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * t);
    palette.push(rgbToHex({ r, g, b }));
  }

  palette.push(endHex);
  return palette;
}

/**
 * Calcula o contraste entre duas cores
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;

  const luminance1 = getLuminance(rgb1);
  const luminance2 = getLuminance(rgb2);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calcula a luminância de uma cor
 */
export function getLuminance(rgb: RGB): number {
  const toLinear = (n: number) => {
    const normalized = n / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

/**
 * Verifica se uma cor é clara
 */
export function isLight(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  return getLuminance(rgb) > 0.5;
}

/**
 * Verifica se uma cor é escura
 */
export function isDark(hex: string): boolean {
  return !isLight(hex);
}

/**
 * Obtém a cor de texto ideal para contraste
 */
export function getContrastText(hex: string): string {
  return isLight(hex) ? '#000000' : '#FFFFFF';
}

/**
 * Converte RGB para string CSS
 */
export function rgbToCssString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Converte RGBA para string CSS
 */
export function rgbaToCssString(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

/**
 * Converte HSL para string CSS
 */
export function hslToCssString(hsl: HSL): string {
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
}

/**
 * Gera uma cor aleatória
 */
export function randomColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return rgbToHex({ r, g, b });
}

/**
 * Gera uma cor aleatória dentro de um intervalo de matiz
 */
export function randomColorInHueRange(minHue: number, maxHue: number): string {
  const h = minHue + Math.random() * (maxHue - minHue);
  const s = 50 + Math.random() * 50;
  const l = 40 + Math.random() * 40;
  return rgbToHex(hslToRgb({ h, s, l }));
}

/**
 * Valida se uma string é um hex válido
 */
export function isValidHex(hex: string): boolean {
  return /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex);
}

/**
 * Normaliza um hex para formato completo
 */
export function normalizeHex(hex: string): string {
  if (!isValidHex(hex)) return '#000000';
  
  hex = hex.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  return '#' + hex.toLowerCase();
}
