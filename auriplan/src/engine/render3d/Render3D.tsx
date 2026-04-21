// ============================================================
// CAMINHO: src/engine/render3d/Render3D.tsx
// FUNÇÃO: Componente público de renderização 3D com suporte a raycast
// ============================================================

import React, { useEffect, useRef, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import Render3DEngine from './Render3DEngine';

export interface Render3DHandle {
  raycastGround: (clientX: number, clientY: number) => [number, number] | null;
}

export interface Render3DProps {
  width: number;
  height: number;
  className?: string;
  antialias?: boolean;
  shadows?: boolean;
  sceneData?: any;
  enableOrbitControls?: boolean;
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export const Render3D = forwardRef<Render3DHandle, Render3DProps>(({
  width, height, className = '', antialias = true, shadows = true,
  sceneData, enableOrbitControls = true,
  onMouseDown, onMouseMove, onMouseUp, onDoubleClick,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Render3DEngine | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fps, setFps] = useState(0);

  useImperativeHandle(ref, () => ({
    raycastGround: (clientX: number, clientY: number) => {
      if (!engineRef.current || !canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return engineRef.current.raycastGround(x, y);
    }
  }), []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Render3DEngine({
      canvas: canvasRef.current,
      width: width || 800,
      height: height || 600,
      antialias,
      shadows,
    });

    engineRef.current = engine;

    const fpsInterval = setInterval(() => {
      setFps(engine.getStats().fps);
    }, 1000);

    engine.startRenderLoop();
    setIsLoaded(true);

    return () => {
      clearInterval(fpsInterval);
      engine.dispose();
      engineRef.current = null;
    };
  }, [width, height, antialias, shadows]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (engineRef.current && w > 0 && h > 0) {
          engineRef.current.resize(w, h);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (engineRef.current && sceneData) {
      engineRef.current.syncScene(sceneData);
    }
  }, [sceneData]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setControlsEnabled(enableOrbitControls);
    }
  }, [enableOrbitControls]);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width: width || '100%', height: height || '100%', minHeight: '400px' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ userSelect: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClick}
      />
      {isLoaded && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          FPS: {fps}
        </div>
      )}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
});

export default Render3D;
