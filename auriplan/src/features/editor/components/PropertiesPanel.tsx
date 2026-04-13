// ============================================
// PROPERTIES PANEL - Responsivo (mobile drawer)
// Controlado externamente via props isOpen/onClose
// Botão flutuante removido (abertura apenas pelo menu lateral)
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore, selectCurrentScene, selectSelectedItems } from '@store/editorStore';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Ruler, 
  Palette, 
  Box, 
  Move,
  Type,
  Layers,
  Trash2,
  Copy,
  Maximize2,
} from 'lucide-react';
import type { Wall, Room, Door, Window, Furniture } from '@auriplan-types';

interface SectionProps {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon: Icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'color';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

function InputField({ label, value, onChange, type = 'number', min, max, step = 0.01, unit }: InputFieldProps) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
        />
        {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function Vector3Input({ label, values, onChange }: { label: string; values: [number, number, number]; onChange: (values: [number, number, number]) => void }) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">{axis}</span>
            <input
              type="number"
              value={values[i].toFixed(2)}
              onChange={(e) => {
                const newValues = [...values] as [number, number, number];
                newValues[i] = parseFloat(e.target.value) || 0;
                onChange(newValues);
              }}
              step={0.01}
              className="w-full h-8 pl-6 pr-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PropertiesPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PropertiesPanel({ isOpen: externalIsOpen, onClose }: PropertiesPanelProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const { 
    selectedIds, 
    deselectAll, 
    updateWall, 
    updateRoom, 
    updateDoor, 
    updateWindow, 
    updateFurniture,
    deleteWall,
    deleteRoom,
    deleteDoor,
    deleteWindow,
    deleteFurniture,
    duplicateFurniture,
  } = useEditorStore();
  
  const selectedItems = useEditorStore(selectSelectedItems);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setInternalIsOpen(!!externalIsOpen);
    }
  }, [externalIsOpen, isMobile]);

  useEffect(() => {
    if (isMobile && selectedIds.length === 0 && internalIsOpen) {
      setInternalIsOpen(false);
    }
  }, [selectedIds, isMobile, internalIsOpen]);

  if (selectedIds.length === 0) {
    if (!isMobile) {
      return externalIsOpen ? (
        <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
            <span className="text-sm font-medium text-slate-300">Propriedades</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Selecione um objeto para editar suas propriedades</p>
            </div>
          </div>
        </aside>
      ) : null;
    }
    return null;
  }

  const selectedItem = selectedItems[0];
  const isWall = selectedItem && 'start' in selectedItem && 'end' in selectedItem && !('wallId' in selectedItem);
  const isRoom = selectedItem && 'points' in selectedItem && 'wallColor' in selectedItem;
  const isDoor = selectedItem && 'swing' in selectedItem;
  const isWindow = selectedItem && 'sillHeight' in selectedItem;
  const isFurniture = selectedItem && 'catalogId' in selectedItem;

  const handleDelete = () => {
    if (isWall) deleteWall(selectedItem.id);
    else if (isRoom) deleteRoom(selectedItem.id);
    else if (isDoor) deleteDoor(selectedItem.id);
    else if (isWindow) deleteWindow(selectedItem.id);
    else if (isFurniture) deleteFurniture(selectedItem.id);
    deselectAll();
    if (isMobile) setInternalIsOpen(false);
  };

  const PanelContent = () => (
    <div className="flex-1 overflow-y-auto">
      {isWall && (
        <>
          <Section title="Dimensões" icon={Ruler}>
            <InputField label="Altura" value={(selectedItem as Wall).height} onChange={(v) => updateWall(selectedItem.id, { height: parseFloat(v) })} min={1} max={10} unit="m" />
            <InputField label="Espessura" value={(selectedItem as Wall).thickness} onChange={(v) => updateWall(selectedItem.id, { thickness: parseFloat(v) })} min={0.05} max={1} step={0.01} unit="m" />
          </Section>
          <Section title="Aparência" icon={Palette}>
            <InputField label="Cor" value={(selectedItem as Wall).color} onChange={(v) => updateWall(selectedItem.id, { color: v })} type="color" />
          </Section>
        </>
      )}

      {isRoom && (
        <>
          <Section title="Informações" icon={Type}>
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1">Nome</label>
              <input type="text" value={(selectedItem as Room).name} onChange={(e) => updateRoom(selectedItem.id, { name: e.target.value })} className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1">Tipo</label>
              <select value={(selectedItem as Room).type} onChange={(e) => updateRoom(selectedItem.id, { type: e.target.value as any })} className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="living">Sala</option><option value="bedroom">Quarto</option><option value="kitchen">Cozinha</option>
                <option value="bathroom">Banheiro</option><option value="dining">Sala de Jantar</option><option value="office">Escritório</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div><span className="text-xs text-slate-500">Área</span><p className="text-sm text-white">{((selectedItem as Room).area ?? 0).toFixed(2)} m²</p></div>
              <div><span className="text-xs text-slate-500">Perímetro</span><p className="text-sm text-white">{((selectedItem as Room).perimeter ?? 0).toFixed(2)} m</p></div>
            </div>
          </Section>
          <Section title="Cores" icon={Palette}>
            <InputField label="Cor das Paredes" value={(selectedItem as Room).wallColor ?? '#e2e8f0'} onChange={(v) => updateRoom(selectedItem.id, { wallColor: v })} type="color" />
            <InputField label="Cor do Piso" value={(selectedItem as Room).floorColor ?? '#e5e7eb'} onChange={(v) => updateRoom(selectedItem.id, { floorColor: v })} type="color" />
            <InputField label="Cor do Teto" value={(selectedItem as Room).ceilingColor ?? '#f9fafb'} onChange={(v) => updateRoom(selectedItem.id, { ceilingColor: v })} type="color" />
          </Section>
        </>
      )}

      {isDoor && (
        <>
          <Section title="Dimensões" icon={Ruler}>
            <InputField label="Largura" value={(selectedItem as Door).width} onChange={(v) => updateDoor(selectedItem.id, { width: parseFloat(v) })} min={0.5} max={3} unit="m" />
            <InputField label="Altura" value={(selectedItem as Door).height} onChange={(v) => updateDoor(selectedItem.id, { height: parseFloat(v) })} min={1.5} max={3} unit="m" />
          </Section>
          <Section title="Configuração" icon={Maximize2}>
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1">Abertura</label>
              <select value={(selectedItem as Door).swing} onChange={(e) => updateDoor(selectedItem.id, { swing: e.target.value as any })} className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="left">Esquerda</option><option value="right">Direita</option><option value="double">Dupla</option><option value="sliding">Correr</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1">Estilo</label>
              <select value={(selectedItem as Door).style} onChange={(e) => updateDoor(selectedItem.id, { style: e.target.value as any })} className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="panel">Painel</option><option value="flush">Lisa</option><option value="french">Francesa</option><option value="sliding">Correr</option>
              </select>
            </div>
          </Section>
          <Section title="Aparência" icon={Palette}>
            <InputField label="Cor da Porta" value={(selectedItem as Door).panelColor ?? '#92400e'} onChange={(v) => updateDoor(selectedItem.id, { panelColor: v })} type="color" />
            <InputField label="Cor da Moldura" value={(selectedItem as Door).frameColor ?? '#78350f'} onChange={(v) => updateDoor(selectedItem.id, { frameColor: v })} type="color" />
          </Section>
        </>
      )}

      {isWindow && (
        <>
          <Section title="Dimensões" icon={Ruler}>
            <InputField label="Largura" value={(selectedItem as Window).width} onChange={(v) => updateWindow(selectedItem.id, { width: parseFloat(v) })} min={0.3} max={5} unit="m" />
            <InputField label="Altura" value={(selectedItem as Window).height} onChange={(v) => updateWindow(selectedItem.id, { height: parseFloat(v) })} min={0.3} max={3} unit="m" />
            <InputField label="Altura do Peitoril" value={(selectedItem as Window).sillHeight ?? 0.9} onChange={(v) => updateWindow(selectedItem.id, { sillHeight: parseFloat(v) })} min={0} max={2} unit="m" />
          </Section>
          <Section title="Configuração" icon={Maximize2}>
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1">Estilo</label>
              <select value={(selectedItem as Window).style} onChange={(e) => updateWindow(selectedItem.id, { style: e.target.value as any })} className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="single-hung">Simples</option><option value="double-hung">Dupla</option><option value="sliding">Correr</option>
                <option value="casement">Balança</option><option value="picture">Fixa</option>
              </select>
            </div>
          </Section>
          <Section title="Aparência" icon={Palette}>
            <InputField label="Cor da Moldura" value={(selectedItem as Window).frameColor ?? '#475569'} onChange={(v) => updateWindow(selectedItem.id, { frameColor: v })} type="color" />
          </Section>
        </>
      )}

      {isFurniture && (
        <>
          <Section title="Transformação" icon={Move}>
            <Vector3Input label="Posição" values={(() => { const pos = (selectedItem as Furniture).position; return Array.isArray(pos) ? pos : [pos.x, pos.y, pos.z]; })() as [number, number, number]} onChange={(v) => updateFurniture(selectedItem.id, { position: v })} />
            <Vector3Input label="Rotação" values={(() => { const rot = (selectedItem as Furniture).rotation; const arr = Array.isArray(rot) ? rot : typeof rot === 'number' ? [0, rot, 0] : [rot.x, rot.y, rot.z]; return arr.map(r => r * (180 / Math.PI)) as [number, number, number]; })()} onChange={(v) => updateFurniture(selectedItem.id, { rotation: v.map(r => r * (Math.PI / 180)) as [number, number, number] })} />
            <Vector3Input label="Escala" values={((selectedItem as Furniture).scale ?? [1, 1, 1]) as [number, number, number]} onChange={(v) => updateFurniture(selectedItem.id, { scale: v })} />
          </Section>
          <Section title="Dimensões" icon={Ruler}>
            <div className="grid grid-cols-3 gap-2">
              <div><span className="text-xs text-slate-500">Largura</span><p className="text-sm text-white">{((selectedItem as Furniture).dimensions?.width ?? 1).toFixed(2)} m</p></div>
              <div><span className="text-xs text-slate-500">Altura</span><p className="text-sm text-white">{((selectedItem as Furniture).dimensions?.height ?? 1).toFixed(2)} m</p></div>
              <div><span className="text-xs text-slate-500">Profundidade</span><p className="text-sm text-white">{((selectedItem as Furniture).dimensions?.depth ?? 1).toFixed(2)} m</p></div>
            </div>
          </Section>
          <Section title="Aparência" icon={Palette}>
            <InputField label="Cor" value={(selectedItem as Furniture).color} onChange={(v) => updateFurniture(selectedItem.id, { color: v })} type="color" />
          </Section>
          <Section title="Ações" icon={Layers}>
            <div className="flex gap-2">
              <button onClick={() => duplicateFurniture(selectedItem.id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-white transition-colors">
                <Copy className="w-4 h-4" /> Duplicar
              </button>
            </div>
          </Section>
        </>
      )}
    </div>
  );

  if (!isMobile) {
    if (!externalIsOpen) return null;
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 320, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="border-l border-slate-800 overflow-hidden flex-shrink-0"
      >
        <div className="flex flex-col h-full bg-slate-900">
          <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
            <span className="text-sm font-medium text-slate-300">Propriedades</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <PanelContent />
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {internalIsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setInternalIsOpen(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] bg-slate-900 border-t border-slate-800 rounded-t-2xl overflow-hidden flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-medium text-slate-300">Propriedades</span>
              <button onClick={() => setInternalIsOpen(false)} className="p-1 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <PanelContent />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
