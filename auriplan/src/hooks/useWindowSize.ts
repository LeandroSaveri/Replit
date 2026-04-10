import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook para obter o tamanho da janela
 * @returns Objeto com width e height
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Definir valor inicial
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}

/**
 * Hook para obter a largura da janela
 * @returns Largura da janela
 */
export function useWindowWidth(): number {
  const { width } = useWindowSize();
  return width;
}

/**
 * Hook para obter a altura da janela
 * @returns Altura da janela
 */
export function useWindowHeight(): number {
  const { height } = useWindowSize();
  return height;
}

/**
 * Hook para obter a proporção da janela
 * @returns Proporção (width / height)
 */
export function useWindowAspectRatio(): number {
  const { width, height } = useWindowSize();
  return height > 0 ? width / height : 0;
}

/**
 * Hook para detectar orientação da tela
 * @returns 'portrait' ou 'landscape'
 */
export function useScreenOrientation(): 'portrait' | 'landscape' {
  const { width, height } = useWindowSize();
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Hook para detectar se a tela é pequena
 * @returns Boolean
 */
export function useIsSmallScreen(): boolean {
  const { width } = useWindowSize();
  return width < 640;
}

/**
 * Hook para detectar se a tela é média
 * @returns Boolean
 */
export function useIsMediumScreen(): boolean {
  const { width } = useWindowSize();
  return width >= 640 && width < 1024;
}

/**
 * Hook para detectar se a tela é grande
 * @returns Boolean
 */
export function useIsLargeScreen(): boolean {
  const { width } = useWindowSize();
  return width >= 1024;
}
