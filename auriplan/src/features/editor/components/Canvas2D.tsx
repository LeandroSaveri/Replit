// ============================================================
// Canvas2D — Orquestrador de desenho 2D
// Fluxo: ResizeObserver → buffer correto → engine → preview overlay
// Zoom/Pan corrigidos – interação estilo MagicPlan
// ============================================================

import { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { useEditorStore, selectCurrentScene } from '@store/editorStore';
import { Render2DEngine } from '@engine/render2d/Render2DEngine';
import { ToolManager, ToolContext, ROOM_SHAPES, RoomToolHandler } from '../handlers';
import type { Vec2 } from '@auriplan-types';

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

export function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderEngineRef = useRef<Render2DEngine | null>(null);
  const toolManagerRef = useRef<ToolManager | null>(null);
  const animFrameRef = useRef<number>(0);

  const scaleRef = useRef(60);
  const panRef = useRef<Vec2>([0, 0]);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const isSpacePressedRef = useRef(false);

  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef(0);
  const pinchStartScaleRef = useRef(60);
  const pinchStartPanRef = useRef<Vec2>([0, 0]);
  const pinchStartMidRef = useRef({ x: 0, y: 0 });

  const [scale, setScaleState] = useState(60);
  const [pan, setPanState] = useState<Vec2>([0, 0]);
  const [previewState, setPreviewState] = useState<any>(null);
  const [snapPoint, setSnapPoint] = useState<Vec2 | null>(null);
  const [cursorStyle, setCursorStyle] = useState('crosshair');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);

  const [renameRoom, setRenameRoom] = useState<{ id: string; name: string } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; worldPos: Vec2 } | null>(null);

  const store = useEditorStore;
  const currentScene = useEditorStore(selectCurrentScene);
  const tool = useEditorStore(state => state.tool);
  const gridSettings = useEditorStore(state => state.grid);
  const selectedIds = useEditorStore(state => state.selectedIds);

  const walls = currentScene?.walls ?? [];
  const rooms = currentScene?.rooms ?? [];

  const setScale = (v: number | ((prev: number) => number)) => {
    setScaleState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      scaleRef.current = next;
      return next;
    });
  };

  const setPan = (v: Vec2 | ((prev: Vec2) => Vec2)) => {
    setPanState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      panRef.current = next;
      return next;
    });
  };

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

  const screenToWorld = useCallback((screenX: number, screenY: number): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    const xPx = (screenX - rect.left) * dpr;
    const yPx = (screenY - rect.top) * dpr;
    const s = scaleRef.current * dpr;
    const p = panRef.current;
    const x = (xPx - canvas.width / 2 - p[0] * dpr) / s;
    const y = -(yPx - canvas.height / 2 - p[1] * dpr) / s;
    return [x, y];
  }, []);

  const worldToScreenPx = useCallback((worldX: number, worldY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const dpr = window.devicePixelRatio || 1;
    const s = scaleRef.current * dpr;
    const p = panRef.current;
    return {
      x: worldX * s + p[0] * dpr + canvas.width / 2,
      y: -worldY * s + p[1] * dpr + canvas.height / 2,
    };
  }, []);

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

  useEffect(() => {
    if (!toolManagerRef.current) {
      toolManagerRef.current = new ToolManager(
        store as any,
        (state) => {
          if (state && (state as any).type === 'rename-room') {
            const roomId = (state as any).roomId as string;
            const room = store.getState().scenes
              .find(s => s.id === store.getState().currentSceneId)
              ?.rooms.find(r => r.id === roomId);
            if (room) setRenameRoom({ id: roomId, name: room.name });
            return;
          }
          setPreviewState(state);
          if (state && 'snapPoint' in state && state.snapPoint) {
            setSnapPoint(state.snapPoint as Vec2);
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

  useEffect(() => {
    toolManagerRef.current?.setTool(tool);
    setCursorStyle(TOOL_CURSORS[tool] ?? 'default');
  }, [tool]);

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    renderEngineRef.current?.setTransform({
      scale: scale * dpr,
      offset: [pan[0] * dpr, pan[1] * dpr],
      rotation: 0,
    });
    requestRenderFrame();
  }, [scale, pan]);

  useEffect(() => {
    requestRenderFrame();
  }, [walls, rooms, previewState, selectedIds, gridSettings, hoveredId]);

  const doRenderRef = useRef<() => void>(() => {});

  const requestRenderFrame = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => doRenderRef.current());
  }, []);

  const doRender = () => {
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

    if (previewState?.type === 'wall') {
      drawGhostWall(ctx, previewState.start, previewState.end);
    } else if (previewState?.type === 'polygon') {
      drawPolygonPreview(ctx, previewState.vertices, previewState.previewPoint);
    }

    if (snapPoint) {
      drawSnapIndicator(ctx, snapPoint);
    }
  };

  doRenderRef.current = doRender;

  const drawGhostWall = (ctx: CanvasRenderingContext2D, start: Vec2, end: Vec2) => {
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
  };

  const drawPolygonPreview = (ctx: CanvasRenderingContext2D, vertices: Vec2[], previewPoint: Vec2 | null) => {
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
  };

  const drawSnapIndicator = (ctx: CanvasRenderingContext2D, point: Vec2) => {
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
  };

  const getModifiers = (e: React.PointerEvent | React.KeyboardEvent | React.WheelEvent): string[] => {
    const m: string[] = [];
    if (e.shiftKey) m.push('shift');
    if (e.ctrlKey) m.push('ctrl');
    if (e.altKey) m.push('alt');
    if (e.metaKey) m.push('meta');
    return m;
  };

  // ============================================================
  // POINTER EVENTS (corrigidos)
  // ============================================================
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 2) e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

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

    if (isSpacePressedRef.current || e.button === 1 || tool === 'pan') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      setCursorStyle('grabbing');
      return;
    }

    if (e.button !== 0) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);
    toolManagerRef.current?.handleEvent({
      type: 'mousedown',
      position: worldPos,
      modifiers: getModifiers(e),
    } as any);
    requestRenderFrame();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

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

    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      setPan(([px, py]) => [px + dx, py + dy]);
      return;
    }

    const worldPos = screenToWorld(e.clientX, e.clientY);
    toolManagerRef.current?.handleEvent({
      type: 'mousemove',
      position: worldPos,
      modifiers: getModifiers(e),
    } as any);
    requestRenderFrame();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const wasMultiTouch = activePointersRef.current.size >= 2;
    activePointersRef.current.delete(e.pointerId);

    // Limpeza completa do estado de pinch
    if (activePointersRef.current.size === 0) {
      pinchStartDistRef.current = 0;
      isPanningRef.current = false;
    } else if (wasMultiTouch) {
      pinchStartDistRef.current = 0;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      setCursorStyle(isSpacePressedRef.current ? 'grab' : TOOL_CURSORS[tool] ?? 'default');
      return;
    }

    const worldPos = screenToWorld(e.clientX, e.clientY);
    toolManagerRef.current?.handleEvent({
      type: 'mouseup',
      position: worldPos,
      modifiers: getModifiers(e),
    } as any);
    requestRenderFrame();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    toolManagerRef.current?.handleEvent({
      type: 'dblclick',
      position: worldPos,
      modifiers: [],
    } as any);
    requestRenderFrame();
  };

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

  const commitRename = () => {
    if (!renameRoom) return;
    store.getState().updateRoom(renameRoom.id, { name: renameRoom.name });
    setRenameRoom(null);
    requestRenderFrame();
  };

  useEffect(() => {
    if (renameRoom && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameRoom]);

  const contextMenuActions = () => {
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
  };

  // ============================================================
  // WHEEL ZOOM (com proteção contra multi‑touch)
  // ============================================================
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ignora wheel se um gesto multi‑touch estiver ativo (pinch)
    if (activePointersRef.current.size > 0) return;

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
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Keyboard ──────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        setCursorStyle('grab');
      }
      if (e.key === 'Escape') {
        toolManagerRef.current?.handleEvent({ type: 'keydown', key: 'Escape', modifiers: [], position: [0,0] } as any);
        requestRenderFrame();
      }
      if (e.key === 'Enter') {
        toolManagerRef.current?.handleEvent({ type: 'keydown', key: 'Enter', modifiers: [], position: [0,0] } as any);
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
        setScale(60);
        setPan([0, 0]);
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
  }, [store]);

  const insertShape = (shapeName: string) => {
    const handler = (toolManagerRef.current as any)?.currentHandler;
    if (handler instanceof RoomToolHandler) {
      handler.insertShape(shapeName, [0, 0] as Vec2);
      requestRenderFrame();
    }
  };

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

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
          </div>
        )}

        {/* Scale info - apenas desktop */}
        <div className="hidden md:block absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-slate-600 border border-slate-200 shadow-sm z-10">
          1 : {(100 / scale * 10).toFixed(0)} &nbsp;|&nbsp; {scale.toFixed(0)} px/m
        </div>

        {contextMenu && (
          <div
            role="menu"
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
            <div className="absolute z-50 flex flex-col items-center gap-1" style={{ left: sx - 80, top: sy - 20 }}>
              <input
                ref={renameInputRef}
                type="text"
                value={renameRoom.name}
                onChange={e => setRenameRoom({ ...renameRoom, name: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenameRoom(null); }}
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
