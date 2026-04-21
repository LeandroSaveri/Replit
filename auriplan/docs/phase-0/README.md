# Fase 0 — Foundation & Governance (execução)

Este documento registra a execução da **Fase 0** para estabilizar a base e preparar as próximas fases do produto.

## Objetivos da Fase 0

1. Tornar explícita a diferença entre:
   - **gate obrigatório atual** (core geométrico + estado), e
   - **qualidade alvo** (typecheck full-repo).
2. Restaurar configuração principal de TypeScript para o escopo completo (`src/**/*`).
3. Formalizar baseline de inconsistências atuais para correção incremental por trilhas.

## O que foi executado

- `tsconfig.json` voltou a representar o escopo real da aplicação (`src/**/*`).
- Criado `tsconfig.core.json` para gate incremental do core.
- Scripts de package padronizados:
  - `typecheck` e `typecheck:core`: gate obrigatório atual.
  - `typecheck:full`: diagnóstico completo da aplicação.
- Baseline de erros documentada em `docs/phase-0/typecheck-baseline.md`.

## Gates de qualidade (temporários)

- **Obrigatório para merge**:
  - `npm run typecheck:core`
  - `npm run build:ci`
- **Diagnóstico obrigatório por PR (não bloqueante até Fase 1.5)**:
  - `npm run typecheck:full`

## Critérios para encerrar a Fase 0

- [x] Escopo de `tsconfig.json` representando o app real.
- [x] Gate incremental definido e reproduzível.
- [x] Baseline de dívida técnica tipada por domínio.
- [ ] Pipeline CI separado por trilhas (`core` e `full`) com políticas de bloqueio graduais.

## Próximo passo imediato

Executar Fase 1 de remediação por trilhas com prioridade:
1. Contratos de ações (AI/AR/editor)
2. Tool handlers do editor
3. Integração App/UI com store
