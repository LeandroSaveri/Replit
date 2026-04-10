/**
 * Render3D Component for AuriPlan
 * React wrapper for the 3D rendering engine
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import Render3DEngine from './Render3DEngine';
import { modelLoader } from '../../services/assets/ModelLoader';
import { textureLoader } from '../../services/assets/TextureLoader';

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Render3DEngine | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fps, setFps] = useState(0);

  // Initialize 3D engine
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

      // Start FPS monitoring
      const fpsInterval = setInterval(() => {
        const stats = engine.getStats();
        setFps(stats.fps);
      }, 1000);

      // Start render loop
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
      return;
    }
  }, [width, height, antialias, shadows, backgroundColor, onLoad, onError]);

  // Handle object selection
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

    const intersects = raycaster.intersectObjects(
      engineRef.current.scene.children,
      true
    );

    if (intersects.length > 0) {
      onObjectSelect?.(intersects[0].object);
    } else {
      onObjectDeselect?.();
    }
  }, [onObjectSelect, onObjectDeselect]);

  // Add object to scene
  const addObject = useCallback(async (modelId: string, options?: {
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: number;
  }) => {
    if (!engineRef.current) return;

    try {
      const model = await modelLoader.loadModel(modelId, {
        position: options?.position,
        rotation: options?.rotation,
        scale: options?.scale,
        castShadow: true,
        receiveShadow: true,
      });

      engineRef.current.addObject(model.scene);
      return model;
    } catch (error) {
      console.error('Error adding object:', error);
      throw error;
    }
  }, []);

  // Remove object from scene
  const removeObject = useCallback((object: THREE.Object3D) => {
    if (!engineRef.current) return;
    engineRef.current.removeObject(object);
  }, []);

  // Set camera position
  const setCameraPosition = useCallback((x: number, y: number, z: number) => {
    if (!engineRef.current) return;
    engineRef.current.setCameraPosition(x, y, z);
  }, []);

  // Look at target
  const lookAt = useCallback((x: number, y: number, z: number) => {
    if (!engineRef.current) return;
    engineRef.current.lookAt(x, y, z);
  }, []);

  // Export scene as image
  const exportImage = useCallback((): string => {
    if (!engineRef.current) return '';
    return engineRef.current.renderer.domElement.toDataURL('image/png');
  }, []);

  // Get performance stats
  const getStats = useCallback(() => {
    if (!engineRef.current) return { fps: 0, drawCalls: 0, triangles: 0 };
    return engineRef.current.getStats();
  }, []);

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleClick}
      />
      
      {/* FPS Counter */}
      {isLoaded && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          FPS: {fps}
        </div>
      )}
      
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
};

export default Render3D;
