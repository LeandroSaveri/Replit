# Baseline de TypeScript (full-repo)

Data de coleta: 2026-04-20
Comando: `npm run typecheck:full`

## Resumo

O diagnóstico full-repo ainda apresenta erros concentrados em 4 grupos principais.

## Grupo A — Contrato de ações AI/AR (prioridade P0)

- `src/ar/RoomScanConverter.ts`
  - payloads incompatíveis com `EditorActionContract` (`id` em `createWall/createRoom`)
  - ação `setMetadata` inexistente no contrato
- `src/ar/index.ts`
  - exports de tipos internos não exportados

## Grupo B — API de Store x UI/Engine (prioridade P0)

- `src/engine/floorplan/FloorPlanGenerator.ts`
  - espera métodos que não existem em `EditorState` (`addRoom`, `updateRoom`, `createWallsFromPolygon`)
- `src/features/editor/components/*`
  - componentes esperam métodos e propriedades não expostos no store atual

## Grupo C — Tool handlers legados (prioridade P1)

- `src/features/editor/handlers/tools/SelectToolHandler.ts`
- `src/features/editor/handlers/tools/WallToolHandler.ts`

Principais sintomas:
- extensões/implements incorretos
- uso de campos inexistentes em `InteractionEvent` (`worldPosition`)
- uso de métodos inexistentes no `GeometryController` atual

## Grupo D — UI typing e setup de testes (prioridade P2)

- `src/app/App.tsx` erros pontuais de tipagem de props/assinaturas
- `src/__tests__/setup.ts` dependência de `vitest` ausente no ambiente atual

## Estratégia de correção

1. Corrigir contrato central (`EditorActionContract`) e adaptadores AI/AR.
2. Alinhar API pública de `EditorState` com os consumidores reais (UI/engine).
3. Migrar handlers legados para o pipeline canônico (`ToolManager` + `GeometryController`).
4. Fechar lacunas de tipagem de UI e setup de testes.
