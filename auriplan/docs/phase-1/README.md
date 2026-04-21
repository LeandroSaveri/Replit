# Fase 1 — Remediação de integração (execução)

## Objetivo
Corrigir inconsistências de integração entre contratos de ação, store e handlers do editor, sem quebrar o comportamento já validado do core geométrico.

## Escopo executado

### 1) Contrato AI/AR
- `EditorActionContract` expandido para suportar compatibilidade real de payloads (`id` opcional em `createWall`/`createRoom`, alias `type` em `createRoom`) e ação `setMetadata`.
- Tipos de `RoomScanConverter` exportados (`FloorPlanData`, `WallData`, `RoomData`) para eliminar inconsistência em `ar/index`.

### 2) Compatibilidade Store/UI
- Adicionadas APIs legadas no `EditorState` para consumidores antigos:
  - `updateWall`, `updateRoom`, `addRoom`, `addWallsBatch`, `createWallsFromPolygon`.
- Implementações adicionadas no store com histórico e defaults coerentes.

### 3) Compatibilidade Handlers legados
- `InteractionEvent` agora inclui `worldPosition` (compat).
- `SnapResult` expõe `x`/`y` (compat).
- `SelectToolHandler` e `WallToolHandler` foram reescritos para aderir ao contrato atual de `ToolHandler` e `ToolManager`.

### 4) Tipagem transversal
- Ajustes em `GeneratedFloorPlan` para alinhamento com `AIAssistant`.
- Ajustes de tipagem em `App`/`Sidebar` e declarações de módulo (`vitest`) para estabilidade de compilação.

## Resultado
- `typecheck:full` passou sem erros.
- `typecheck:core` passou.
- `build:ci` passou.

## Próximo passo (Fase 2)
- Trocar adapters de compatibilidade temporária por APIs finais de domínio.
- Adicionar testes automatizados de integração (AI/AR -> ações -> store -> pipeline).
