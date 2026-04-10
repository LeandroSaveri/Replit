import { useState, useEffect, useRef, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook para Intersection Observer
 * @param options - Opções do Intersection Observer
 * @returns [ref, isIntersecting, entry]
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T | null>, boolean, IntersectionObserverEntry | null] {
  const { threshold = 0, root = null, rootMargin = '0px', triggerOnce = false } = options;
  
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setEntry(observerEntry);
        setIsIntersecting(observerEntry.isIntersecting);
        
        if (triggerOnce && observerEntry.isIntersecting) {
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return [ref, isIntersecting, entry];
}

/**
 * Hook para lazy loading de imagens
 * @returns [ref, isVisible]
 */
export function useLazyImage<T extends HTMLImageElement = HTMLImageElement>(): [
  RefObject<T | null>,
  boolean
] {
  const [ref, isVisible] = useIntersectionObserver<T>({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
  });

  return [ref, isVisible];
}

/**
 * Hook para animação ao scroll
 * @returns [ref, isInView]
 */
export function useScrollAnimation<T extends Element = HTMLDivElement>(): [
  RefObject<T | null>,
  boolean
] {
  const [ref, isInView] = useIntersectionObserver<T>({
    threshold: 0.2,
    triggerOnce: true,
  });

  return [ref, isInView];
}

/**
 * Hook para infinite scroll
 * @param callback - Função a ser chamada quando chegar ao final
 * @param hasMore - Se há mais itens para carregar
 * @returns ref
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>(
  callback: () => void,
  hasMore: boolean
): RefObject<T | null> {
  const [ref, isIntersecting] = useIntersectionObserver<T>({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (isIntersecting && hasMore) {
      callback();
    }
  }, [isIntersecting, hasMore, callback]);

  return ref;
}
