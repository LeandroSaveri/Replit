# Auditoria técnica completa — 2026-04-19

## Escopo e metodologia
- Projeto auditado: `auriplan`.
- Estratégia aplicada:
  1. Build de produção sem typecheck (`npm run build:ci`) para validar empacotamento.
  2. Typecheck completo (`npm run typecheck`) para detectar inconsistências de tipagem/arquitetura.
  3. Inspeção direta de arquivo com falha de parsing/sintaxe.

## Erro crítico encontrado e corrigido
### 1) Arquivo corrompido com conteúdo inválido para TypeScript
- Arquivo: `src/core/interaction/InteractionEngine.ts`
- Sintoma: múltiplos erros `TS1127 Invalid character`, `TS1109 Expression expected`, `TS1002 Unterminated string literal`.
- Causa raiz: havia cabeçalho e estrutura de string de estilo Python no início do arquivo (`# ...` e `interaction_engine = '''`), inválidos em `.ts`.
- Correção aplicada: removido o prefixo corrompido e mantido o módulo TypeScript válido iniciando em `import type { Vec2 } ...`.

## Resultado dos checks
### Build (`npm run build:ci`)
- **Status:** PASSOU.
- Observação: warnings de chunking por imports dinâmicos/estáticos em módulos de geometria, sem bloquear build.

### Typecheck (`npm run typecheck`)
- **Status:** FALHOU (não bloqueado por sintaxe após correção; agora com erros estruturais de tipos/API).
- Volume: dezenas de erros em múltiplos domínios.

## Principais classes de erro identificadas
1. **Exports/imports inconsistentes**
   - Ex.: membros não exportados/importados em `src/ai/index.ts`, `src/ar/index.ts`, `src/engine/render3d/index.ts`, `src/core/index.ts`.
2. **Contratos de tipos divergentes entre domínios**
   - Ex.: `Room` de `RoomDetectionEngine` incompatível com `Room` de `src/types/index.ts` (campo `name` ausente).
3. **Ações e payloads fora do contrato**
   - Ex.: `EditorAction` recebendo `payload` com campos não permitidos (`id`, `source`) e `type` inválido (`setMetadata`).
4. **Store API incompatível com consumo da UI**
   - Ex.: métodos esperados (`addRoom`, `updateRoom`, `addWallsBatch`) ausentes no tipo `EditorState` em componentes/modais.
5. **Handlers/ferramentas com interfaces quebradas**
   - Ex.: `SelectToolHandler` e `WallToolHandler` usam propriedades/métodos inexistentes (`worldPosition`, `emit`, etc.).
6. **Configuração de testes incompleta**
   - Ex.: `vitest` ausente para `src/__tests__/setup.ts`.

## Recomendação de priorização
1. **P0:** consolidar contratos centrais (`EditorState`, `EditorAction`, `Room`, `Wall`) e alinhar callers.
2. **P0:** corrigir exports/imports quebrados para restabelecer integridade do grafo de módulos.
3. **P1:** refatorar handlers de ferramentas para aderirem às interfaces reais (`ToolHandler`, `InteractionEvent`, `SnapResult`).
4. **P1:** normalizar camada AR para payloads válidos do editor.
5. **P2:** fechar lacunas de setup de testes (dependências e tipos).

## Nota
- A auditoria detectou erros de compilação de tipos significativos além do erro crítico de corrupção de arquivo já corrigido.
