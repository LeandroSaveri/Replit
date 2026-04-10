// ============================================
// PROPERTIES PANEL - Painel de Propriedades
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore, selectCurrentScene, selectSelectedItems } from '@store/editorStore';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Ruler, 
  Palette, 
  Box, 
  RotateCw,
  Move,
  Type,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Maximize2
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
            <div className="p-3 pt-0">
              {children}
            </div>
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
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">{unit}</span>
        )}
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

export function PropertiesPanel() {
  const [isOpen, setIsOpen] = useState(true);
  
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
  
  const currentScene = useEditorStore(selectCurrentScene);
  const selectedItems = useEditorStore(selectSelectedItems);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-slate-800 border-l border-y border-slate-700 rounded-l-lg flex items-center justify-center text-slate-400 hover:text-white"
      >
        <ChevronDown className="w-4 h-4 -rotate-90" />
      </button>
    );
  }

  if (selectedIds.length === 0) {
    return (
      <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col">
        <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
          <span className="text-sm font-medium text-slate-300">Propriedades</span>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
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
    );
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
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col max-h-full overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
        <span className="text-sm font-medium text-slate-300">
          {selectedIds.length > 1 ? `${selectedIds.length} objetos selecionados` : 'Propriedades'}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={handleDelete} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isWall && (
          <>
            <Section title="Dimensões" icon={Ruler}>
              <InputField
                label="Altura"
                value={(selectedItem as Wall).height}
                onChange={(v) => updateWall(selectedItem.id, { height: parseFloat(v) })}
                min={1}
                max={10}
                unit="m"
              />
              <InputField
                label="Espessura"
                value={(selectedItem as Wall).thickness}
                onChange={(v) => updateWall(selectedItem.id, { thickness: parseFloat(v) })}
                min={0.05}
                max={1}
                step={0.01}
                unit="m"
              />
            </Section>
            <Section title="Aparência" icon={Palette}>
              <InputField
                label="Cor"
                value={(selectedItem as Wall).color}
                onChange={(v) => updateWall(selectedItem.id, { color: v })}
                type="color"
              />
            </Section>
          </>
        )}

        {isRoom && (
          <>
            <Section title="Informações" icon={Type}>
              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Nome</label>
                <input
                  type="text"
                  value={(selectedItem as Room).name}
                  onChange={(e) => updateRoom(selectedItem.id, { name: e.target.value })}
                  className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                <select
                  value={(selectedItem as Room).type}
                  onChange={(e) => updateRoom(selectedItem.id, { type: e.target.value as any })}
                  className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="living">Sala</option>
                  <option value="bedroom">Quarto</option>
                  <option value="kitchen">Cozinha</option>
                  <option value="bathroom">Banheiro</option>
                  <option value="dining">Sala de Jantar</option>
                  <option value="office">Escritório</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <span className="text-xs text-slate-500">Área</span>
                  <p className="text-sm text-white">{((selectedItem as Room).area ?? 0).toFixed(2)} m²</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Perímetro</span>
                  <p className="text-sm text-white">{((selectedItem as Room).perimeter ?? 0).toFixed(2)} m</p>
                </div>
              </div>
            </Section>
            <Section title="Cores" icon={Palette}>
              <InputField
                label="Cor das Paredes"
                value={(selectedItem as Room).wallColor ?? '#e2e8f0'}
                onChange={(v) => updateRoom(selectedItem.id, { wallColor: v })}
                type="color"
              />
              <InputField
                label="Cor do Piso"
                value={(selectedItem as Room).floorColor ?? '#e5e7eb'}
                onChange={(v) => updateRoom(selectedItem.id, { floorColor: v })}
                type="color"
              />
              <InputField
                label="Cor do Teto"
                value={(selectedItem as Room).ceilingColor ?? '#f9fafb'}
                onChange={(v) => updateRoom(selectedItem.id, { ceilingColor: v })}
                type="color"
              />
            </Section>
          </>
        )}

        {isDoor && (
          <>
            <Section title="Dimensões" icon={Ruler}>
              <InputField
                label="Largura"
                value={(selectedItem as Door).width}
                onChange={(v) => updateDoor(selectedItem.id, { width: parseFloat(v) })}
                min={0.5}
                max={3}
                unit="m"
              />
              <InputField
                label="Altura"
                value={(selectedItem as Door).height}
                onChange={(v) => updateDoor(selectedItem.id, { height: parseFloat(v) })}
                min={1.5}
                max={3}
                unit="m"
              />
            </Section>
            <Section title="Configuração" icon={Maximize2}>
              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Abertura</label>
                <select
                  value={(selectedItem as Door).swing}
                  onChange={(e) => updateDoor(selectedItem.id, { swing: e.target.value as any })}
                  className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="left">Esquerda</option>
                  <option value="right">Direita</option>
                  <option value="double">Dupla</option>
                  <option value="sliding">Correr</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Estilo</label>
                <select
                  value={(selectedItem as Door).style}
                  onChange={(e) => updateDoor(selectedItem.id, { style: e.target.value as any })}
                  className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="panel">Painel</option>
                  <option value="flush">Lisa</option>
                  <option value="french">Francesa</option>
                  <option value="sliding">Correr</option>
                </select>
              </div>
            </Section>
            <Section title="Aparência" icon={Palette}>
              <InputField
                label="Cor da Porta"
                value={(selectedItem as Door).panelColor ?? '#92400e'}
                onChange={(v) => updateDoor(selectedItem.id, { panelColor: v })}
                type="color"
              />
              <InputField
                label="Cor da Moldura"
                value={(selectedItem as Door).frameColor ?? '#78350f'}
                onChange={(v) => updateDoor(selectedItem.id, { frameColor: v })}
                type="color"
              />
            </Section>
          </>
        )}

        {isWindow && (
          <>
            <Section title="Dimensões" icon={Ruler}>
              <InputField
                label="Largura"
                value={(selectedItem as Window).width}
                onChange={(v) => updateWindow(selectedItem.id, { width: parseFloat(v) })}
                min={0.3}
                max={5}
                unit="m"
              />
              <InputField
                label="Altura"
                value={(selectedItem as Window).height}
                onChange={(v) => updateWindow(selectedItem.id, { height: parseFloat(v) })}
                min={0.3}
                max={3}
                unit="m"
              />
              <InputField
                label="Altura do Peitoril"
                value={(selectedItem as Window).sillHeight ?? 0.9}
                onChange={(v) => updateWindow(selectedItem.id, { sillHeight: parseFloat(v) })}
                min={0}
                max={2}
                unit="m"
              />
            </Section>
            <Section title="Configuração" icon={Maximize2}>
              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Estilo</label>
                <select
                  value={(selectedItem as Window).style}
                  onChange={(e) => updateWindow(selectedItem.id, { style: e.target.value as any })}
                  className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="single-hung">Simples</option>
                  <option value="double-hung">Dupla</option>
                  <option value="sliding">Correr</option>
                  <option value="casement">Balança</option>
                  <option value="picture">Fixa</option>
                </select>
              </div>
            </Section>
            <Section title="Aparência" icon={Palette}>
              <InputField
                label="Cor da Moldura"
                value={(selectedItem as Window).frameColor ?? '#475569'}
                onChange={(v) => updateWindow(selectedItem.id, { frameColor: v })}
                type="color"
              />
            </Section>
          </>
        )}

        {isFurniture && (
          <>
            <Section title="Transformação" icon={Move}>
              <Vector3Input
                label="Posição"
                values={(Array.isArray((selectedItem as Furniture).position) ? (selectedItem as Furniture).position : [(selectedItem as any).position.x, (selectedItem as any).position.y, (selectedItem as any).position.z]) as [number, number, number]}
                onChange={(v) => updateFurniture(selectedItem.id, { position: v })}
              />
              <Vector3Input
                label="Rotação"
                values={(() => {
                  const rot = (selectedItem as Furniture).rotation;
                  const arr = Array.isArray(rot) ? rot : typeof rot === 'number' ? [0, rot, 0] : [(rot as any).x, (rot as any).y, (rot as any).z];
                  return (arr as number[]).map(r => r * (180 / Math.PI)) as [number, number, number];
                })()}
                onChange={(v) => updateFurniture(selectedItem.id, { 
                  rotation: (v.map(r => r * (Math.PI / 180)) as [number, number, number]) 
                })}
              />
              <Vector3Input
                label="Escala"
                values={((selectedItem as Furniture).scale ?? [1, 1, 1]) as [number, number, number]}
                onChange={(v) => updateFurniture(selectedItem.id, { scale: v })}
              />
            </Section>
            <Section title="Dimensões" icon={Ruler}>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-xs text-slate-500">Largura</span>
                  <p className="text-sm text-white">{((selectedItem as Furniture).dimensions?.width ?? 1).toFixed(2)} m</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Altura</span>
                  <p className="text-sm text-white">{((selectedItem as Furniture).dimensions?.height ?? 1).toFixed(2)} m</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Profundidade</span>
                  <p className="text-sm text-white">{((selectedItem as Furniture).dimensions?.depth ?? 1).toFixed(2)} m</p>
                </div>
              </div>
            </Section>
            <Section title="Aparência" icon={Palette}>
              <InputField
                label="Cor"
                value={(selectedItem as Furniture).color}
                onChange={(v) => updateFurniture(selectedItem.id, { color: v })}
                type="color"
              />
            </Section>
            <Section title="Ações" icon={Layers}>
              <div className="flex gap-2">
                <button
                  onClick={() => duplicateFurniture(selectedItem.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplicar
                </button>
              </div>
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}
