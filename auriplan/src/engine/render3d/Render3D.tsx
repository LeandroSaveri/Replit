/**
 * Render3D Component for AuriPlan
 * React wrapper for the 3D rendering engine (public API)
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import Render3DEngine from './Render3DEngine';

export interface Render3DProps {
  width: number;
  height: number;
  className?: string;
  antialias?: boolean;
  shadows?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onObjectSelect?: (object: THREE.Object3D) => void;
  onObjectDeselect?: () => void;
  backgroundColor?: string;
  sceneData?: {
    walls: any[];
    rooms: any[];
    doors: any[];
    windows: any[];
    furniture: any[];
  };
}

export const Render3D: React.FC<Render3DProps> = ({
  width,
  height,
  className = '',
  antialias = true,
  shadows = true,
  onLoad,
  onError,
  onObjectSelect,
  onObjectDeselect,
  backgroundColor = '#f5f5f5',
  sceneData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Render3DEngine | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const engine = new Render3DEngine({
        canvas: canvasRef.current,
        width,
        height,
        antialias,
        shadows,
      });

      engine.setBackgroundColor(backgroundColor);
      engineRef.current = engine;

      const fpsInterval = setInterval(() => {
        setFps(engine.getStats().fps);
      }, 1000);

      engine.startRenderLoop();
      setIsLoaded(true);
      onLoad?.();

      return () => {
        clearInterval(fpsInterval);
        engine.dispose();
        engineRef.current = null;
      };
    } catch (error) {
      onError?.(error as Error);
    }
  }, [width, height, antialias, shadows, backgroundColor, onLoad, onError]);

  useEffect(() => {
    if (engineRef.current && sceneData) {
      engineRef.current.syncScene(sceneData);
    }
  }, [sceneData]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, engineRef.current.camera);

    const intersects = raycaster.intersectObjects(engineRef.current.scene.children, true);
    if (intersects.length > 0) {
      onObjectSelect?.(intersects[0].object);
    } else {
      onObjectDeselect?.();
    }
  }, [onObjectSelect, onObjectDeselect]);

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleClick}
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
};

export default Render3D;
