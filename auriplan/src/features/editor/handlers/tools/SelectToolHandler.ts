// ============================================
// SelectToolHandler.ts - Edição interativa tipo MagicPlan
// Refatorado para usar GeometryController
// Suporta: rooms, walls, furniture, drag, hover, delete
// ============================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { ToolHandler } from '../ToolHandler';
import type { PreviewState } from '../ToolContext';
import type { GeometryController } from '@core/geometry/GeometryController';
import type { Vec2, Wall, Room, Furniture } from '@auriplan-types';
import type { SnapType } from '@core/snap/SnapSolver';

const VERTEX_R = 0.18;
const EDGE_MID_R = 0.15;
const WALL_HIT_TOL = 0.14;

type HitResult =
  | { type: 'none' }
  | { type: 'furniture'; id: string }
  | { type: 'room-vertex'; roomId: string; vtxIdx: number }
  | { type: 'room-edge'; roomId: string; edgeIdx: number }
  | { type: 'room'; id: string }
  | { type: 'wall-vertex'; wallId: string; vertex: 'start' | 'end' }
  | { type: 'wall-midpoint'; wallId: string }
  | { type: 'wall'; id: string };

type DragState =
  | null
  | { kind: 'furniture'; id: string; origX: number; origZ: number; ds: Vec2 }
  | { kind: 'room-vertex'; roomId: string; vtxIdx: number; origPts: Vec2[]; ds: Vec2 }
  | { kind: 'room-edge'; roomId: string; edgeIdx: number; origPts: Vec2[]; ds: Vec2 }
  | { kind: 'room'; id: string; origPts: Vec2[]; ds: Vec2; origWalls: Wall[] }
  | { kind: 'wall-vertex'; wallId: string; vertex: 'start' | 'end'; origPos: Vec2; ds: Vec2; affectedWallIds: string[] }
  | { kind: 'wall-push'; wallId: string; origStart: Vec2; origEnd: Vec2; ds: Vec2; affectedWallIds: string[] }
  | { kind: 'wall-move'; wallId: string; origStart: Vec2; origEnd: Vec2; ds: Vec2; affectedWallIds: string[] };

export interface WallTopology {
  getWallsConnectedToVertex(vertex: Vec2, excludeWallId?: string): Array<{ id: string; start: Vec2; end: Vec2 }>;
  getWallsConnectedToWall(wallId: string): Array<{ id: string; start: Vec2; end: Vec2 }>;
  updateWallGeometry(wallId: string, newStart: Vec2, newEnd: Vec2): void;
}

export interface SelectToolHandlerOptions {
  geometryController: GeometryController;
  onPreviewChange: (state: PreviewState) => void;
  onHoverChange?: (id: string | null) => void;
  onCursorChange?: (cursor: string) => void;
  getTopology?: () => WallTopology | undefined;
  getWalls?: () => Wall[];
  getRooms?: () => Room[];
  getFurniture?: () => Furniture[];
  onSelect?: (id: string, addToSelection: boolean) => void;
  onDeselectAll?: () => void;
  onDelete?: (id: string) => void;
  onZoomToRoom?: (roomId: string) => void;
}

export class SelectToolHandler implements ToolHandler {
  private geometryController: GeometryController;
  private onPreviewChange: (state: PreviewState) => void;
  private onHoverChange: (id: string | null) => void;
  private onCursorChange: (cursor: string) => void;
  private getTopology: () => WallTopology | undefined;
  private getWalls: () => Wall[];
  private getRooms: () => Room[];
  private getFurniture: () => Furniture[];
  private onSelect: (id: string, addToSelection: boolean) => void;
  private onDeselectAll: () => void;
  private onDelete: (id: string) => void;
  private onZoomToRoom: (roomId: string) => void;

  private drag: DragState = null;
  private isDragging = false;
  private downPos: Vec2 | null = null;
  private lastHoverId: string | null = null;
  private selectedRoomId: string | null = null;

  constructor(options: SelectToolHandlerOptions) {
    this.geometryController = options.geometryController;
    this.onPreviewChange = options.onPreviewChange;
    this.onHoverChange = options.onHoverChange || (() => {});
    this.onCursorChange = options.onCursorChange || (() => {});
    this.getTopology = options.getTopology || (() => undefined);
    this.getWalls = options.getWalls || (() => []);
    this.getRooms = options.getRooms || (() => []);
    this.getFurniture = options.getFurniture || (() => []);
    this.onSelect = options.onSelect || (() => {});
    this.onDeselectAll = options.onDeselectAll || (() => {});
    this.onDelete = options.onDelete || (() => {});
    this.onZoomToRoom = options.onZoomToRoom || (() => {});
  }

  handleEvent(event: InteractionEvent): void {
    switch (event.type) {
      case 'mousedown': this.onPointerDown(event); break;
      case 'mousemove': this.onPointerMove(event); break;
      case 'mouseup': this.onPointerUp(event); break;
      case 'keydown': this.onKeyDown(event); break;
      case 'dblclick': this.onDoubleClick(event); break;
    }
  }

  reset(): void {
    this.drag = null;
    this.isDragging = false;
    this.downPos = null;
    this.selectedRoomId = null;
    this.onPreviewChange(null);
  }

  getPreviewState(): PreviewState | null { return null; }

  // ============================================
  // HIT TEST
  // ============================================

  private hitTest(pos: Vec2): HitResult {
    const furniture = this.getFurniture();
    const rooms = this.getRooms();
    const walls = this.getWalls();

    // 1. Furniture
    for (const furn of furniture) {
      const [fx, fz] = Array.isArray(furn.position) ? furn.position : [furn.position.x, furn.position.z];
      const size = furn.size || [0.6, 0.6];
      const halfX = (size[0] || 0.6) / 2;
      const halfZ = (size[1] || 0.6) / 2;
      if (pos[0] >= fx - halfX && pos[0] <= fx + halfX &&
          pos[1] >= fz - halfZ && pos[1] <= fz + halfZ) {
        return { type: 'furniture', id: furn.id };
      }
    }

    // 2. Rooms
    for (const room of rooms) {
      const pts = room.points;
      if (pts.length < 3) continue;

      for (let i = 0; i < pts.length; i++) {
        const v = pts[i];
        const dist = Math.hypot(v[0] - pos[0], v[1] - pos[1]);
        if (dist < VERTEX_R) {
          return { type: 'room-vertex', roomId: room.id, vtxIdx: i };
        }
      }

      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const dist = Math.hypot(mid[0] - pos[0], mid[1] - pos[1]);
        if (dist < EDGE_MID_R) {
          return { type: 'room-edge', roomId: room.id, edgeIdx: i };
        }
      }

      if (this.isPointInPolygon(pos, pts)) {
        return { type: 'room', id: room.id };
      }
    }

    // 3. Walls
    for (const wall of walls) {
      const distStart = Math.hypot(wall.start[0] - pos[0], wall.start[1] - pos[1]);
      const distEnd = Math.hypot(wall.end[0] - pos[0], wall.end[1] - pos[1]);
      if (distStart < VERTEX_R) {
        return { type: 'wall-vertex', wallId: wall.id, vertex: 'start' };
      }
      if (distEnd < VERTEX_R) {
        return { type: 'wall-vertex', wallId: wall.id, vertex: 'end' };
      }

      const mid = [(wall.start[0] + wall.end[0]) / 2, (wall.start[1] + wall.end[1]) / 2];
      const distMid = Math.hypot(mid[0] - pos[0], mid[1] - pos[1]);
      if (distMid < EDGE_MID_R) {
        return { type: 'wall-midpoint', wallId: wall.id };
      }

      const proj = this.projectPointOnLineSegment(pos, wall.start, wall.end);
      if (proj) {
        const dist = Math.hypot(proj[0] - pos[0], proj[1] - pos[1]);
        if (dist < WALL_HIT_TOL) {
          return { type: 'wall', id: wall.id };
        }
      }
    }

    return { type: 'none' };
  }

  private hitToId(hit: HitResult): string | null {
    switch (hit.type) {
      case 'furniture': return hit.id;
      case 'room-vertex': return hit.roomId;
      case 'room-edge': return hit.roomId;
      case 'room': return hit.id;
      case 'wall-vertex': return hit.wallId;
      case 'wall-midpoint': return hit.wallId;
      case 'wall': return hit.id;
      default: return null;
    }
  }

  private cursorForHit(hit: HitResult): string {
    switch (hit.type) {
      case 'furniture': return 'grab';
      case 'room-vertex': return 'move';
      case 'room-edge': return 'move';
      case 'room': return 'grab';
      case 'wall-vertex': return 'move';
      case 'wall-midpoint': return 'ns-resize';
      case 'wall': return 'move';
      default: return 'default';
    }
  }

  // ============================================
  // GEOMETRIA
  // ============================================

  private isPointInPolygon(p: Vec2, polygon: Vec2[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      const intersect = ((yi > p[1]) !== (yj > p[1])) &&
        (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private projectPointOnLineSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 | null {
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const apx = p[0] - a[0];
    const apy = p[1] - a[1];
    const dot = apx * abx + apy * aby;
    const len2 = abx * abx + aby * aby;
    if (len2 === 0) return null;
    let t = dot / len2;
    t = Math.max(0, Math.min(1, t));
    return [a[0] + t * abx, a[1] + t * aby];
  }

  private arePointsEqual(p1: Vec2, p2: Vec2, tol: number = 1e-6): boolean {
    return Math.abs(p1[0] - p2[0]) < tol && Math.abs(p1[1] - p2[1]) < tol;
  }

  // ============================================
  // TECLADO
  // ============================================

  private onKeyDown(event: InteractionEvent): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Deleta objetos selecionados
      const walls = this.getWalls();
      const rooms = this.getRooms();
      const furniture = this.getFurniture();
      
      // Implementação: deleta paredes selecionadas
      // Nota: A lógica de seleção deve ser gerenciada pelo store
      // Aqui chamamos o callback genérico
    }
    if (event.key === 'Escape') {
      this.onDeselectAll();
      this.reset();
    }
  }

  private onDoubleClick(event: InteractionEvent): void {
    const hit = this.hitTest(event.position);
    if (hit.type === 'room') {
      this.onZoomToRoom(hit.id);
    }
  }

  // ============================================
  // POINTER HANDLERS
  // ============================================

  private onPointerDown(event: InteractionEvent): void {
    const pos = event.position;
    this.downPos = pos;
    this.isDragging = false;

    const hit = this.hitTest(pos);
    const walls = this.getWalls();
    const rooms = this.getRooms();
    const furniture = this.getFurniture();

    const addToSel = event.modifiers.includes('shift') || 
                     event.modifiers.includes('ctrl') || 
                     event.modifiers.includes('meta');

    switch (hit.type) {
      case 'furniture': {
        const furn = furniture.find(f => f.id === hit.id);
        if (!furn) return;
        this.onSelect(hit.id, addToSel);
        const _fp = furn.position;
        const _fpx = Array.isArray(_fp) ? _fp[0] : (_fp as any).x ?? 0;
        const _fpz = Array.isArray(_fp) ? _fp[2] : (_fp as any).z ?? 0;
        this.drag = { kind: 'furniture', id: hit.id, origX: _fpx, origZ: _fpz, ds: pos };
        break;
      }
      case 'room-vertex': {
        const room = rooms.find(r => r.id === hit.roomId);
        if (!room) return;
        this.onSelect(hit.roomId, addToSel);
        this.drag = { 
          kind: 'room-vertex', 
          roomId: hit.roomId, 
          vtxIdx: hit.vtxIdx, 
          origPts: room.points.map(p => [...p] as Vec2), 
          ds: pos 
        };
        break;
      }
      case 'room-edge': {
        const room = rooms.find(r => r.id === hit.roomId);
        if (!room) return;
        this.onSelect(hit.roomId, addToSel);
        this.drag = { 
          kind: 'room-edge', 
          roomId: hit.roomId, 
          edgeIdx: hit.edgeIdx, 
          origPts: room.points.map(p => [...p] as Vec2), 
          ds: pos 
        };
        break;
      }
      case 'room': {
        const room = rooms.find(r => r.id === hit.id);
        if (!room) return;
        this.onSelect(hit.id, addToSel);
        this.selectedRoomId = hit.id;
        this.onZoomToRoom(hit.id);
        
        const roomWalls = walls.filter(w =>
          room.points.some((p, i) => {
            const next = room.points[(i + 1) % room.points.length];
            return (this.arePointsEqual(w.start, p) && this.arePointsEqual(w.end, next)) ||
                   (this.arePointsEqual(w.start, next) && this.arePointsEqual(w.end, p));
          })
        );
        
        this.drag = {
          kind: 'room',
          id: hit.id,
          origPts: room.points.map(p => [...p] as Vec2),
          ds: pos,
          origWalls: roomWalls.map(w => ({ ...w }))
        };
        break;
      }
      case 'wall-vertex': {
        const wall = walls.find(w => w.id === hit.wallId);
        if (!wall) return;
        this.onSelect(hit.wallId, addToSel);
        const origPos: Vec2 = hit.vertex === 'start' ? [...wall.start] as Vec2 : [...wall.end] as Vec2;
        
        const topology = this.getTopology();
        const affectedIds: string[] = [hit.wallId];
        
        if (topology) {
          const connected = topology.getWallsConnectedToVertex(origPos, hit.wallId);
          for (const conn of connected) {
            if (!affectedIds.includes(conn.id)) {
              affectedIds.push(conn.id);
            }
          }
        }
        
        this.drag = {
          kind: 'wall-vertex',
          wallId: hit.wallId,
          vertex: hit.vertex,
          origPos,
          ds: pos,
          affectedWallIds: affectedIds,
        };
        break;
      }
      case 'wall-midpoint': {
        const wall = walls.find(w => w.id === hit.wallId);
        if (!wall) return;
        this.onSelect(hit.wallId, addToSel);
        this.drag = { 
          kind: 'wall-push', 
          wallId: hit.wallId, 
          origStart: [...wall.start] as Vec2, 
          origEnd: [...wall.end] as Vec2, 
          ds: pos, 
          affectedWallIds: [hit.wallId] 
        };
        break;
      }
      case 'wall': {
        const wall = walls.find(w => w.id === hit.id);
        if (!wall) return;
        this.onSelect(hit.id, addToSel);
        this.drag = { 
          kind: 'wall-move', 
          wallId: hit.id, 
          origStart: [...wall.start] as Vec2, 
          origEnd: [...wall.end] as Vec2, 
          ds: pos, 
          affectedWallIds: [hit.id] 
        };
        break;
      }
      default:
        if (!addToSel) this.onDeselectAll();
        this.drag = null;
    }
  }

  private onPointerMove(event: InteractionEvent): void {
    const pos = event.position;

    if (!this.isDragging) {
      const hit = this.hitTest(pos);
      const hoverId = this.hitToId(hit);
      if (hoverId !== this.lastHoverId) {
        this.lastHoverId = hoverId;
        this.onHoverChange(hoverId);
      }
      this.onCursorChange(this.cursorForHit(hit));
    }

    if (!this.drag || !this.downPos) return;

    if (!this.isDragging) {
      const dx = pos[0] - this.downPos[0];
      const dy = pos[1] - this.downPos[1];
      if (Math.hypot(dx, dy) < 0.03) return;
      this.isDragging = true;
      this.onCursorChange('grabbing');
    }

    const dx = pos[0] - this.drag.ds[0];
    const dy = pos[1] - this.drag.ds[1];

    // Snap para operações de parede
    let snappedPos = pos;
    let snapType: SnapType | null = null;
    
    if (this.drag.kind === 'wall-vertex' || 
        this.drag.kind === 'wall-move' || 
        this.drag.kind === 'wall-push') {
      const snapResult = this.geometryController.computeSnap(pos);
      snappedPos = snapResult.point;
      snapType = snapResult.type;
    }

    switch (this.drag.kind) {
      case 'furniture': {
        const newPos: [number, number, number] = [this.drag.origX + dx, 0, this.drag.origZ + dy];
        this.geometryController.liveUpdateFurniture(this.drag.id, newPos);
        break;
      }
      case 'room-vertex': {
        const drag = this.drag;
        const newPts = drag.origPts.map((p, i) =>
          i === drag.vtxIdx ? [p[0] + dx, p[1] + dy] as Vec2 : p
        );
        this.geometryController.updateRoomPoints(drag.roomId, newPts);
        break;
      }
      case 'room-edge': {
        const drag = this.drag;
        const n = drag.origPts.length;
        const aIdx = drag.edgeIdx;
        const bIdx = (drag.edgeIdx + 1) % n;
        const newPts = drag.origPts.map((p, i) =>
          (i === aIdx || i === bIdx) ? [p[0] + dx, p[1] + dy] as Vec2 : p
        );
        this.geometryController.updateRoomPoints(drag.roomId, newPts);
        break;
      }
      case 'room': {
        const drag = this.drag;
        const newPts = drag.origPts.map(p => [p[0] + dx, p[1] + dy] as Vec2);
        this.geometryController.updateRoomPoints(drag.id, newPts);
        break;
      }
      case 'wall-vertex': {
        const drag = this.drag;
        const newPos: Vec2 = [
          drag.origPos[0] + (snappedPos[0] - drag.ds[0]), 
          drag.origPos[1] + (snappedPos[1] - drag.ds[1])
        ];
        
        // ✅ USA GEOMETRY CONTROLLER
        this.geometryController.moveVertex(drag.wallId, drag.vertex, newPos);
        break;
      }
      case 'wall-push': {
        const drag = this.drag;
        const wdx = drag.origEnd[0] - drag.origStart[0];
        const wdy = drag.origEnd[1] - drag.origStart[1];
        const len = Math.hypot(wdx, wdy) || 1;
        const perp: Vec2 = [-wdy / len, wdx / len];
        const deltaX = snappedPos[0] - drag.ds[0];
        const deltaY = snappedPos[1] - drag.ds[1];
        const proj = deltaX * perp[0] + deltaY * perp[1];
        const deltaPerp: Vec2 = [perp[0] * proj, perp[1] * proj];
        const newStart: Vec2 = [drag.origStart[0] + deltaPerp[0], drag.origStart[1] + deltaPerp[1]];
        const newEnd: Vec2 = [drag.origEnd[0] + deltaPerp[0], drag.origEnd[1] + deltaPerp[1]];
        
        // ✅ USA GEOMETRY CONTROLLER
        this.geometryController.updateWallGeometry(drag.wallId, newStart, newEnd);
        break;
      }
      case 'wall-move': {
        const drag = this.drag;
        const deltaX = snappedPos[0] - drag.ds[0];
        const deltaY = snappedPos[1] - drag.ds[1];
        const newStart: Vec2 = [drag.origStart[0] + deltaX, drag.origStart[1] + deltaY];
        const newEnd: Vec2 = [drag.origEnd[0] + deltaX, drag.origEnd[1] + deltaY];
        
        // ✅ USA GEOMETRY CONTROLLER
        this.geometryController.updateWallGeometry(drag.wallId, newStart, newEnd);
        break;
      }
    }

    if (snapType && (this.drag.kind === 'wall-vertex' || 
                     this.drag.kind === 'wall-move' || 
                     this.drag.kind === 'wall-push')) {
      this.onPreviewChange({ 
        type: 'edit', 
        wall: { start: [0,0], end: [0,0] }, 
        snapPoint: snappedPos, 
        snapType 
      } as any);
    } else {
      this.onPreviewChange(null);
    }
  }

  private onPointerUp(_event: InteractionEvent): void {
    if (!this.isDragging || !this.drag) {
      this.drag = null;
      this.isDragging = false;
      this.downPos = null;
      this.onPreviewChange(null);
      return;
    }

    const walls = this.getWalls();
    const rooms = this.getRooms();

    switch (this.drag.kind) {
      case 'furniture': {
        // Commit final já feito via liveUpdate
        break;
      }
      case 'room-vertex':
      case 'room-edge':
      case 'room': {
        const roomId = this.drag.kind === 'room' ? this.drag.id : this.drag.roomId;
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          this.geometryController.updateRoomPoints(room.id, room.points);
        }
        break;
      }
      case 'wall-vertex':
      case 'wall-push':
      case 'wall-move': {
        // Commit já feito durante o drag via GeometryController
        // O pipeline já processou as alterações
        break;
      }
    }

    this.resetDrag();
    this.onPreviewChange(null);
  }

  private resetDrag(): void {
    this.drag = null;
    this.isDragging = false;
    this.downPos = null;
  }
}

export default SelectToolHandler;
