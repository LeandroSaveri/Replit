// ============================================================
// CAMINHO: src/features/editor/components/Canvas3D.tsx
// FUNÇÃO: Superfície 3D integrada com ToolManager (seleção/arraste)
// ============================================================

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Render3D, Render3DHandle } from '@engine/render3d/Render3D';
import { useEditorStore, selectCurrentScene } from '@store/editorStore';
import { useToolContext } from '../handlers/ToolContext';
import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { Vec2 } from '@auriplan-types';
import * as THREE from 'three';

export const Canvas3D: React.FC<{ width?: number; height?: number; className?: string }> = ({
  width, height, className = ''
}) => {
  const currentScene = useEditorStore(selectCurrentScene);
  const sceneData = currentScene ? {
    walls: currentScene.walls,
    rooms: currentScene.rooms,
    doors: currentScene.doors,
    windows: currentScene.windows,
    furniture: currentScene.furniture,
  } : undefined;

  const render3DRef = useRef<Render3DHandle>(null);
  const { toolManager, activeTool } = useToolContext();
  const store = useEditorStore();

  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<Vec2 | null>(null);

  // Converte coordenadas de tela para Vec2 usando raycast no chão
  const screenToWorld = useCallback((clientX: number, clientY: number): Vec2 | null => {
    if (!render3DRef.current) return null;
    return render3DRef.current.raycastGround(clientX, clientY);
  }, []);

  // Cria InteractionEvent a partir de evento DOM
  const createInteractionEvent = useCallback((
    type: InteractionEvent['type'],
    worldPos: Vec2,
    nativeEvent: React.MouseEvent
  ): InteractionEvent => {
    const modifiers: any[] = [];
    if (nativeEvent.shiftKey) modifiers.push('shift');
    if (nativeEvent.ctrlKey) modifiers.push('ctrl');
    if (nativeEvent.altKey) modifiers.push('alt');
    if (nativeEvent.metaKey) modifiers.push('meta');
    return { type, position: worldPos, modifiers };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'select') return;
    const worldPos = screenToWorld(e.clientX, e.clientY);
    if (!worldPos) return;
    const event = createInteractionEvent('mousedown', worldPos, e);
    toolManager.handleEvent(event);
    setIsDragging(true);
    dragStartPos.current = worldPos;
    e.preventDefault();
    e.stopPropagation();
  }, [activeTool, screenToWorld, createInteractionEvent, toolManager]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || activeTool !== 'select') return;
    const worldPos = screenToWorld(e.clientX, e.clientY);
    if (!worldPos) return;
    const event = createInteractionEvent('mousemove', worldPos, e);
    toolManager.handleEvent(event);
    e.preventDefault();
    e.stopPropagation();
  }, [isDragging, activeTool, screenToWorld, createInteractionEvent, toolManager]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || activeTool !== 'select') return;
    const worldPos = screenToWorld(e.clientX, e.clientY);
    if (!worldPos) return;
    const event = createInteractionEvent('mouseup', worldPos, e);
    toolManager.handleEvent(event);
    setIsDragging(false);
    dragStartPos.current = null;
    e.preventDefault();
    e.stopPropagation();
  }, [isDragging, activeTool, screenToWorld, createInteractionEvent, toolManager]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'select') return;
    const worldPos = screenToWorld(e.clientX, e.clientY);
    if (!worldPos) return;
    const event = createInteractionEvent('dblclick', worldPos, e);
    toolManager.handleEvent(event);
    e.preventDefault();
    e.stopPropagation();
  }, [activeTool, screenToWorld, createInteractionEvent, toolManager]);

  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: '400px' }}>
      <Render3D
        ref={render3DRef}
        width={width ?? 0}
        height={height ?? 0}
        shadows
        antialias
        sceneData={sceneData}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        enableOrbitControls={activeTool !== 'select' || !isDragging}
      />
    </div>
  );
};
