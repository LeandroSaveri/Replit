// ============================================================
// ScanModal — Auto-Scan (câmera) + Desenho Manual estilo MagicPlan
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '@store/editorStore';
import {
  Camera, X, CheckCircle2, AlertCircle, RotateCcw,
  Pencil, ChevronRight, ChevronLeft, ZoomIn, Maximize2,
  Info, MapPin, Square, Trash2, Play, Scan,
} from 'lucide-react';
import type { Vec2 } from '@auriplan-types';

/* ── palette for generated rooms ── */
const ROOM_PALETTE: { floor: string; wall: string }[] = [
  { floor: '#dbeafe', wall: '#93c5fd' },
  { floor: '#dcfce7', wall: '#86efac' },
  { floor: '#fef9c3', wall: '#fde047' },
  { floor: '#fce7f3', wall: '#f9a8d4' },
  { floor: '#ede9fe', wall: '#c4b5fd' },
  { floor: '#ffedd5', wall: '#fdba74' },
];

/* ── utilities ── */
const genId = () => Math.random().toString(36).slice(2, 10);

function polygonArea(pts: Vec2[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  }
  return Math.abs(a / 2);
}

/* ── types ── */
type Mode = 'select' | 'camera' | 'manual';

interface ManualRoom {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  shape: 'rect' | 'l-shape';
}

const ROOM_TYPES = [
  { id: 'bedroom', label: 'Quarto' },
  { id: 'living', label: 'Sala' },
  { id: 'kitchen', label: 'Cozinha' },
  { id: 'bathroom', label: 'Banheiro' },
  { id: 'office', label: 'Escritório' },
  { id: 'garage', label: 'Garagem' },
  { id: 'other', label: 'Outro' },
];

/* ============================================================
   Manual Room Card
   ============================================================ */
function RoomCard({
  room,
  onUpdate,
  onDelete,
  index,
}: {
  room: ManualRoom;
  onUpdate: (r: ManualRoom) => void;
  onDelete: () => void;
  index: number;
}) {
  const palette = ROOM_PALETTE[index % ROOM_PALETTE.length];
  const area = room.width * room.height;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-slate-200 overflow-hidden"
      style={{ backgroundColor: palette.floor + 'cc' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: palette.wall + '66' }}>
        <div className="flex items-center gap-2">
          <Square className="w-4 h-4" style={{ color: palette.wall }} />
          <input
            value={room.name}
            onChange={e => onUpdate({ ...room, name: e.target.value })}
            className="font-semibold text-slate-800 bg-transparent border-none outline-none text-sm w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">{area.toFixed(1)} m²</span>
          <button onClick={onDelete} className="p-1 hover:bg-white/40 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Type */}
        <div className="flex flex-wrap gap-1">
          {ROOM_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => onUpdate({ ...room, type: t.id })}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                room.type === t.id
                  ? 'border-slate-600 bg-slate-700 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-500 block mb-1">Largura (m)</span>
            <input
              type="number"
              min={0.5}
              max={50}
              step={0.1}
              value={room.width}
              onChange={e => onUpdate({ ...room, width: Math.max(0.5, parseFloat(e.target.value) || 1) })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/70 text-slate-800 focus:outline-none focus:border-blue-400"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 block mb-1">Comprimento (m)</span>
            <input
              type="number"
              min={0.5}
              max={50}
              step={0.1}
              value={room.height}
              onChange={e => onUpdate({ ...room, height: Math.max(0.5, parseFloat(e.target.value) || 1) })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/70 text-slate-800 focus:outline-none focus:border-blue-400"
            />
          </label>
        </div>

        {/* Shape */}
        <div className="flex gap-2">
          {([{ id: 'rect', label: 'Retangular' }, { id: 'l-shape', label: 'Forma-L' }] as const).map(s => (
            <button
              key={s.id}
              onClick={() => onUpdate({ ...room, shape: s.id })}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                room.shape === s.id
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   Camera Scan View
   ============================================================ */
function CameraScan({ onApply, onBack }: { onApply: (pts: Vec2[]) => void; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async (facingMode: 'environment' | 'user') => {
    try {
      setError(null);
      setLoading(true);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível acessar a câmera.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startCamera(facing);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [facing, startCamera]);

  const handleOverlayTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPoints(prev => [...prev, { x, y }]);
  };

  // Draw points & polygon on overlay
  useEffect(() => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const px = points.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height }));

    if (px.length > 1) {
      ctx.beginPath();
      ctx.moveTo(px[0].x, px[0].y);
      for (let i = 1; i < px.length; i++) ctx.lineTo(px[i].x, px[i].y);
      if (px.length > 2) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(59,130,246,0.15)';
        ctx.fill();
      }
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    px.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 0 ? 12 : 8, 0, 2 * Math.PI);
      ctx.fillStyle = i === 0 ? '#f59e0b' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), p.x, p.y);
    });
  }, [points]);

  const applyPoints = () => {
    if (points.length < 3) return;
    // Convert normalized screen coords to world coords (assume 10m x 10m for now)
    const scale = 10;
    const worldPts: Vec2[] = points.map(p => [
      (p.x - 0.5) * scale,
      (0.5 - p.y) * scale,
    ]);
    onApply(worldPts);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <h3 className="font-semibold text-slate-800">Scan com Câmera</h3>
        <button
          onClick={() => setFacing(f => f === 'environment' ? 'user' : 'environment')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Inverter câmera"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Camera */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-white font-medium mb-1">Câmera indisponível</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => startCamera(facing)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full"
              style={{ touchAction: 'none' }}
              onPointerDown={handleOverlayTap}
            />
          </>
        )}

        {/* Instruction overlay */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white text-xs px-4 py-2 rounded-full pointer-events-none">
          {points.length === 0
            ? 'Toque nos cantos do cômodo para marcar'
            : `${points.length} ponto${points.length > 1 ? 's' : ''} marcado${points.length > 1 ? 's' : ''} • Toque para adicionar mais`}
        </div>

        {/* Point count badge */}
        {points.length > 0 && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            {points.length}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
        <button
          onClick={() => setPoints([])}
          disabled={points.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Apagar
        </button>
        <button
          onClick={() => setPoints(p => p.slice(0, -1))}
          disabled={points.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Desfazer
        </button>
        <div className="flex-1" />
        <button
          onClick={applyPoints}
          disabled={points.length < 3}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Aplicar ({points.length})
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Manual Scan View
   ============================================================ */
function ManualScan({ onApply, onBack }: { onApply: (rooms: ManualRoom[]) => void; onBack: () => void }) {
  const [rooms, setRooms] = useState<ManualRoom[]>([
    { id: genId(), name: 'Sala', type: 'living', width: 5, height: 4, shape: 'rect' },
    { id: genId(), name: 'Quarto', type: 'bedroom', width: 4, height: 3.5, shape: 'rect' },
  ]);

  const addRoom = () => {
    setRooms(prev => [...prev, {
      id: genId(),
      name: `Cômodo ${prev.length + 1}`,
      type: 'other',
      width: 3,
      height: 3,
      shape: 'rect',
    }]);
  };

  const updateRoom = (id: string, data: ManualRoom) =>
    setRooms(prev => prev.map(r => r.id === id ? data : r));

  const deleteRoom = (id: string) =>
    setRooms(prev => prev.filter(r => r.id !== id));

  const totalArea = rooms.reduce((s, r) => s + r.width * r.height, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="text-center">
          <h3 className="font-semibold text-slate-800">Desenho Manual</h3>
          <p className="text-xs text-slate-500">{rooms.length} cômodo{rooms.length !== 1 ? 's' : ''} · {totalArea.toFixed(1)} m²</p>
        </div>
        <button
          onClick={addRoom}
          className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          + Adicionar
        </button>
      </div>

      {/* Info banner */}
      <div className="mx-4 mt-3 p-3 bg-blue-50 rounded-xl flex items-start gap-2.5 text-xs text-blue-700">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Informe as dimensões de cada cômodo. A planta será gerada automaticamente.</span>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {rooms.map((room, i) => (
            <RoomCard
              key={room.id}
              room={room}
              index={i}
              onUpdate={data => updateRoom(room.id, data)}
              onDelete={() => deleteRoom(room.id)}
            />
          ))}
        </AnimatePresence>
        {rooms.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Square className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum cômodo. Clique em "Adicionar".</p>
          </div>
        )}
      </div>

      {/* Apply button */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <button
          onClick={() => onApply(rooms)}
          disabled={rooms.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5" />
          Gerar Planta ({rooms.length} cômodo{rooms.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Success screen
   ============================================================ */
function SuccessScreen({ roomCount, wallCount }: { roomCount: number; wallCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </motion.div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Planta criada!</h3>
      <p className="text-slate-500 text-sm">
        {roomCount} cômodo{roomCount !== 1 ? 's' : ''} · {wallCount} parede{wallCount !== 1 ? 's' : ''} geradas
      </p>
    </motion.div>
  );
}

/* ============================================================
   Mode Select Screen
   ============================================================ */
function ModeSelect({ onCamera, onManual }: { onCamera: () => void; onManual: () => void }) {
  const hasCamera = !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="p-6 space-y-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Scan className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Escanear Cômodo</h3>
        <p className="text-slate-500 text-sm mt-1">Escolha como deseja criar sua planta baixa</p>
      </div>

      {/* Camera option */}
      <button
        onClick={onCamera}
        disabled={!hasCamera}
        className="w-full p-5 rounded-2xl border-2 border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 text-left transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-800">Auto-Scan com Câmera</span>
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                {hasCamera ? 'Recomendado' : 'Indisponível'}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {hasCamera
                ? 'Aponte a câmera para os cantos do cômodo e toque para marcar os pontos.'
                : 'Câmera não disponível neste dispositivo ou navegador.'}
            </p>
          </div>
          {hasCamera && <ChevronRight className="w-5 h-5 text-blue-400 shrink-0 self-center" />}
        </div>
      </button>

      {/* Manual option */}
      <button
        onClick={onManual}
        className="w-full p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-left transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Pencil className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-1">Desenho Manual</p>
            <p className="text-sm text-slate-500">
              Informe as dimensões de cada cômodo manualmente. Ideal para criar planta a partir de uma medição.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 self-center" />
        </div>
      </button>

      {/* Tip */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
        <span>Dica: Use o <strong>Scan com Câmera</strong> para obter as proporções corretas do cômodo, depois ajuste as dimensões manualmente.</span>
      </div>
    </div>
  );
}

/* ============================================================
   ScanModal — main component
   ============================================================ */
interface ScanModalProps {
  onClose: () => void;
}

export function ScanModal({ onClose }: ScanModalProps) {
  const [mode, setMode] = useState<Mode>('select');
  const [done, setDone] = useState<{ rooms: number; walls: number } | null>(null);
  /* Apply camera scan result */
  const applyCameraScan = (pts: Vec2[]) => {
    const store = useEditorStore.getState();
    const palette = ROOM_PALETTE[0];
    const sceneId = store.currentSceneId;

    store.addRoom(pts);
    // Get the newly added room (last one)
    const scene = useEditorStore.getState().scenes.find(s => s.id === sceneId);
    const newRoom = scene?.rooms[scene.rooms.length - 1];
    if (newRoom) {
      store.updateRoom(newRoom.id, {
        name: 'Cômodo escaneado',
        type: 'custom',
        floorColor: palette.floor,
        wallColor: palette.wall,
      });
    }

    let walls = 0;
    for (let i = 0; i < pts.length; i++) {
      store.addWall(pts[i], pts[(i + 1) % pts.length]);
      walls++;
    }
    setDone({ rooms: 1, walls });
    setTimeout(onClose, 2000);
  };

  /* Apply manual rooms */
  const applyManualRooms = (rooms: ManualRoom[]) => {
    const store = useEditorStore.getState();
    const sceneId = store.currentSceneId;
    let originX = 0;
    let totalWalls = 0;

    rooms.forEach((room, idx) => {
      const palette = ROOM_PALETTE[idx % ROOM_PALETTE.length];
      const x0 = originX;
      const y0 = 0;
      const w = room.width;
      const h = room.height;

      let pts: Vec2[];
      if (room.shape === 'l-shape') {
        pts = [
          [x0, y0], [x0 + w, y0], [x0 + w, y0 + h * 0.5],
          [x0 + w * 0.5, y0 + h * 0.5], [x0 + w * 0.5, y0 + h], [x0, y0 + h],
        ];
      } else {
        pts = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]];
      }

      store.addRoom(pts);
      const scene = useEditorStore.getState().scenes.find(s => s.id === sceneId);
      const newRoom = scene?.rooms[scene.rooms.length - 1];
      if (newRoom) {
        store.updateRoom(newRoom.id, {
          name: room.name,
          type: room.type as import('@auriplan-types').RoomType,
          floorColor: palette.floor,
          wallColor: palette.wall,
        });
      }

      for (let i = 0; i < pts.length; i++) {
        store.addWall(pts[i], pts[(i + 1) % pts.length]);
        totalWalls++;
      }

      originX += w + 0.5;
    });

    setDone({ rooms: rooms.length, walls: totalWalls });
    setTimeout(onClose, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', height: mode === 'camera' ? '90vh' : 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        {!done && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="success" className="flex-1">
              <SuccessScreen roomCount={done.rooms} wallCount={done.walls} />
            </motion.div>
          ) : mode === 'select' ? (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ModeSelect onCamera={() => setMode('camera')} onManual={() => setMode('manual')} />
            </motion.div>
          ) : mode === 'camera' ? (
            <motion.div key="camera" className="flex-1 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CameraScan onApply={applyCameraScan} onBack={() => setMode('select')} />
            </motion.div>
          ) : (
            <motion.div key="manual" className="flex-1 flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ManualScan onApply={applyManualRooms} onBack={() => setMode('select')} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
