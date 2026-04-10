// Render Worker - Offscreen rendering for thumbnails and previews

export interface RenderTask {
  id: string;
  type: 'thumbnail' | 'preview' | 'export';
  data: {
    floorPlan: any;
    width: number;
    height: number;
    quality?: number;
    view?: '2d' | '3d';
    camera?: {
      position: { x: number; y: number; z: number };
      target: { x: number; y: number; z: number };
    };
  };
}

export interface RenderResult {
  id: string;
  success: boolean;
  imageData?: ImageBitmap | Uint8ClampedArray;
  blob?: Blob;
  error?: string;
  executionTime: number;
}

// Canvas for rendering
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

// Initialize canvas
function initCanvas(width: number, height: number): void {
  canvas = new OffscreenCanvas(width, height);
  ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
}

// Render 2D floor plan
function render2D(floorPlan: any, width: number, height: number): ImageBitmap {
  if (!canvas || !ctx) {
    initCanvas(width, height);
  }

  if (!canvas || !ctx) {
    throw new Error('Canvas not initialized');
  }

  // Resize canvas if needed
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Calculate bounds
  const bounds = calculateBounds(floorPlan);
  const padding = 20;
  const scale = Math.min(
    (width - padding * 2) / bounds.width,
    (height - padding * 2) / bounds.height
  );

  const offsetX = (width - bounds.width * scale) / 2 - bounds.minX * scale;
  const offsetY = (height - bounds.height * scale) / 2 - bounds.minY * scale;

  // Draw grid
  drawGrid(ctx, width, height, scale, offsetX, offsetY);

  // Draw rooms
  if (floorPlan.rooms) {
    floorPlan.rooms.forEach((room: any) => {
      drawRoom(ctx!, room, scale, offsetX, offsetY);
    });
  }

  // Draw walls
  if (floorPlan.walls) {
    floorPlan.walls.forEach((wall: any) => {
      drawWall(ctx!, wall, scale, offsetX, offsetY);
    });
  }

  // Draw furniture
  if (floorPlan.furniture) {
    floorPlan.furniture.forEach((furniture: any) => {
      drawFurniture(ctx!, furniture, scale, offsetX, offsetY);
    });
  }

  // Draw dimensions
  if (floorPlan.dimensions) {
    floorPlan.dimensions.forEach((dimension: any) => {
      drawDimension(ctx!, dimension, scale, offsetX, offsetY);
    });
  }

  return canvas.transferToImageBitmap();
}

// Calculate bounds of floor plan
function calculateBounds(floorPlan: any): { minX: number; minY: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Check walls
  if (floorPlan.walls) {
    floorPlan.walls.forEach((wall: any) => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });
  }

  // Check rooms
  if (floorPlan.rooms) {
    floorPlan.rooms.forEach((room: any) => {
      if (room.points) {
        room.points.forEach((point: any) => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      }
    });
  }

  // Check furniture
  if (floorPlan.furniture) {
    floorPlan.furniture.forEach((furniture: any) => {
      const halfWidth = furniture.width / 2;
      const halfDepth = furniture.depth / 2;
      minX = Math.min(minX, furniture.position.x - halfWidth);
      minY = Math.min(minY, furniture.position.y - halfDepth);
      maxX = Math.max(maxX, furniture.position.x + halfWidth);
      maxY = Math.max(maxY, furniture.position.y + halfDepth);
    });
  }

  // Default bounds if empty
  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 10;
    maxY = 10;
  }

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// Draw grid
function drawGrid(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const gridSize = 1; // 1 meter grid
  const gridPixelSize = gridSize * scale;

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = offsetX % gridPixelSize; x < width; x += gridPixelSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = offsetY % gridPixelSize; y < height; y += gridPixelSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

// Draw room
function drawRoom(
  ctx: OffscreenCanvasRenderingContext2D,
  room: any,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  if (!room.points || room.points.length < 3) return;

  ctx.beginPath();
  ctx.moveTo(
    room.points[0].x * scale + offsetX,
    room.points[0].y * scale + offsetY
  );

  for (let i = 1; i < room.points.length; i++) {
    ctx.lineTo(
      room.points[i].x * scale + offsetX,
      room.points[i].y * scale + offsetY
    );
  }

  ctx.closePath();

  // Fill
  ctx.fillStyle = room.material?.color || '#f5f5f5';
  ctx.fill();

  // Stroke
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Room label
  if (room.name) {
    const center = calculatePolygonCenter(room.points);
    ctx.fillStyle = '#666666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      room.name,
      center.x * scale + offsetX,
      center.y * scale + offsetY
    );
  }
}

// Draw wall
function drawWall(
  ctx: OffscreenCanvasRenderingContext2D,
  wall: any,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const startX = wall.start.x * scale + offsetX;
  const startY = wall.start.y * scale + offsetY;
  const endX = wall.end.x * scale + offsetX;
  const endY = wall.end.y * scale + offsetY;

  const thickness = (wall.thickness || 0.15) * scale;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);

  ctx.strokeStyle = '#333333';
  ctx.lineWidth = Math.max(thickness, 2);
  ctx.lineCap = 'round';
  ctx.stroke();

  // Wall endpoints
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.arc(startX, startY, thickness / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(endX, endY, thickness / 2, 0, Math.PI * 2);
  ctx.fill();
}

// Draw furniture
function drawFurniture(
  ctx: OffscreenCanvasRenderingContext2D,
  furniture: any,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const x = furniture.position.x * scale + offsetX;
  const y = furniture.position.y * scale + offsetY;
  const width = furniture.width * scale;
  const depth = furniture.depth * scale;
  const rotation = furniture.rotation || 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-rotation);

  // Furniture body
  ctx.fillStyle = furniture.color || '#8b4513';
  ctx.fillRect(-width / 2, -depth / 2, width, depth);

  // Border
  ctx.strokeStyle = '#5a2d0c';
  ctx.lineWidth = 1;
  ctx.strokeRect(-width / 2, -depth / 2, width, depth);

  // Direction indicator
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width / 2, 0);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.restore();
}

// Draw dimension
function drawDimension(
  ctx: OffscreenCanvasRenderingContext2D,
  dimension: any,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const startX = dimension.start.x * scale + offsetX;
  const startY = dimension.start.y * scale + offsetY;
  const endX = dimension.end.x * scale + offsetX;
  const endY = dimension.end.y * scale + offsetY;

  // Dimension line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = '#4a90d9';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Extension lines
  const angle = Math.atan2(endY - startY, endX - startX);
  const extLength = 10;

  ctx.beginPath();
  ctx.moveTo(startX - Math.sin(angle) * extLength, startY + Math.cos(angle) * extLength);
  ctx.lineTo(startX + Math.sin(angle) * extLength, startY - Math.cos(angle) * extLength);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(endX - Math.sin(angle) * extLength, endY + Math.cos(angle) * extLength);
  ctx.lineTo(endX + Math.sin(angle) * extLength, endY - Math.cos(angle) * extLength);
  ctx.stroke();

  // Dimension text
  const distance = Math.sqrt(
    Math.pow(dimension.end.x - dimension.start.x, 2) +
    Math.pow(dimension.end.y - dimension.start.y, 2)
  );

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  ctx.fillStyle = '#4a90d9';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${distance.toFixed(2)}m`, midX, midY - 5);
}

// Calculate polygon center
function calculatePolygonCenter(points: any[]): { x: number; y: number } {
  let centerX = 0;
  let centerY = 0;

  for (const point of points) {
    centerX += point.x;
    centerY += point.y;
  }

  return {
    x: centerX / points.length,
    y: centerY / points.length
  };
}

// Export to different formats
async function exportImage(
  floorPlan: any,
  width: number,
  height: number,
  format: 'png' | 'jpeg' | 'webp',
  quality: number
): Promise<Blob> {
  const imageBitmap = render2D(floorPlan, width, height);

  if (!canvas) {
    throw new Error('Canvas not initialized');
  }

  // Draw the image bitmap to canvas
  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {
    throw new Error('Failed to get temp context');
  }

  tempCtx.drawImage(imageBitmap, 0, 0);

  // Convert to blob
  const blob = await tempCanvas.convertToBlob({
    type: `image/${format}`,
    quality
  });

  return blob;
}

// Main message handler
self.onmessage = async (event: MessageEvent<RenderTask>) => {
  const startTime = performance.now();
  const { id, type, data } = event.data;

  try {
    let result: ImageBitmap | Blob | undefined;

    switch (type) {
      case 'thumbnail':
        result = render2D(data.floorPlan, data.width, data.height);
        break;

      case 'preview':
        result = render2D(data.floorPlan, data.width, data.height);
        break;

      case 'export':
        result = await exportImage(
          data.floorPlan,
          data.width,
          data.height,
          'png',
          data.quality || 0.9
        );
        break;

      default:
        throw new Error(`Unknown render task type: ${type}`);
    }

    const executionTime = performance.now() - startTime;

    const response: RenderResult = {
      id,
      success: true,
      executionTime
    };

    if (result instanceof ImageBitmap) {
      response.imageData = result;
    } else if (result instanceof Blob) {
      response.blob = result;
    }

    (self as any).postMessage(response, result instanceof ImageBitmap ? [result] : []);

  } catch (error) {
    const executionTime = performance.now() - startTime;

    const response: RenderResult = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    };

    self.postMessage(response);
  }
};

export {};
