// ============================================================
// AddRoomModal — Modal "Adicionar um cômodo" estilo MagicPlan
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Square, PenLine, Layers } from 'lucide-react';
import { useEditorStore } from '@store/editorStore';

interface AddRoomModalProps {
  onClose: () => void;
  onScan: () => void;
}

type View = 'main' | 'fill';

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

export function AddRoomModal({ onClose, onScan }: AddRoomModalProps) {
  const [view, setView] = useState<View>('main');
  const [showRoomTypes, setShowRoomTypes] = useState(false);
  const [roomCategory, setRoomCategory] = useState<'Residencial' | 'Comercial'>('Residencial');
  const { setTool } = useEditorStore();

  const handleAddSquareRoom = () => {
    setTool('room');
    onClose();
  };

  const handleDrawRoom = () => {
    setTool('wall');
    onClose();
  };

  const handleRoomTypeSelect = (roomType: string) => {
    console.log('Room type selected:', roomType);
    setTool('room');
    onClose();
  };

  const roomTypes = roomCategory === 'Residencial' ? ROOM_TYPES_RESIDENTIAL : ROOM_TYPES_COMMERCIAL;

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
        {/* ── Handle ── */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center px-5 pb-3 pt-1">
          {view === 'fill' && (
            <button
              onClick={() => setView('main')}
              className="p-1.5 -ml-1.5 mr-2 text-gray-500 hover:text-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">
              {view === 'fill' ? 'Inserir um preenchimento...' : 'Adicionar um cômodo'}
            </h2>
            {view === 'main' && (
              <p className="text-sm text-gray-500">Escolha um método</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'main' && !showRoomTypes && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15 }}
                className="px-4 pb-8"
              >
                {/* Top scan cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    {
                      label: 'Auto-Scan',
                      desc: 'Escaneie vários cômodos. Detecção automática de obje...',
                      onClick: () => { onClose(); onScan(); },
                      color: 'from-blue-500 to-blue-600',
                    },
                    {
                      label: 'Escaneamento manual',
                      desc: 'Escanear um cômodo. Detecção manual de objetos.',
                      onClick: () => { onClose(); onScan(); },
                      color: 'from-sky-400 to-blue-500',
                    },
                  ].map(card => (
                    <button
                      key={card.label}
                      onClick={card.onClick}
                      className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors text-left group overflow-hidden"
                    >
                      {/* LiDAR badge */}
                      <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <Layers className="w-2.5 h-2.5" />
                        LiDAR
                      </span>

                      {/* Icon illustration */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                          <rect x="4" y="4" width="28" height="28" rx="4" fill="rgba(255,255,255,0.15)" />
                          <path d="M4 18h28M18 4v28" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
                          <rect x="10" y="10" width="16" height="16" rx="2" fill="rgba(255,255,255,0.4)" />
                          <circle cx="18" cy="18" r="3" fill="white" />
                        </svg>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-800 leading-tight">{card.label}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{card.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* List options */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                  {[
                    {
                      icon: Square,
                      label: 'Adicionar um cômodo quadrado',
                      desc: 'Comece com um modelo. Em seguida, ajuste a forma.',
                      action: () => setShowRoomTypes(true),
                    },
                    {
                      icon: PenLine,
                      label: 'Desenhar cômodo',
                      desc: 'Adicione pontos de canto para criar o formato do cômodo.',
                      action: handleDrawRoom,
                    },
                    {
                      icon: Layers,
                      label: 'Inserir um preenchimento...',
                      desc: 'Preencher automaticamente o espaço entre os cômodos.',
                      action: () => setView('fill'),
                    },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'main' && showRoomTypes && (
              <motion.div
                key="roomtypes"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.15 }}
                className="pb-8"
              >
                {/* Back button in sub-header */}
                <div className="flex items-center px-4 pb-3">
                  <button
                    onClick={() => setShowRoomTypes(false)}
                    className="flex items-center gap-1 text-blue-500 text-sm font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </button>
                  <h3 className="text-sm font-semibold text-gray-700 mx-auto pr-10">Selecione o tipo de Cômodo</h3>
                </div>

                {/* Category tabs */}
                <div className="px-4 mb-3">
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    {(['Residencial', 'Comercial'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setRoomCategory(cat)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                          roomCategory === cat
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room type list */}
                <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Tipo de cômodo
                </div>
                <div className="bg-white mx-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                  {roomTypes.map(rt => (
                    <button
                      key={rt}
                      onClick={() => handleRoomTypeSelect(rt)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-sm text-gray-800">{rt}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'fill' && (
              <motion.div
                key="fill"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.15 }}
                className="px-4 pb-8"
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                  {[
                    {
                      label: 'Sala de enchimento',
                      desc: 'Adicione um preenchimento para ocupar o espaço entre os cômodos.',
                      action: handleAddSquareRoom,
                    },
                    {
                      label: 'Parede de preenchimento',
                      desc: 'Adicione uma parede hachurada para preencher o espaço entre os cômodos.',
                      action: handleDrawRoom,
                    },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <div className="w-7 h-7 border-2 border-blue-400 rounded bg-blue-50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
