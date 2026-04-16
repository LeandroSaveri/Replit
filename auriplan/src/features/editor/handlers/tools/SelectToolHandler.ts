// ============================================================
// SelectToolHandler.ts – trechos modificados (dentro da classe)
// ============================================================

// Adicione esta propriedade na classe:
private selectedRoomId: string | null = null;

// No método onPointerDown, modifique o case 'room':
case 'room': {
  const room = scene.rooms.find(r => r.id === hit.id);
  if (!room) return;
  state.select(hit.id, addToSel);
  this.selectedRoomId = hit.id;
  // Zoom no cômodo (clique simples)
  state.zoomToRoom(hit.id);
  // Armazena as paredes originais do cômodo para movimento
  const roomWalls = scene.walls.filter(w =>
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

// No método onPointerMove, dentro do switch, adicione o case 'room':
case 'room': {
  const drag = this.drag;
  const dx = pos[0] - drag.ds[0];
  const dy = pos[1] - drag.ds[1];
  // Atualiza visualização do polígono
  const newPts = drag.origPts.map(p => [p[0] + dx, p[1] + dy] as Vec2);
  state._liveUpdateRoomPoints(drag.id, newPts);
  // Não atualiza paredes durante o arrasto (apenas no final)
  break;
}

// No método onPointerUp, dentro do switch, modifique o case 'room':
case 'room': {
  const drag = this.drag;
  const dx = pos[0] - drag.ds[0];
  const dy = pos[1] - drag.ds[1];
  if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
    const updates: Array<{ id: string; start: Vec2; end: Vec2 }> = [];
    for (const origWall of drag.origWalls) {
      updates.push({
        id: origWall.id,
        start: [origWall.start[0] + dx, origWall.start[1] + dy],
        end: [origWall.end[0] + dx, origWall.end[1] + dy]
      });
    }
    state.updateWallsBatch(updates);
  }
  break;
}

// No método reset(), limpe selectedRoomId:
reset(): void {
  this.drag = null;
  this.isDragging = false;
  this.downPos = null;
  this.selectedRoomId = null;
  this.onPreviewChange(null);
}
