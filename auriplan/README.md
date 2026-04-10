# AuriPlan — Interior Design Planner

Ferramenta profissional de design de interiores com editor de planta 2D, visualizacao 3D, biblioteca de moveis e colaboracao em tempo real.

---

## Funcionalidades

- **Editor de Planta 2D** — Paredes, portas e janelas com snap-to-grid e guias de medicao
- **Visualizacao 3D** — Three.js em tempo real com iluminacao, sombras e controles de orbita
- **Biblioteca de Moveis** — Drag-and-drop, categorias, busca e upload de assets
- **Templates** — Apartamento, Casa, Studio, Escritorio
- **Colaboracao em Tempo Real** — Yjs + WebSocket CRDT multi-usuario
- **Exportacao** — PDF (jsPDF), DXF/SVG via file-saver
- **Undo/Redo** — Historico baseado em Immer
- **i18n** — Portugues e Ingles via i18next

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19 + Vite 6 |
| Estado | Zustand 4 + Immer 10 |
| 3D | Three.js 0.169 + React Three Fiber 9 + Drei 10 |
| Estilo | Tailwind CSS v3 + PostCSS |
| UI | Radix UI |
| Rotas | React Router v7 |
| Colaboracao | Yjs + y-websocket |
| i18n | i18next + react-i18next |
| Exportacao | jsPDF + file-saver |

---

## Requisitos

- **Node.js** >= 18 (recomendado 20+)
- **npm** >= 9

---

## 1. Desenvolvimento Local

```bash
# Clone o repositorio
git clone https://github.com/seu-usuario/auriplan.git
cd auriplan

# Instale as dependencias
npm install

# Copie variaveis de ambiente (opcional)
cp .env.example .env

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

---

## 2. Build de Producao

```bash
# Build completo com typecheck
npm run build

# Build rapido (sem typecheck - usado no CI/CD)
npm run build:ci

# Preview local do build
npm run preview
```

Saida gerada em: `dist/`

---

## 3. Deploy na Vercel

### Via Dashboard (recomendado)

1. Acesse https://vercel.com e faca login
2. Clique em **"Add New Project"**
3. Importe o repositorio do GitHub
4. Configure:
   - **Build Command**: `npm run build:ci`
   - **Output Directory**: `dist`
   - **Framework Preset**: Vite
5. Clique em **"Deploy"**

### Via CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

> O arquivo `vercel.json` ja esta configurado com rewrites para SPA.

---

## 4. Deploy no Render

### Via Dashboard

1. Acesse https://render.com e faca login
2. Clique em **"New" > "Static Site"**
3. Conecte o repositorio GitHub
4. Configure:
   - **Build Command**: `npm install && npm run build:ci`
   - **Publish Directory**: `dist`
5. Em **Redirects/Rewrites** adicione:
   - Source: `/*` | Destination: `/index.html` | Action: **Rewrite**
6. Clique em **"Create Static Site"**

### Via render.yaml (Blueprint automatico)

O arquivo `render.yaml` ja esta incluido. O Render detecta automaticamente ao conectar o repositorio.

---

## 5. Deploy no Replit

1. Abra https://replit.com e crie um novo Repl do tipo **"Import from GitHub"**
2. Cole a URL do repositorio
3. No Shell do Replit, execute:

```bash
npm install
npm run build:ci
```

4. Configure o comando de inicio: `npm run preview`
5. Clique em **"Run"**

Ou use diretamente em modo dev:

```bash
npm run dev
```

---

## 6. Deploy com Docker

```bash
# Build da imagem
docker build -t auriplan .

# Rodar localmente
docker run -p 80:80 auriplan
```

Acesse: http://localhost

Compativel com: Railway, Fly.io, Google Cloud Run, AWS ECS, DigitalOcean App Platform.

---

## Estrutura do Projeto

```
auriplan/
├── public/               # Assets estaticos (favicon, manifest, og image)
├── src/
│   ├── ai/               # Servicos de IA (sugestoes, NLP, geracao de planta)
│   ├── analytics/        # Tracking de eventos
│   ├── app/              # App.tsx raiz, routes, styles
│   ├── ar/               # Realidade aumentada (WebXR)
│   ├── autosave/         # Salvamento automatico
│   ├── components/       # Componentes UI (Radix + Tailwind)
│   ├── config/           # Constantes e configuracao CDN
│   ├── core/             # Logica de negocios (serializer, history)
│   ├── engine/           # Motor canvas 2D e rendering 3D
│   ├── export/           # Exportacao PDF/DXF/SVG
│   ├── features/         # Modulos: editor, dashboard, auth, templates
│   ├── hooks/            # React hooks compartilhados
│   ├── i18n/             # Internacionalizacao pt/en
│   ├── library/          # Biblioteca de moveis e materiais
│   ├── model/            # Modelos de dominio (Scene, Wall, Room, Furniture)
│   ├── pages/            # Paginas (not-found)
│   ├── plugins/          # Plugins extensiveis
│   ├── rendering/        # Pipeline de renderizacao (HDRI, post-processing)
│   ├── services/         # Clientes de assets e API
│   ├── store/            # Zustand stores (editorStore)
│   ├── styles/           # index.css (Tailwind base + custom)
│   ├── types/            # Definicoes TypeScript globais
│   ├── utils/            # Geometria, cores, constantes, validacao
│   ├── workers/          # Web Workers (render, geometry, snap, floorplan)
│   └── main.tsx          # Entry point
├── .env.example          # Template de variaveis de ambiente
├── .gitignore            # Arquivos ignorados pelo Git
├── Dockerfile            # Build Docker multi-stage (nginx)
├── index.html            # HTML principal
├── nginx.conf            # Config nginx para Docker
├── package.json          # Dependencias e scripts
├── postcss.config.js     # PostCSS (Tailwind + Autoprefixer)
├── render.yaml           # Blueprint automatico Render.com
├── tailwind.config.js    # Tailwind CSS v3
├── tsconfig.json         # TypeScript (standalone, sem monorepo)
├── vercel.json           # Config Vercel
└── vite.config.ts        # Vite (sem plugins Replit)
```

---

## Variaveis de Ambiente

| Variavel | Descricao | Obrigatoria |
|----------|-----------|-------------|
| `VITE_API_URL` | URL da API backend | Nao |
| `VITE_WS_URL` | URL WebSocket colaboracao | Nao |

---

## Path Aliases

| Alias | Resolve para |
|-------|-------------|
| `@/*` | `src/*` |
| `@app/*` | `src/app/*` |
| `@core/*` | `src/core/*` |
| `@engine/*` | `src/engine/*` |
| `@components/*` | `src/components/*` |
| `@ui/*` | `src/components/ui/*` |
| `@store/*` | `src/store/*` |
| `@model/*` | `src/model/*` |
| `@hooks/*` | `src/hooks/*` |
| `@utils/*` | `src/utils/*` |
| `@features/*` | `src/features/*` |
| `@services/*` | `src/services/*` |
| `@library/*` | `src/library/*` |
| `@workers/*` | `src/workers/*` |
| `@auriplan-types` | `src/types/index.ts` |
