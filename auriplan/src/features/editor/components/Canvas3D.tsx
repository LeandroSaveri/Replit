/**
 * Canvas3D Component
 * Superfície de visualização 3D que consome a API pública Render3D
 */

import React from 'react';
import { Render3D } from '@engine/render3d/Render3D';
import { useEditorStore, selectCurrentScene } from '@store/editorStore';

export interface Canvas3DProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Canvas3D: React.FC<Canvas3DProps> = ({
  width,
  height,
  className = '',
}) => {
  const currentScene = useEditorStore(selectCurrentScene);

  const sceneData = currentScene ? {
    walls: currentScene.walls,
    rooms: currentScene.rooms,
    doors: currentScene.doors,
    windows: currentScene.windows,
    furniture: currentScene.furniture,
  } : undefined;

  const containerStyle = width && height
    ? { width, height }
    : { width: '100%', height: '100%', minHeight: '400px' };

  return (
    <div className={`w-full h-full ${className}`} style={containerStyle}>
      <Render3D
        width={width ?? 0}
        height={height ?? 0}
        className="w-full h-full"
        shadows
        antialias
        sceneData={sceneData}
      />
    </div>
  );
};

export default Canvas3D;
