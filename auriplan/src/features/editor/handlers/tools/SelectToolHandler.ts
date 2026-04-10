// ============================================================
// SelectToolHandler — MagicPlan-like interactive editing
// Supports: rooms (vertex/edge/move), walls (vertex/push/move),
// furniture (drag), hover state, cursor updates, delete, rotate
// ============================================================

import type { InteractionEvent } from '@core/interaction/InteractionEngine';
import type { ToolHandler } from '../ToolHandler';
import type { PreviewState } from '../ToolContext';
import type { EditorStore } from '@store/editorStore';
import type { Vec2 } from '@auriplan-types';

// Hit tolerance in world units
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
  | { kind: 'room'; id: string; origPts: Vec2[]; ds: Vec2 }
  | { kind: 'wall-vertex'; wallId: string; vertex: 'start' | 'end'; origPos: Vec2; ds: Vec2 }
  | { kind: 'wall-push'; wallId: string; origStart: Vec2; origEnd: Vec2; ds: Vec2 }
  | { kind: 'wall-move'; wallId: string; origStart: Vec2; origEnd: Vec2; ds: Vec2 };

export class SelectToolHandler implements ToolHandler {
  private store: EditorStore;
  private onPreviewChange: (state: PreviewState) => void;
  private onHoverChange: (id: string | null) => void;
  private onCursorChange: (cursor: string) => void;

  private drag: DragState = null;
  private isDragging = false;
  private downPos: Vec2 | null = null;
  private lastHoverId: string | null = null;

  constructor(
    store: EditorStore,
    onPreviewChange: (state: PreviewState) => void,
    onHoverChange: (id: string | null) => void = () => {},
    onCursorChange: (cursor: string) => void = () => {},
  ) {
    this.store = store;
    this.onPreviewChange = onPreviewChange;
    this.onHoverChange = onHoverChange;
    this.onCursorChange = onCursorChange;
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
    this.onPreviewChange(null);
  }

  getPreviewState(): PreviewState | null { return null; }

  // ── Pointer Down ──────────────────────────────────────────
  private onPointerDown(event: InteractionEvent): void {
    const pos = event.position;
    this.downPos = pos;
    this.isDragging = false;

    const hit = this.hitTest(pos);
    const state = this.store.getState();
    const scene = state.scenes.find(s => s.id === state.currentSceneId);
    if (!scene) return;

    const addToSel = event.modifiers.includes('shift') || event.modifiers.includes('ctrl') || event.modifiers.includes('meta');

    switch (hit.type) {
      case 'furniture': {
        const furn = scene.furniture.find(f => f.id === hit.id);
        if (!furn) return;
        state.select(hit.id, addToSel);
        const _fp = furn.position;
        const _fpx = Array.isArray(_fp) ? _fp[0] : (_fp as any).x ?? 0;
        const _fpz = Array.isArray(_fp) ? _fp[2] : (_fp as any).z ?? 0;
        this.drag = { kind: 'furniture', id: hit.id, origX: _fpx, origZ: _fpz, ds: pos };
        break;
      }
      case 'room-vertex': {
        const room = scene.rooms.find(r => r.id === hit.roomId);
        if (!room) return;
        state.select(hit.roomId, addToSel);
        this.drag = { kind: 'room-vertex', roomId: hit.roomId, vtxIdx: hit.vtxIdx, origPts: room.points.map(p => [...p] as Vec2), ds: pos };
        break;
      }
      case 'room-edge': {
        const room = scene.rooms.find(r => r.id === hit.roomId);
        if (!room) return;
        state.select(hit.roomId, addToSel);
        this.drag = { kind: 'room-edge', roomId: hit.roomId, edgeIdx: hit.edgeIdx, origPts: room.points.map(p => [...p] as Vec2), ds: pos };
        break;
      }
      case 'room': {
        const room = scene.rooms.find(r => r.id === hit.id);
        if (!room) return;
        state.select(hit.id, addToSel);
        this.drag = { kind: 'room', id: hit.id, origPts: room.points.map(p => [...p] as Vec2), ds: pos };
        break;
      }
      case 'wall-vertex': {
        const wall = scene.walls.find(w => w.id === hit.wallId);
        if (!wall) return;
        state.select(hit.wallId, addToSel);
        const origPos: Vec2 = hit.vertex === 'start' ? [...wall.start] as Vec2 : [...wall.end] as Vec2;
        this.drag = { kind: 'wall-vertex', wallId: hit.wallId, vertex: hit.vertex, origPos, ds: pos };
        break;
      }
      case 'wall-midpoint': {
        const wall = scene.walls.find(w => w.id === hit.wallId);
        if (!wall) return;
        state.select(hit.wallId, addToSel);
        this.drag = { kind: 'wall-push', wallId: hit.wallId, origStart: [...wall.start] as Vec2, origEnd: [...wall.end] as Vec2, ds: pos };
        break;
      }
      case 'wall': {
        const wall = scene.walls.find(w => w.id === hit.id);
        if (!wall) return;
        state.select(hit.id, addToSel);
        this.drag = { kind: 'wall-move', wallId: hit.id, origStart: [...wall.start] as Vec2, origEnd: [...wall.end] as Vec2, ds: pos };
        break;
      }
      default:
        if (!addToSel) state.deselectAll();
        this.drag = null;
    }
  }

  // ── Pointer Move ──────────────────────────────────────────
  private onPointerMove(event: InteractionEvent): void {
    const pos = event.position;

    // Hover detection when not actively dragging
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

    // Drag threshold (0.03m ≈ 2px at scale 60)
    if (!this.isDragging) {
      const dx = pos[0] - this.downPos[0];
      const dy = pos[1] - this.downPos[1];
      if (Math.hypot(dx, dy) < 0.03) return;
      this.isDragging = true;
      this.onCursorChange('grabbing');
    }

    const state = this.store.getState();
    const dx = pos[0] - this.drag.ds[0];
    const dy = pos[1] - this.drag.ds[1];

    switch (this.drag.kind) {
      case 'furniture': {
        state._liveUpdateFurniturePos(this.drag.id, [this.drag.origX + dx, 0, this.drag.origZ + dy]);
        break;
      }
      case 'room-vertex': {
        const _rvDrag = this.drag!;
        if (_rvDrag.kind !== 'room-vertex') break;
        const newPts = _rvDrag.origPts.map((p, i) =>
          i === _rvDrag.vtxIdx ? [p[0] + dx, p[1] + dy] as Vec2 : p
        );
        state._liveUpdateRoomPoints(_rvDrag.roomId, newPts);
        break;
      }
      case 'room-edge': {
        const n = this.drag.origPts.length;
        const aIdx = this.drag.edgeIdx;
        const bIdx = (this.drag.edgeIdx + 1) % n;
        const newPts = this.drag.origPts.map((p, i) =>
          (i === aIdx || i === bIdx) ? [p[0] + dx, p[1] + dy] as Vec2 : p
        );
        state._liveUpdateRoomPoints(this.drag.roomId, newPts);
        break;
      }
      case 'room': {
        const newPts = this.drag.origPts.map(p => [p[0] + dx, p[1] + dy] as Vec2);
        state._liveUpdateRoomPoints(this.drag.id, newPts);
        break;
      }
      case 'wall-vertex': {
        const _wvDrag = this.drag!;
        if (_wvDrag.kind !== 'wall-vertex') break;
        const newPos: Vec2 = [_wvDrag.origPos[0] + dx, _wvDrag.origPos[1] + dy];
        const scene = state.scenes.find(s => s.id === state.currentSceneId);
        const wall = scene?.walls.find(w => w.id === _wvDrag.wallId);
        if (!wall) break;
        const newStart = _wvDrag.vertex === 'start' ? newPos : [...wall.start] as Vec2;
        const newEnd = _wvDrag.vertex === 'end' ? newPos : [...wall.end] as Vec2;
        state._liveUpdateWall(_wvDrag.wallId, newStart, newEnd);
        break;
      }
      case 'wall-push': {
        // Push wall perpendicular to wall direction
        const wdx = this.drag.origEnd[0] - this.drag.origStart[0];
        const wdy = this.drag.origEnd[1] - this.drag.origStart[1];
        const len = Math.hypot(wdx, wdy) || 1;
        const perp: Vec2 = [-wdy / len, wdx / len];
        const proj = dx * perp[0] + dy * perp[1];
        state._liveUpdateWall(
          this.drag.wallId,
          [this.drag.origStart[0] + perp[0] * proj, this.drag.origStart[1] + perp[1] * proj],
          [this.drag.origEnd[0] + perp[0] * proj, this.drag.origEnd[1] + perp[1] * proj],
        );
        break;
      }
      case 'wall-move': {
        state._liveUpdateWall(
          this.drag.wallId,
          [this.drag.origStart[0] + dx, this.drag.origStart[1] + dy],
          [this.drag.origEnd[0] + dx, this.drag.origEnd[1] + dy],
        );
        break;
      }
    }
  }

  // ── Pointer Up ────────────────────────────────────────────
  private onPointerUp(_event: InteractionEvent): void {
    if (this.isDragging && this.drag) {
      // Commit to history after drag ends
      this.store.getState().saveToHistory();
    }
    this.drag = null;
    this.isDragging = false;
    this.downPos = null;
  }

  // ── Keyboard ──────────────────────────────────────────────
  private onKeyDown(event: InteractionEvent): void {
    if (event.key === 'Escape') {
      this.store.getState().deselectAll();
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      const state = this.store.getState();
      const scene = state.scenes.find(s => s.id === state.currentSceneId);
      if (!scene) return;
      for (const id of [...state.selectedIds]) {
        if (scene.walls.some(w => w.id === id)) state.deleteWall(id);
        else if (scene.rooms.some(r => r.id === id)) state.deleteRoom(id);
        else if (scene.furniture.some(f => f.id === id)) state.deleteFurniture(id);
      }
      state.deselectAll();
      return;
    }

    // R = rotate selected furniture 45°
    if (event.key === 'r' || event.key === 'R') {
      const state = this.store.getState();
      const scene = state.scenes.find(s => s.id === state.currentSceneId);
      if (!scene) return;
      for (const id of state.selectedIds) {
        const furn = scene.furniture.find(f => f.id === id);
        if (furn) {
          const cur = Array.isArray(furn.rotation) ? furn.rotation[1] : furn.rotation as number;
          state.updateFurniture(id, { rotation: [0, (cur + Math.PI / 4) % (Math.PI * 2), 0] });
        }
      }
    }
  }

  // ── Double-click ──────────────────────────────────────────
  private onDoubleClick(event: InteractionEvent): void {
    const hit = this.hitTest(event.position);

    if (hit.type === 'room') {
      this.onPreviewChange({ type: 'rename-room', roomId: hit.id } as any);
      return;
    }

    // Wall body double-click → split wall at that point
    if (hit.type === 'wall') {
      this.splitWall(hit.id, event.position);
      return;
    }
  }

  // ── Split wall at a given point ────────────────────────────
  private splitWall(wallId: string, splitPoint: Vec2): void {
    const state = this.store.getState();
    const scene = state.scenes.find(s => s.id === state.currentSceneId);
    const wall = scene?.walls.find(w => w.id === wallId);
    if (!wall) return;

    // Project click point onto the wall segment
    const ax = wall.end[0] - wall.start[0];
    const ay = wall.end[1] - wall.start[1];
    const len2 = ax * ax + ay * ay;
    if (len2 < 0.01) return; // wall too short

    const t = Math.max(0.05, Math.min(0.95,
      ((splitPoint[0] - wall.start[0]) * ax + (splitPoint[1] - wall.start[1]) * ay) / len2
    ));

    const mid: Vec2 = [
      wall.start[0] + ax * t,
      wall.start[1] + ay * t,
    ];

    // Delete original wall, then add two new segments
    const origStart: Vec2 = [...wall.start] as Vec2;
    const origEnd: Vec2 = [...wall.end] as Vec2;

    state.deleteWall(wallId);
    state.addWall(origStart, mid);
    state.addWall(mid, origEnd);
    state.deselectAll();
  }

  // ── Hit test ──────────────────────────────────────────────
  private hitTest(point: Vec2): HitResult {
    const state = this.store.getState();
    const scene = state.scenes.find(s => s.id === state.currentSceneId);
    if (!scene) return { type: 'none' };

    const selectedIds = state.selectedIds;

    // Priority 1: selected room vertex handles
    for (const room of scene.rooms) {
      if (!selectedIds.includes(room.id)) continue;
      for (let i = 0; i < room.points.length; i++) {
        if (Math.hypot(point[0] - room.points[i][0], point[1] - room.points[i][1]) < VERTEX_R) {
          return { type: 'room-vertex', roomId: room.id, vtxIdx: i };
        }
      }
    }

    // Priority 2: selected room edge midpoint handles
    for (const room of scene.rooms) {
      if (!selectedIds.includes(room.id)) continue;
      for (let i = 0; i < room.points.length; i++) {
        const a = room.points[i];
        const b = room.points[(i + 1) % room.points.length];
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        if (Math.hypot(point[0] - mx, point[1] - my) < EDGE_MID_R) {
          return { type: 'room-edge', roomId: room.id, edgeIdx: i };
        }
      }
    }

    // Priority 3: furniture body (AABB)
    for (let i = scene.furniture.length - 1; i >= 0; i--) {
      const furn = scene.furniture[i];
      if (!furn.visible) continue;
      const _hfp = furn.position;
      const _hfpx = Array.isArray(_hfp) ? _hfp[0] : (_hfp as any).x ?? 0;
      const _hfpz = Array.isArray(_hfp) ? _hfp[2] : (_hfp as any).z ?? 0;
      const _hfdim = furn.dimensions ?? { width: 1, depth: 1, height: 1 };
      const _hfsc = furn.scale ?? [1, 1, 1];
      const halfW = (_hfdim.width * _hfsc[0]) / 2 + 0.05;
      const halfD = (_hfdim.depth * _hfsc[2]) / 2 + 0.05;
      const px = point[0] - _hfpx;
      const pz = point[1] - _hfpz;
      if (Math.abs(px) < halfW && Math.abs(pz) < halfD) {
        return { type: 'furniture', id: furn.id };
      }
    }

    // Priority 4: room body (point-in-polygon, topmost first)
    for (let i = scene.rooms.length - 1; i >= 0; i--) {
      const room = scene.rooms[i];
      if (room.visible === false || room.points.length < 3) continue;
      if (this.pointInPolygon(point, room.points)) {
        return { type: 'room', id: room.id };
      }
    }

    // Priority 5: wall vertex handles
    for (const wall of scene.walls) {
      if (!wall.visible) continue;
      if (Math.hypot(point[0] - wall.start[0], point[1] - wall.start[1]) < VERTEX_R) {
        return { type: 'wall-vertex', wallId: wall.id, vertex: 'start' };
      }
      if (Math.hypot(point[0] - wall.end[0], point[1] - wall.end[1]) < VERTEX_R) {
        return { type: 'wall-vertex', wallId: wall.id, vertex: 'end' };
      }
    }

    // Priority 6: selected wall midpoint handles
    for (const wall of scene.walls) {
      if (!selectedIds.includes(wall.id)) continue;
      const mx = (wall.start[0] + wall.end[0]) / 2;
      const my = (wall.start[1] + wall.end[1]) / 2;
      if (Math.hypot(point[0] - mx, point[1] - my) < EDGE_MID_R) {
        return { type: 'wall-midpoint', wallId: wall.id };
      }
    }

    // Priority 7: wall body
    for (const wall of scene.walls) {
      if (!wall.visible) continue;
      const dist = this.segmentDist(point, wall.start, wall.end);
      if (dist < wall.thickness / 2 + WALL_HIT_TOL) {
        return { type: 'wall', id: wall.id };
      }
    }

    return { type: 'none' };
  }

  // ── Helpers ───────────────────────────────────────────────
  private hitToId(hit: HitResult): string | null {
    switch (hit.type) {
      case 'furniture': return hit.id;
      case 'room': return hit.id;
      case 'room-vertex': return hit.roomId;
      case 'room-edge': return hit.roomId;
      case 'wall': return hit.id;
      case 'wall-vertex': return hit.wallId;
      case 'wall-midpoint': return hit.wallId;
      default: return null;
    }
  }

  private cursorForHit(hit: HitResult): string {
    switch (hit.type) {
      case 'room-vertex':
      case 'wall-vertex': return 'crosshair';
      case 'room-edge':
      case 'wall-midpoint': return 'ns-resize';
      case 'furniture':
      case 'room':
      case 'wall': return 'move';
      default: return 'default';
    }
  }

  private pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
    const [px, py] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  private segmentDist(p: Vec2, a: Vec2, b: Vec2): number {
    const ax = b[0] - a[0], ay = b[1] - a[1];
    const len2 = ax * ax + ay * ay;
    if (len2 < 1e-10) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ax + (p[1] - a[1]) * ay) / len2));
    return Math.hypot(p[0] - (a[0] + t * ax), p[1] - (a[1] + t * ay));
  }
}
