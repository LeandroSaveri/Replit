import { useState, useEffect } from 'react';

/**
 * Hook para detectar media queries
 * @param query - Media query string
 * @returns Boolean indicando se a media query corresponde
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Adicionar listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Definir valor inicial
    setMatches(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// Hooks pré-definidos para breakpoints comuns
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

export function useIsExtraLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1536px)');
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)');
}

export function useHoverCapability(): boolean {
  return useMediaQuery('(hover: hover)');
}

export function usePointerType(): 'none' | 'coarse' | 'fine' {
  const isNone = useMediaQuery('(pointer: none)');
  const isCoarse = useMediaQuery('(pointer: coarse)');
  
  if (isNone) return 'none';
  if (isCoarse) return 'coarse';
  return 'fine';
}
