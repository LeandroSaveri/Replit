// ============================================================
// AddRoomModal — Modal "Adicionar um cômodo" com formatos pré-definidos
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Square, PenLine, Layers, Grid3X3 } from 'lucide-react';
import { useEditorStore } from '@store/editorStore';
import type { Vec2 } from '@auriplan-types';

interface AddRoomModalProps {
  onClose: () => void;
  onScan: () => void;
}

type View = 'main' | 'fill' | 'roomTypes' | 'shapes';

const ROOM_TYPES_RESIDENTIAL = [
  'Cozinha', 'Sala de Jantar', 'Sala de Estar', 'Hall de Entrada',
  'Dormitório', 'Dormitório Primário', 'Dormitório para crianças',
  'Banheiro', 'Meia casa de banho', 'Armário', 'Escritório',
  'Sala da Música', 'Sacada', 'Garagem', 'Corredor', 'Lavanderia',
];

const ROOM_TYPES_COMMERCIAL = [
  'Recepção', 'Sala de Reuniões', 'Escritório Privativo', 'Copa',
  'Depósito', 'Banheiro', 'Corredor', 'Área Técnica',
];

// Dimensões padrão por tipo e formato (em metros)
const ROOM_DIMENSIONS: Record<string, Record<string, { width: number; depth: number; lCut?: { width: number; depth: number } }>> = {
  'Sala de Estar': {
    retangular: { width: 5.0, depth: 4.0 },
    quadrado: { width: 4.5, depth: 4.5 },
    l: { width: 5.0, depth: 4.0, lCut: { width: 2.0, depth: 2.0 } },
  },
  'Dormitório': {
    retangular: { width: 4.0, depth: 3.5 },
    quadrado: { width: 3.5, depth: 3.5 },
  },
  'Cozinha': {
    retangular: { width: 3.5, depth: 3.0 },
    l: { width: 3.5, depth: 3.0, lCut: { width: 1.5, depth: 1.5 } },
  },
  'Banheiro': {
    retangular: { width: 2.5, depth: 2.0 },
    quadrado: { width: 2.0, depth: 2.0 },
  },
  // Fallback para outros tipos
  default: {
    retangular: { width: 4.0, depth: 3.0 },
    quadrado: { width: 3.5, depth: 3.5 },
  },
};

// Paleta de cores para os cômodos
const ROOM_PALETTE: { floor: string; wall: string }[] = [
  { floor: '#dbeafe', wall: '#93c5fd' },
  { floor: '#dcfce7', wall: '#86efac' },
  { floor: '#fef9c3', wall: '#fde047' },
  { floor: '#fce7f3', wall: '#f9a8d4' },
  { floor: '#ede9fe', wall: '#c4b5fd' },
  { floor: '#ffedd5', wall: '#fdba74' },
];

function generateRoomPoints(
  shape: 'retangular' | 'quadrado' | 'l',
  width: number,
  depth: number,
  lCut?: { width: number; depth: number }
): Vec2[] {
  const x0 = 0;
  const y0 = 0;
  if (shape === 'l' && lCut) {
    return [
      [x0, y0],
      [x0 + width, y0],
      [x0 + width, y0 + lCut.depth],
      [x0 + lCut.width, y0 + lCut.depth],
      [x0 + lCut.width, y0 + depth],
      [x0, y0 + depth],
    ];
  }
  return [
    [x0, y0],
    [x0 + width, y0],
    [x0 + width, y0 + depth],
    [x0, y0 + depth],
  ];
}

export function AddRoomModal({ onClose, onScan }: AddRoomModalProps) {
  const [view, setView] = useState<View>('main');
  const [roomCategory, setRoomCategory] = useState<'Residencial' | 'Comercial'>('Residencial');
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const { addRoom, addWall } = useEditorStore();

  const handleAddSquareRoom = () => {
    setView('roomTypes');
  };

  const handleDrawRoom = () => {
    useEditorStore.getState().setTool('wall');
    onClose();
  };

  const handleRoomTypeSelect = (roomType: string) => {
    setSelectedRoomType(roomType);
    setView('shapes');
  };

  const handleShapeSelect = (shape: 'retangular' | 'quadrado' | 'l') => {
    if (!selectedRoomType) return;

    const dims = ROOM_DIMENSIONS[selectedRoomType]?.[shape] || ROOM_DIMENSIONS.default[shape];
    if (!dims) return;

    const points = generateRoomPoints(shape, dims.width, dims.depth, 'lCut' in dims ? dims.lCut : undefined);
    const palette = ROOM_PALETTE[Math.floor(Math.random() * ROOM_PALETTE.length)];

    // Adiciona o cômodo
    addRoom(points);
    const state = useEditorStore.getState();
    const scene = state.scenes.find(s => s.id === state.currentSceneId);
    const newRoom = scene?.rooms[scene.rooms.length - 1];
    if (newRoom) {
      useEditorStore.getState().updateRoom(newRoom.id, {
        name: selectedRoomType,
        type: selectedRoomType.toLowerCase().replace(/\s+/g, '_') as any,
        floorColor: palette.floor,
        wallColor: palette.wall,
      });
    }

    // Adiciona as paredes
    for (let i = 0; i < points.length; i++) {
      addWall(points[i], points[(i + 1) % points.length]);
    }

    onClose();
  };

  const roomTypes = roomCategory === 'Residencial' ? ROOM_TYPES_RESIDENTIAL : ROOM_TYPES_COMMERCIAL;

  // Obtém os formatos disponíveis para o tipo selecionado
  const availableShapes = selectedRoomType
    ? Object.keys(ROOM_DIMENSIONS[selectedRoomType] || ROOM_DIMENSIONS.default) as ('retangular' | 'quadrado' | 'l')[]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        className="bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center px-5 pb-3 pt-1">
          {(view === 'fill' || view === 'roomTypes' || view === 'shapes') && (
            <button
              onClick={() => setView(view === 'shapes' ? 'roomTypes' : 'main')}
              className="p-1.5 -ml-1.5 mr-2 text-gray-500 hover:text-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">
              {view === 'fill' ? 'Inserir um preenchimento...' : 
               view === 'roomTypes' ? 'Selecione o tipo de Cômodo' :
               view === 'shapes' ? `Formatos para ${selectedRoomType}` :
               'Adicionar um cômodo'}
            </h2>
            {view === 'main' && <p className="text-sm text-gray-500">Escolha um método</p>}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'main' && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="px-4 pb-8"
              >
                {/* Scan cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Auto-Scan', desc: 'Escaneie vários cômodos.', onClick: () => { onClose(); onScan(); }, color: 'from-blue-500 to-blue-600' },
                    { label: 'Escaneamento manual', desc: 'Escanear um cômodo.', onClick: () => { onClose(); onScan(); }, color: 'from-sky-400 to-blue-500' },
                  ].map(card => (
                    <button
                      key={card.label}
                      onClick={card.onClick}
                      className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors text-left group"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                          <rect x="4" y="4" width="28" height="28" rx="4" fill="rgba(255,255,255,0.15)" />
                          <path d="M4 18h28M18 4v28" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
                          <rect x="10" y="10" width="16" height="16" rx="2" fill="rgba(255,255,255,0.4)" />
                          <circle cx="18" cy="18" r="3" fill="white" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{card.label}</p>
                        <p className="text-[11px] text-gray-500">{card.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* List options */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                  {[
                    { icon: Square, label: 'Adicionar um cômodo quadrado', desc: 'Comece com um modelo.', action: handleAddSquareRoom },
                    { icon: PenLine, label: 'Desenhar cômodo', desc: 'Adicione pontos de canto.', action: handleDrawRoom },
                    { icon: Layers, label: 'Inserir um preenchimento...', desc: 'Preencher espaço entre cômodos.', action: () => setView('fill') },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'roomTypes' && (
              <motion.div
                key="roomTypes"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="pb-8"
              >
                <div className="px-4 mb-3">
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    {(['Residencial', 'Comercial'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setRoomCategory(cat)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                          roomCategory === cat ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de cômodo</div>
                <div className="bg-white mx-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                  {roomTypes.map(rt => (
                    <button
                      key={rt}
                      onClick={() => handleRoomTypeSelect(rt)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-800">{rt}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'shapes' && selectedRoomType && (
              <motion.div
                key="shapes"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="px-4 pb-8"
              >
                <p className="text-sm text-gray-500 mb-4">Escolha um formato para {selectedRoomType}</p>
                <div className="grid grid-cols-2 gap-4">
                  {availableShapes.includes('retangular') && (
                    <button
                      onClick={() => handleShapeSelect('retangular')}
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors text-center"
                    >
                      <div className="w-20 h-14 mx-auto mb-2 border-2 border-blue-400 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Grid3X3 className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-sm font-medium">Retangular</p>
                      <p className="text-xs text-gray-500">
                        {ROOM_DIMENSIONS[selectedRoomType]?.retangular?.width || 4.0} x {ROOM_DIMENSIONS[selectedRoomType]?.retangular?.depth || 3.0} m
                      </p>
                    </button>
                  )}
                  {availableShapes.includes('quadrado') && (
                    <button
                      onClick={() => handleShapeSelect('quadrado')}
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors text-center"
                    >
                      <div className="w-14 h-14 mx-auto mb-2 border-2 border-blue-400 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Square className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-sm font-medium">Quadrado</p>
                      <p className="text-xs text-gray-500">
                        {ROOM_DIMENSIONS[selectedRoomType]?.quadrado?.width || 3.5} x {ROOM_DIMENSIONS[selectedRoomType]?.quadrado?.depth || 3.5} m
                      </p>
                    </button>
                  )}
                  {availableShapes.includes('l') && (
                    <button
                      onClick={() => handleShapeSelect('l')}
                      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors text-center col-span-2"
                    >
                      <div className="w-24 h-16 mx-auto mb-2 border-2 border-blue-400 rounded-lg bg-blue-50 flex items-center justify-center">
                        <span className="text-blue-500 font-bold">L</span>
                      </div>
                      <p className="text-sm font-medium">Forma L</p>
                      <p className="text-xs text-gray-500">
                        {ROOM_DIMENSIONS[selectedRoomType]?.l?.width || 5.0} x {ROOM_DIMENSIONS[selectedRoomType]?.l?.depth || 4.0} m
                      </p>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'fill' && (
              <motion.div
                key="fill"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="px-4 pb-8"
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                  {[
                    { label: 'Sala de enchimento', desc: 'Preencha espaço entre cômodos.', action: () => {} },
                    { label: 'Parede de preenchimento', desc: 'Adicione uma parede hachurada.', action: () => {} },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <div className="w-7 h-7 border-2 border-blue-400 rounded bg-blue-50" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
