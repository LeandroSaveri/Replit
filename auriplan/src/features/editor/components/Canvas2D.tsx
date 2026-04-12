// ============================================================
// Canvas2D — Orquestrador de desenho 2D com Interação Universal
// Suporte: Mobile (touch), Desktop (mouse), Tablet (pointer)
// Hierarquia: Pointer Events → Unified Input → ToolManager
// ============================================================

import { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { useEditorStore, selectCurrentScene, selectCurrentJunctions } from '@store/editorStore';
import { Render2DEngine } from '@engine/render2d/Render2DEngine';
import { ToolManager, ToolContext, ROOM_SHAPES, RoomToolHandler } from '../handlers';
import type { Vec2, Wall, ViewMode } from '@auriplan-types';
import type { InteractionEvent, KeyboardModifier } from '@core/interaction/InteractionEngine';

// Tipos de handle para interação com paredes
type WallHandleType = 'start' | 'end' | 'body' | null;

interface WallInteractionState {
  wallId: string | null;
  handleType: WallHandleType;
  isDragging: boolean;
  dragStartPos: Vec2;
  wallStartAtDrag: Vec2;
  wallEndAtDrag: Vec2;
  connectedWalls: Array<{
    wallId: string;
    startAtDrag: Vec2;
    endAtDrag: Vec2;
    connectionPoint: 'start' | 'end';
  }>;
}

// Cursor por ferramenta
const TOOL_CURSORS: Record<string, string> = {
  select: 'default',
  pan: 'grab',
  wall: 'crosshair',
  room: 'crosshair',
  door: 'crosshair',
  window: 'crosshair',
  measure: 'crosshair',
  text: 'text',
};

// Constantes de interação
const WALL_HIT_TEST_DISTANCE = 0.15; // metros
const HANDLE_SIZE = 8; // pixels
const SNAP_DISTANCE = 0.1; // metros
const DRAG_THRESHOLD = 3; // pixels para iniciar drag

// ============================================================
// COMPONENTE CANVAS2D
// ============================================================

export function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderEngineRef = useRef<Render2DEngine | null>(null);
  const toolManagerRef = useRef<ToolManager | null>(null);
  const animFrameRef = useRef<number>(0);

  // Refs para transform (evitar stale closures)
  const scaleRef = useRef(60);
  const panRef = useRef<Vec2>([0, 0]);
  const rotationRef = useRef(0);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const isSpacePressedRef = useRef(false);

  // Multi-touch tracking
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef(0);
  const pinchStartScaleRef = useRef(60);
  const pinchStartPanRef = useRef<Vec2>([0, 0]);
  const pinchStartMidRef = useRef({ x: 0, y: 0 });

  // Estado de interação com paredes (Magicplan-style)
  const wallInteractionRef = useRef<WallInteractionState>({
    wallId: null,
    handleType: null,
    isDragging: false,
    dragStartPos: [0, 0],
    wallStartAtDrag: [0, 0],
    wallEndAtDrag: [0, 0],
    connectedWalls: [],
  });

  // Estados React
  const [scale, setScaleState] = useState(60);
  const [pan, setPanState] = useState<Vec2>([0, 0]);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [previewState, setPreviewState] = useState<unknown>(null);
  const [snapPoint, setSnapPoint] = useState<Vec2 | null>(null);
  const [cursorStyle, setCursorStyle] = useState('crosshair');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);

  // UI States
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<WallHandleType>(null);
  const [renameRoom, setRenameRoom] = useState<{ id: string; name: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; worldPos: Vec2 } | null>(null);
  
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Store selectors
  const store = useEditorStore;
  const currentScene = useEditorStore(selectCurrentScene);
  const junctions = useEditorStore(selectCurrentJunctions);
  const tool = useEditorStore(state => state.tool);
  const gridSettings = useEditorStore(state => state.grid);
  const selectedIds = useEditorStore(state => state.selectedIds);
  const snapSettings = useEditorStore(state => state.snap);

  const walls = currentScene?.walls ?? [];
  const rooms = currentScene?.rooms ?? [];

  // ============================================================
  // SYNC STATE TO REFS
  // ============================================================

  const setScale = useCallback((v: number | ((prev: number) => number)) => {
    setScaleState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      scaleRef.current = next;
      return next;
    });
  }, []);

  const setPan = useCallback((v: Vec2 | ((prev: Vec2) => Vec2)) => {
    setPanState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      panRef.current = next;
      return next;
    });
  }, []);

  const setRotation = useCallback((v: number | ((prev: number) => number)) => {
    setCameraRotation(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      rotationRef.current = next;
      return next;
    });
  }, []);

  // ============================================================
  // CANVAS RESIZE
  // ============================================================

  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const applySize = (w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      renderEngineRef.current?.resize(canvas.width, canvas.height);
    };

    applySize(container.offsetWidth, container.offsetHeight);

    const ro = new ResizeObserver(entries => {
      const e = entries[0];
      if (!e) return;
      const { width, height } = e.contentRect;
      applySize(width, height);
      requestRenderFrame();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ============================================================
  // COORDINATE TRANSFORMS
  // ============================================================

  const screenToWorld = useCallback((screenX: number, screenY: number): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    const xPx = (screenX - rect.left) * dpr;
    const yPx = (screenY - rect.top) * dpr;
    const s = scaleRef.current * dpr;
    const p = panRef.current;
    const rot = rotationRef.current;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const xCenter = (xPx - canvas.width / 2 - p[0] * dpr);
    const yCenter = -(yPx - canvas.height / 2 - p[1] * dpr);
    const x = (xCenter * cos - yCenter * sin) / s;
    const y = (xCenter * sin + yCenter * cos) / s;
    return [x, y];
  }, []);

  const worldToScreenPx = useCallback((worldX: number, worldY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const dpr = window.devicePixelRatio || 1;
    const s = scaleRef.current * dpr;
    const p = panRef.current;
    const rot = rotationRef.current;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const xRot = worldX * cos - worldY * sin;
    const yRot = worldX * sin + worldY * cos;
    return {
      x: xRot * s + p[0] * dpr + canvas.width / 2,
      y: -yRot * s + p[1] * dpr + canvas.height / 2,
    };
  }, []);

  // ============================================================
  // HIT-TEST DE PAREDES (Magicplan-style)
  // ============================================================

  const getDistanceToWall = useCallback((point: Vec2, wall: Wall): number => {
    const [px, py] = point;
    const [x1, y1] = wall.start;
    const [x2, y2] = wall.end;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    
    let t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.hypot(px - projX, py - projY);
  }, []);

  const getClosestPointOnWall = useCallback((point: Vec2, wall: Wall): { point: Vec2; t: number } => {
    const [px, py] = point;
    const [x1, y1] = wall.start;
    const [x2, y2] = wall.end;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    
    if (len2 === 0) return { point: [x1, y1] as Vec2, t: 0 };
    
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    
    return {
      point: [x1 + t * dx, y1 + t * dy] as Vec2,
      t
    };
  }, []);

  const hitTestWalls = useCallback((worldPos: Vec2): { wall: Wall | null; handleType: WallHandleType; distance: number } => {
    if (!walls.length) return { wall: null, handleType: null, distance: Infinity };
    
    let closestWall: Wall | null = null;
    let closestHandle: WallHandleType = null;
    let minDistance = Infinity;
    
    // Verificar handles primeiro (prioridade maior)
    for (const wall of walls) {
      const startScreen = worldToScreenPx(wall.start[0], wall.start[1]);
      const endScreen = worldToScreenPx(wall.end[0], wall.end[1]);
      const posScreen = worldToScreenPx(worldPos[0], worldPos[1]);
      
      const dpr = window.devicePixelRatio || 1;
      const handleRadius = HANDLE_SIZE * dpr;
      
      const distToStart = Math.hypot(startScreen.x - posScreen.x, startScreen.y - posScreen.y);
      const distToEnd = Math.hypot(endScreen.x - posScreen.x, endScreen.y - posScreen.y);
      
      if (distToStart < handleRadius && distToStart < minDistance) {
        minDistance = distToStart;
        closestWall = wall;
        closestHandle = 'start';
      } else if (distToEnd < handleRadius && distToEnd < minDistance) {
        minDistance = distToEnd;
        closestWall = wall;
        closestHandle = 'end';
      }
    }
    
    if (closestWall) {
      return { wall: closestWall, handleType: closestHandle, distance: minDistance };
    }
    
    // Verificar corpo da parede
    for (const wall of walls) {
      const distance = getDistanceToWall(worldPos, wall);
      if (distance < WALL_HIT_TEST_DISTANCE && distance < minDistance) {
        minDistance = distance;
        closestWall = wall;
        closestHandle = 'body';
      }
    }
    
    return { wall: closestWall, handleType: closestHandle, distance: minDistance };
  }, [walls, worldToScreenPx, getDistanceToWall]);

  // ============================================================
  // ENCONTRAR PAREDES CONECTADAS
  // ============================================================

  const getConnectedWalls = useCallback((wallId: string, point: Vec2, endpoint: 'start' | 'end'): Wall[] => {
    if (!junctions?.points) return [];
    
    const tolerance = 0.001;
    const x = Math.round(point[0] / tolerance) * tolerance;
    const y = Math.round(point[1] / tolerance) * tolerance;
    const key = `${x},${y}`;
    
    const junction = junctions.points[key];
    if (!junction) return [];
    
    return junction.walls
      .filter(w => w.wallId !== wallId)
      .map(w => walls.find(wall => wall.id === w.wallId))
      .filter((w): w is Wall => w !== undefined);
  }, [junctions, walls]);

  // ============================================================
  // RENDER ENGINE INIT
  // ============================================================

  useEffect(() => {
    if (!canvasRef.current || renderEngineRef.current) return;
    const engine = new Render2DEngine({
      antialias: true,
      showGrid: true,
      showAxes: true,
      showDimensions: true,
      selectionColor: '#3b82f6',
      hoverColor: '#60a5fa',
      wallColor: '#1e293b',
      roomFillOpacity: 0.15,
    });
    engine.initialize(canvasRef.current);
    renderEngineRef.current = engine;
    requestRenderFrame();
  }, []);

  // ============================================================
  // TOOLMANAGER INIT
  // ============================================================

  useEffect(() => {
    if (!toolManagerRef.current) {
      toolManagerRef.current = new ToolManager(
        store as EditorStore,
        (state) => {
          // Type guard para rename-room
          if (state && typeof state === 'object' && 'type' in state && state.type === 'rename-room') {
            const roomId = (state as { roomId: string }).roomId;
            const room = store.getState().scenes
              .find(s => s.id === store.getState().currentSceneId)
              ?.rooms.find(r => r.id === roomId);
            if (room) setRenameRoom({ id: roomId, name: room.name });
            return;
          }
          setPreviewState(state);
          if (state && typeof state === 'object' && 'snapPoint' in state && state.snapPoint) {
            setSnapPoint((state as { snapPoint: Vec2 }).snapPoint);
          } else {
            setSnapPoint(null);
          }
        },
        (id) => {
          hoveredIdRef.current = id;
          setHoveredId(id);
        },
        (cursor) => {
          if (store.getState().tool === 'select') setCursorStyle(cursor);
        },
      );
    }
    return () => {
      toolManagerRef.current?.destroy();
      toolManagerRef.current = null;
    };
  }, [store]);

  // Sync active tool to manager + cursor
  useEffect(() => {
    toolManagerRef.current?.setTool(tool);
    setCursorStyle(TOOL_CURSORS[tool] ?? 'default');
    
    // Resetar seleção de parede ao trocar de ferramenta
    if (tool !== 'select') {
      setSelectedWallId(null);
      wallInteractionRef.current.wallId = null;
      wallInteractionRef.current.handleType = null;
    }
  }, [tool]);

  // Sync engine transform
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    renderEngineRef.current?.setTransform({
      scale: scale * dpr,
      offset: [pan[0] * dpr, pan[1] * dpr],
      rotation: cameraRotation,
    });
    requestRenderFrame();
  }, [scale, pan, cameraRotation]);

  // Re-render on data change
  useEffect(() => {
    requestRenderFrame();
  }, [walls, rooms, previewState, selectedIds, gridSettings, hoveredId, selectedWallId, hoveredHandle]);

  // ============================================================
  // RENDER LOOP
  // ============================================================

  const doRenderRef = useRef<() => void>(() => {});

  const requestRenderFrame = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => doRenderRef.current());
  }, []);

  const doRender = useCallback(() => {
    const engine = renderEngineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine['config'].showGrid = gridSettings.visible;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    engine.render({
      walls,
      rooms,
      doors: currentScene?.doors ?? [],
      windows: currentScene?.windows ?? [],
      furniture: currentScene?.furniture ?? [],
      measurements: currentScene?.measurements ?? [],
      selectedIds,
      hoveredId: hoveredIdRef.current,
    });

    // Overlay: preview
    if (previewState && typeof previewState === 'object') {
      const ps = previewState as { type: string; start?: Vec2; end?: Vec2; vertices?: Vec2[]; previewPoint?: Vec2 };
      if (ps.type === 'wall' && ps.start && ps.end) {
        drawGhostWall(ctx, ps.start, ps.end);
      } else if (ps.type === 'polygon' && ps.vertices) {
        drawPolygonPreview(ctx, ps.vertices, ps.previewPoint ?? null);
      }
    }

    // Overlay: handles de parede selecionada (Magicplan-style)
    if (selectedWallId && tool === 'select') {
      const wall = walls.find(w => w.id === selectedWallId);
      if (wall) {
        drawWallHandles(ctx, wall);
      }
    }

    if (snapPoint) {
      drawSnapIndicator(ctx, snapPoint);
    }
  }, [walls, rooms, currentScene, selectedIds, gridSettings, previewState, selectedWallId, tool, snapPoint]);

  doRenderRef.current = doRender;

  // ============================================================
  // DRAWING HELPERS
  // ============================================================

  const drawWallHandles = useCallback((ctx: CanvasRenderingContext2D, wall: Wall) => {
    const start = worldToScreenPx(wall.start[0], wall.start[1]);
    const end = worldToScreenPx(wall.end[0], wall.end[1]);
    const dpr = window.devicePixelRatio || 1;
    const size = HANDLE_SIZE * dpr;
    
    ctx.save();
    
    // Highlight da parede selecionada
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Handle start
    const isStartHovered = hoveredHandle === 'start';
    ctx.fillStyle = isStartHovered ? '#2563eb' : '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(start.x, start.y, size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Handle end
    const isEndHovered = hoveredHandle === 'end';
    ctx.fillStyle = isEndHovered ? '#2563eb' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(end.x, end.y, size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Handle body (linha central clicável)
    if (hoveredHandle === 'body') {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 12 * dpr;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [worldToScreenPx, hoveredHandle]);

  const drawGhostWall = useCallback((ctx: CanvasRenderingContext2D, start: Vec2, end: Vec2) => {
    const p1 = worldToScreenPx(start[0], start[1]);
    const p2 = worldToScreenPx(end[0], end[1]);
    const dpr = window.devicePixelRatio || 1;
    const thickness = 0.15 * scaleRef.current * dpr;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const nx = -dy / len * thickness / 2;
    const ny = dx / len * thickness / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(59,130,246,0.35)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(p1.x + nx, p1.y + ny);
    ctx.lineTo(p2.x + nx, p2.y + ny);
    ctx.lineTo(p2.x - nx, p2.y - ny);
    ctx.lineTo(p1.x - nx, p1.y - ny);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    const dist = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    ctx.font = `bold ${13 * dpr}px Inter,system-ui,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = `${dist.toFixed(2)}m`;
    const metrics = ctx.measureText(label);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(midX - metrics.width / 2 - 6, midY - 10 * dpr, metrics.width + 12, 20 * dpr);
    ctx.fillStyle = '#2563eb';
    ctx.fillText(label, midX, midY);
    ctx.restore();
  }, [worldToScreenPx]);

  const drawPolygonPreview = useCallback((ctx: CanvasRenderingContext2D, vertices: Vec2[], previewPoint: Vec2 | null) => {
    if (vertices.length === 0) return;
    const pts = vertices.map(v => worldToScreenPx(v[0], v[1]));
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.fillStyle = 'rgba(34,197,94,0.12)';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (previewPoint) {
      const p = worldToScreenPx(previewPoint[0], previewPoint[1]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.fill();
    ctx.stroke();

    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = i === 0 ? '#f59e0b' : '#22c55e';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    });

    if (vertices.length >= 3 && previewPoint) {
      const first = pts[0];
      const cur = worldToScreenPx(previewPoint[0], previewPoint[1]);
      const d = Math.hypot(cur.x - first.x, cur.y - first.y);
      if (d < 30 * dpr) {
        ctx.beginPath();
        ctx.arc(first.x, first.y, 12 * dpr, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(245,158,11,0.3)';
        ctx.fill();
      }
    }
    ctx.restore();
  }, [worldToScreenPx]);

  const drawSnapIndicator = useCallback((ctx: CanvasRenderingContext2D, point: Vec2) => {
    const p = worldToScreenPx(point[0], point[1]);
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6 * dpr, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = 'rgba(245,158,11,0.2)';
    ctx.fill();
    ctx.restore();
  }, [worldToScreenPx]);

  // ============================================================
  // INTERACTION HELPERS
  // ============================================================

  const getModifiers = useCallback((e: React.PointerEvent | React.KeyboardEvent | React.WheelEvent): KeyboardModifier[] => {
    const m: KeyboardModifier[] = [];
    if (e.shiftKey) m.push('shift');
    if (e.ctrlKey) m.push('ctrl');
    if (e.altKey) m.push('alt');
    if (e.metaKey) m.push('meta');
    return m;
  }, []);

  const createInteractionEvent = useCallback((
    type: InteractionEvent['type'],
    position: Vec2,
    modifiers: KeyboardModifier[],
    extras: Partial<Omit<InteractionEvent, 'type' | 'position' | 'modifiers'>> = {}
  ): InteractionEvent => ({
    type,
    position,
    modifiers,
    ...extras,
  }), []);

  const snapToGrid = useCallback((pos: Vec2): Vec2 => {
    if (!snapSettings.enabled || !snapSettings.grid) return pos;
    const gridSize = gridSettings.size;
    return [
      Math.round(pos[0] / gridSize) * gridSize,
      Math.round(pos[1] / gridSize) * gridSize,
    ];
  }, [snapSettings, gridSettings]);

  // ============================================================
  // POINTER EVENTS (Mobile/Desktop/Tablet Unified)
  // ============================================================

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 2) e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch: Pinch/Zoom com 2 dedos
    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      pinchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartScaleRef.current = scaleRef.current;
      pinchStartPanRef.current = [...panRef.current] as Vec2;
      pinchStartMidRef.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      isPanningRef.current = false;
      return;
    }

    const worldPos = screenToWorld(e.clientX, e.clientY);

    // Modo select: verificar hit em paredes primeiro
    if (tool === 'select') {
      const hit = hitTestWalls(worldPos);
      
      if (hit.wall) {
        // Selecionar parede
        setSelectedWallId(hit.wall.id);
        store.getState().select(hit.wall.id);
        
        // Iniciar drag se for body ou handle
        if (hit.handleType) {
          const interaction = wallInteractionRef.current;
          interaction.wallId = hit.wall.id;
          interaction.handleType = hit.handleType;
          interaction.isDragging = true;
          interaction.dragStartPos = worldPos;
          interaction.wallStartAtDrag = [...hit.wall.start] as Vec2;
          interaction.wallEndAtDrag = [...hit.wall.end] as Vec2;
          
          // Encontrar paredes conectadas para movimento conjunto
          interaction.connectedWalls = [];
          
          if (hit.handleType === 'body') {
            // Paredes conectadas ao start
            const startConnected = getConnectedWalls(hit.wall.id, hit.wall.start, 'start');
            for (const connected of startConnected) {
              const isStart = Math.hypot(connected.start[0] - hit.wall.start[0], connected.start[1] - hit.wall.start[1]) < 0.001;
              interaction.connectedWalls.push({
                wallId: connected.id,
                startAtDrag: [...connected.start] as Vec2,
                endAtDrag: [...connected.end] as Vec2,
                connectionPoint: isStart ? 'start' : 'end',
              });
            }
            
            // Paredes conectadas ao end
            const endConnected = getConnectedWalls(hit.wall.id, hit.wall.end, 'end');
            for (const connected of endConnected) {
              const isStart = Math.hypot(connected.start[0] - hit.wall.end[0], connected.start[1] - hit.wall.end[1]) < 0.001;
              interaction.connectedWalls.push({
                wallId: connected.id,
                startAtDrag: [...connected.start] as Vec2,
                endAtDrag: [...connected.end] as Vec2,
                connectionPoint: isStart ? 'start' : 'end',
              });
            }
          }
          
          setCursorStyle(hit.handleType === 'body' ? 'move' : 'nwse-resize');
          return;
        }
      } else {
        // Click no vazio: deselecionar
        setSelectedWallId(null);
        setHoveredHandle(null);
        wallInteractionRef.current.wallId = null;
        wallInteractionRef.current.handleType = null;
        store.getState().deselectAll();
      }
    }

    // Pan mode
    if (isSpacePressedRef.current || e.button === 1 || tool === 'pan') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      setCursorStyle('grabbing');
      return;
    }

    if (e.button !== 0) return;

    // Delegar para ToolManager para outras ferramentas
    if (tool !== 'select') {
      const event: InteractionEvent = createInteractionEvent('mousedown', worldPos, getModifiers(e));
      toolManagerRef.current?.handleEvent(event);
    }
    
    requestRenderFrame();
  }, [tool, screenToWorld, hitTestWalls, getConnectedWalls, store, createInteractionEvent, getModifiers, requestRenderFrame]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch: Pinch/Zoom
    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const dist = Math.hypot(dx, dy);
      if (pinchStartDistRef.current < 1) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const startMidX = pinchStartMidRef.current.x;
      const startMidY = pinchStartMidRef.current.y;

      const newScale = Math.max(8, Math.min(400,
        pinchStartScaleRef.current * (dist / pinchStartDistRef.current)
      ));
      const ratio = newScale / pinchStartScaleRef.current;

      const pivotX = startMidX - cx;
      const pivotY = startMidY - cy;
      const panDeltaX = midX - startMidX;
      const panDeltaY = midY - startMidY;

      setPan([
        pivotX + (pinchStartPanRef.current[0] - pivotX) * ratio + panDeltaX,
        pivotY + (pinchStartPanRef.current[1] - pivotY) * ratio + panDeltaY,
      ]);
      setScale(newScale);
      requestRenderFrame();
      return;
    }

    // Panning
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      setPan(([px, py]) => [px + dx, py + dy]);
      return;
    }

    const worldPos = screenToWorld(e.clientX, e.clientY);

    // Verificar hover em handles durante drag ou hover
    if (tool === 'select' && !wallInteractionRef.current.isDragging) {
      const hit = hitTestWalls(worldPos);
      if (hit.wall && hit.handleType) {
        setHoveredHandle(hit.handleType);
        setCursorStyle(hit.handleType === 'body' ? 'move' : 'nwse-resize');
      } else if (hit.wall) {
        setHoveredHandle('body');
        setCursorStyle('pointer');
      } else {
        setHoveredHandle(null);
        setCursorStyle('default');
      }
    }

    // Processar drag de parede
    const interaction = wallInteractionRef.current;
    if (interaction.isDragging && interaction.wallId && interaction.handleType) {
      const delta: Vec2 = [
        worldPos[0] - interaction.dragStartPos[0],
        worldPos[1] - interaction.dragStartPos[1],
      ];
      
      let newStart = interaction.wallStartAtDrag;
      let newEnd = interaction.wallEndAtDrag;
      
      if (interaction.handleType === 'body') {
        // Mover parede inteira
        newStart = snapToGrid([
          interaction.wallStartAtDrag[0] + delta[0],
          interaction.wallStartAtDrag[1] + delta[1],
        ]);
        newEnd = snapToGrid([
          interaction.wallEndAtDrag[0] + delta[0],
          interaction.wallEndAtDrag[1] + delta[1],
        ]);
        
        // Atualizar parede principal
        store.getState()._liveUpdateWall(interaction.wallId, newStart, newEnd);
        
        // Mover paredes conectadas
        for (const connected of interaction.connectedWalls) {
          if (connected.connectionPoint === 'start') {
            const newConnectedStart: Vec2 = [newStart[0], newStart[1]];
            const newConnectedEnd = connected.endAtDrag;
            store.getState()._liveUpdateWall(connected.wallId, newConnectedStart, newConnectedEnd);
          } else {
            const newConnectedStart = connected.startAtDrag;
            const newConnectedEnd: Vec2 = [newEnd[0], newEnd[1]];
            store.getState()._liveUpdateWall(connected.wallId, newConnectedStart, newConnectedEnd);
          }
        }
      } else if (interaction.handleType === 'start') {
        // Mover apenas start
        newStart = snapToGrid([
          interaction.wallStartAtDrag[0] + delta[0],
          interaction.wallStartAtDrag[1] + delta[1],
        ]);
        store.getState()._liveUpdateWall(interaction.wallId, newStart, interaction.wallEndAtDrag);
      } else if (interaction.handleType === 'end') {
        // Mover apenas end
        newEnd = snapToGrid([
          interaction.wallEndAtDrag[0] + delta[0],
          interaction.wallEndAtDrag[1] + delta[1],
        ]);
        store.getState()._liveUpdateWall(interaction.wallId, interaction.wallStartAtDrag, newEnd);
      }
      
      requestRenderFrame();
      return;
    }

    // Delegar para ToolManager para outras ferramentas
    if (tool !== 'select') {
      const event: InteractionEvent = createInteractionEvent('mousemove', worldPos, getModifiers(e));
      toolManagerRef.current?.handleEvent(event);
    }
    
    requestRenderFrame();
  }, [tool, screenToWorld, hitTestWalls, snapToGrid, store, createInteractionEvent, getModifiers, requestRenderFrame, setPan, setScale]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const wasMultiTouch = activePointersRef.current.size >= 2;
    activePointersRef.current.delete(e.pointerId);

    if (wasMultiTouch) {
      pinchStartDistRef.current = 0;
      return;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      setCursorStyle(isSpacePressedRef.current ? 'grab' : TOOL_CURSORS[tool] ?? 'default');
      return;
    }

    const worldPos = screenToWorld(e.clientX, e.clientY);
    const interaction = wallInteractionRef.current;

    // Finalizar drag de parede
    if (interaction.isDragging && interaction.wallId) {
      // Commit final usando updateWall (com pipeline geométrico)
      const wall = walls.find(w => w.id === interaction.wallId);
      if (wall) {
        store.getState().updateWall(interaction.wallId, {
          start: wall.start,
          end: wall.end,
        });
        
        // Commit paredes conectadas
        for (const connected of interaction.connectedWalls) {
          const connectedWall = walls.find(w => w.id === connected.wallId);
          if (connectedWall) {
            store.getState().updateWall(connected.wallId, {
              start: connectedWall.start,
              end: connectedWall.end,
            });
          }
        }
      }
      
      interaction.isDragging = false;
      interaction.wallId = null;
      interaction.handleType = null;
      interaction.connectedWalls = [];
      setCursorStyle('default');
      return;
    }

    // Delegar para ToolManager
    if (tool !== 'select') {
      const event: InteractionEvent = createInteractionEvent('mouseup', worldPos, getModifiers(e));
      toolManagerRef.current?.handleEvent(event);
    }
    
    requestRenderFrame();
  }, [tool, screenToWorld, walls, store, createInteractionEvent, getModifiers, requestRenderFrame]);

  // ============================================================
  // DOUBLE CLICK — AGORA CHAMA A ACTION CANÔNICA DO STORE
  // ============================================================
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    
    if (tool === 'select') {
      const hit = hitTestWalls(worldPos);
      if (hit.wall) {
        const closest = getClosestPointOnWall(worldPos, hit.wall);
        // Só divide se o ponto não estiver muito próximo das extremidades
        if (closest.t > 0.05 && closest.t < 0.95) {
          store.getState().splitWall(hit.wall.id, closest.point);
          setSelectedWallId(null);
          requestRenderFrame();
          return;
        }
      }
    }
    
    const event: InteractionEvent = createInteractionEvent('dblclick', worldPos, []);
    toolManagerRef.current?.handleEvent(event);
    requestRenderFrame();
  }, [tool, screenToWorld, hitTestWalls, getClosestPointOnWall, store, createInteractionEvent, requestRenderFrame]);

  // ============================================================
  // CONTEXT MENU
  // ============================================================

  const handleContextMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, worldPos });
  }, [screenToWorld]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const listener = (e: MouseEvent) => handleContextMenu(e);
    canvas.addEventListener('contextmenu', listener);
    return () => canvas.removeEventListener('contextmenu', listener);
  }, [handleContextMenu]);

  useEffect(() => {
    if (!contextMenu) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[role="menu"]')) setContextMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [contextMenu]);

  const contextMenuActions = useCallback(() => {
    const state = store.getState();
    const scene = state.scenes.find(s => s.id === state.currentSceneId);
    if (!scene || !contextMenu) return [];
    const actions: Array<{ label: string; color?: string; action: () => void }> = [];
    const ids = state.selectedIds;

    if (ids.length > 0) {
      const hasWall = ids.some(id => scene.walls.some(w => w.id === id));
      const hasRoom = ids.some(id => scene.rooms.some(r => r.id === id));
      const hasFurn = ids.some(id => scene.furniture.some(f => f.id === id));

      if (hasWall && ids.length === 1) {
        const wallId = ids[0];
        const wall = scene.walls.find(w => w.id === wallId);
        if (wall && contextMenu) {
          actions.push({ label: 'Dividir Parede', action: () => {
            const clickPos = contextMenu.worldPos;
            const ax = wall.end[0] - wall.start[0];
            const ay = wall.end[1] - wall.start[1];
            const len2 = ax * ax + ay * ay;
            if (len2 < 0.01) return;
            const t = Math.max(0.05, Math.min(0.95,
              ((clickPos[0] - wall.start[0]) * ax + (clickPos[1] - wall.start[1]) * ay) / len2
            ));
            const mid: Vec2 = [wall.start[0] + ax * t, wall.start[1] + ay * t];
            // Usa a action canônica do store
            state.splitWall(wallId, mid);
            state.deselectAll();
          }});
        }
      }

      if (hasRoom && ids.length === 1) {
        const roomId = ids[0];
        const room = scene.rooms.find(r => r.id === roomId);
        if (room) {
          actions.push({ label: 'Renomear', action: () => setRenameRoom({ id: roomId, name: room.name }) });
        }
      }
      if (hasFurn && ids.length === 1) {
        const furnId = ids[0];
        actions.push({ label: 'Girar 90°', action: () => {
          const furn = scene.furniture.find(f => f.id === furnId);
          if (furn) {
            const cur = Array.isArray(furn.rotation) ? furn.rotation[1] : 0;
            state.updateFurniture(furnId, { rotation: [0, (cur + Math.PI / 2) % (Math.PI * 2), 0] });
          }
        }});
        actions.push({ label: 'Duplicar', action: () => state.duplicateFurniture(furnId) });
      }
      actions.push({ label: 'Excluir', color: 'text-red-400', action: () => {
        for (const id of ids) {
          if (scene.walls.some(w => w.id === id)) state.deleteWall(id);
          else if (scene.rooms.some(r => r.id === id)) state.deleteRoom(id);
          else if (scene.furniture.some(f => f.id === id)) state.deleteFurniture(id);
        }
        state.deselectAll();
      }});
    }
    return actions;
  }, [contextMenu, store]);

  // ============================================================
  // WHEEL / ZOOM
  // ============================================================

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cursorX = e.clientX - rect.left - rect.width / 2;
    const cursorY = e.clientY - rect.top - rect.height / 2;

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newScale = Math.max(8, Math.min(400, scaleRef.current * factor));
    const ratio = newScale / scaleRef.current;

    setPan(([px, py]) => [
      cursorX + (px - cursorX) * ratio,
      cursorY + (py - cursorY) * ratio,
    ]);
    setScale(newScale);
  }, [setPan, setScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ============================================================
  // KEYBOARD
  // ============================================================

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        setCursorStyle('grab');
      }
      if (e.key === 'Escape') {
        // Cancelar drag se estiver em andamento
        if (wallInteractionRef.current.isDragging) {
          wallInteractionRef.current.isDragging = false;
          wallInteractionRef.current.wallId = null;
          wallInteractionRef.current.handleType = null;
          requestRenderFrame();
        }
        const event: InteractionEvent = createInteractionEvent('keydown', [0, 0], [], { key: 'Escape' });
        toolManagerRef.current?.handleEvent(event);
        requestRenderFrame();
      }
      if (e.key === 'Enter') {
        const event: InteractionEvent = createInteractionEvent('keydown', [0, 0], [], { key: 'Enter' });
        toolManagerRef.current?.handleEvent(event);
        requestRenderFrame();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        store.getState().undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        store.getState().redo();
      }
      if (e.key === 'f' && !e.ctrlKey) {
        resetView();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWallId) {
          store.getState().deleteWall(selectedWallId);
          setSelectedWallId(null);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        if (!isPanningRef.current) {
          setCursorStyle(TOOL_CURSORS[store.getState().tool] ?? 'default');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [store, selectedWallId, createInteractionEvent, requestRenderFrame]);

  // ============================================================
  // VIEW CONTROLS
  // ============================================================

  const zoomIn = useCallback(() => {
    setScale(s => Math.min(400, s * 1.25));
  }, [setScale]);

  const zoomOut = useCallback(() => {
    setScale(s => Math.max(8, s / 1.25));
  }, [setScale]);

  const resetView = useCallback(() => {
    setScale(60);
    setPan([0, 0]);
    setRotation(0);
  }, [setScale, setPan, setRotation]);

  const rotateCamera = useCallback(() => {
    setRotation(r => (r + Math.PI / 2) % (2 * Math.PI));
  }, [setRotation]);

  useEffect(() => {
    const handleZoom = (e: CustomEvent<number>) => {
      if (e.detail > 0) zoomIn();
      else zoomOut();
    };
    const handleCenter = () => resetView();
    const handleRotate = () => rotateCamera();

    window.addEventListener('editor:zoom', handleZoom as EventListener);
    window.addEventListener('editor:center', handleCenter);
    window.addEventListener('editor:rotate', handleRotate);

    return () => {
      window.removeEventListener('editor:zoom', handleZoom as EventListener);
      window.removeEventListener('editor:center', handleCenter);
      window.removeEventListener('editor:rotate', handleRotate);
    };
  }, [zoomIn, zoomOut, resetView, rotateCamera]);

  // ============================================================
  // RENAME ROOM
  // ============================================================

  const commitRename = useCallback(() => {
    if (!renameRoom) return;
    store.getState().updateRoom(renameRoom.id, { name: renameRoom.name });
    setRenameRoom(null);
    requestRenderFrame();
  }, [renameRoom, store, requestRenderFrame]);

  useEffect(() => {
    if (renameRoom && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameRoom]);

  // ============================================================
  // SHAPE INSERTION
  // ============================================================

  const insertShape = useCallback((shapeName: string) => {
    // Type-safe access to currentHandler
    const handler = toolManagerRef.current && 'currentHandler' in toolManagerRef.current 
      ? (toolManagerRef.current as { currentHandler?: RoomToolHandler }).currentHandler 
      : null;
    if (handler instanceof RoomToolHandler) {
      handler.insertShape(shapeName, [0, 0] as Vec2);
      requestRenderFrame();
    }
  }, [requestRenderFrame]);

  // ============================================================
  // RENDER UI
  // ============================================================

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  
  const toolHints: Record<string, string> = {
    select: isMobile
      ? 'Toque parede: seleciona • Arraste: move • 2 dedos: navegar • Duplo toque: dividir'
      : 'Clique: seleciona • Arraste: move • Duplo clique: dividir parede',
    wall: isMobile
      ? 'Toque para iniciar • Arraste • Solte para colocar'
      : 'Clique para iniciar • Arraste • Solte para colocar',
    room: isMobile
      ? 'Toque para adicionar vértices • toque no início para fechar'
      : 'Clique para adicionar vértices • Enter ou clique no início para fechar',
    door: 'Toque em uma parede para adicionar porta',
    window: 'Toque em uma parede para adicionar janela',
    measure: 'Toque para iniciar medição',
    pan: isMobile ? 'Arraste para navegar • 2 dedos para zoom' : 'Arraste para navegar',
  };

  return (
    <ToolContext.Provider value={{ previewState, setPreviewState, activeTool: tool }}>
      <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-100">
        <canvas
          ref={canvasRef}
          className="block select-none"
          style={{
            cursor: cursorStyle,
            touchAction: 'none',
            WebkitUserSelect: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        />

        {/* Room shape picker */}
        {tool === 'room' && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-2 z-20 w-52">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
              Formas prontas
            </div>
            {ROOM_SHAPES.map(shape => (
              <button
                key={shape.name}
                onClick={() => insertShape(shape.name)}
                className="text-left w-full px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
              >
                {shape.name}
              </button>
            ))}
            <div className="border-t border-slate-100 mt-2 pt-2 px-2">
              <p className="text-[10px] text-slate-400">Ou desenhe toque no canvas</p>
            </div>
          </div>
        )}

        {/* Tool hint */}
        {toolHints[tool] && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/85 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full pointer-events-none z-10 whitespace-nowrap">
            {toolHints[tool]}
          </div>
        )}

        {/* Drawing state hints */}
        {tool === 'room' && previewState && typeof previewState === 'object' && 'type' in previewState && previewState.type === 'polygon' && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-green-600/90 backdrop-blur px-3 py-1.5 rounded-full text-xs text-white pointer-events-none">
            {(previewState as { vertices: Vec2[] }).vertices.length} vértice{(previewState as { vertices: Vec2[] }).vertices.length !== 1 ? 's' : ''} • Enter ou clique no início para fechar
          </div>
        )}

        {tool === 'wall' && previewState && typeof previewState === 'object' && 'type' in previewState && previewState.type === 'wall' && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur px-3 py-1.5 rounded-full text-xs text-white pointer-events-none">
            Segmento em andamento • Solte para colocar • Esc = cancelar
          </div>
        )}

        {/* Scale info */}
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-slate-600 border border-slate-200 shadow-sm z-10">
          1 : {(100 / scale * 10).toFixed(0)} &nbsp;|&nbsp; {scale.toFixed(0)} px/m
        </div>

        {/* Context menu */}
        {contextMenu && (
          <div
            role="menu"
            aria-label="Opções do objeto"
            className="absolute z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden min-w-[150px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenuActions().length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-500">Selecione um objeto primeiro</div>
            ) : (
              contextMenuActions().map((item, i) => (
                <button
                  key={i}
                  role="menuitem"
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors ${item.color ?? 'text-slate-200'}`}
                  onClick={() => { item.action(); setContextMenu(null); requestRenderFrame(); }}
                >
                  {item.label}
                </button>
              ))
            )}
          </div>
        )}

        {/* Rename room overlay */}
        {renameRoom && (() => {
          const room = currentScene?.rooms.find(r => r.id === renameRoom.id);
          if (!room) return null;
          const centroid = room.points.reduce(
            (acc, p) => [acc[0] + p[0] / room.points.length, acc[1] + p[1] / room.points.length] as Vec2,
            [0, 0] as Vec2
          );
          const screenPos = worldToScreenPx(centroid[0], centroid[1]);
          const dpr = window.devicePixelRatio || 1;
          const sx = screenPos.x / dpr;
          const sy = screenPos.y / dpr;
          return (
            <div
              className="absolute z-50 flex flex-col items-center gap-1"
              style={{ left: sx - 80, top: sy - 20 }}
            >
              <input
                ref={renameInputRef}
                type="text"
                value={renameRoom.name}
                onChange={e => setRenameRoom({ ...renameRoom, name: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenameRoom(null);
                }}
                onBlur={commitRename}
                className="w-40 text-center text-sm font-semibold px-3 py-1.5 bg-white border-2 border-blue-500 rounded-lg shadow-xl text-slate-800 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 bg-white/80 px-2 py-0.5 rounded">Enter para salvar • Esc para cancelar</span>
            </div>
          );
        })()}
      </div>
    </ToolContext.Provider>
  );
}

export default Canvas2D;
