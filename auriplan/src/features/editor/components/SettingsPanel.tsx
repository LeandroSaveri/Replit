// ============================================================
// SettingsPanel — Configurações do Editor
// ============================================================

import { motion } from 'framer-motion';
import { X, Grid3X3, Magnet, Ruler, Eye, Settings } from 'lucide-react';
import { useEditorStore } from '@store/editorStore';

interface SettingsPanelProps {
  onClose: () => void;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-blue-500' : 'bg-slate-700'
        }`}
        style={{ width: 42, height: 24 }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
          style={{ width: 20, height: 20 }}
        />
      </button>
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  format?: (v: number) => string;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-white">{label}</p>
        <span className="text-sm text-blue-400 font-mono">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 accent-blue-500 cursor-pointer"
      />
    </div>
  );
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { grid, setGrid, snap, setSnap, toggleGrid, toggleSnap } = useEditorStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Configurações do Editor</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-1 max-h-[70vh] overflow-auto">

          {/* Grid section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Grid3X3 className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grade</p>
            </div>
            <div className="pl-6 divide-y divide-slate-800">
              <Toggle
                checked={grid.visible}
                onChange={toggleGrid}
                label="Mostrar Grade"
                description="Linhas de referência no canvas"
              />
              <Slider
                value={grid.size}
                min={0.1}
                max={2}
                step={0.1}
                onChange={v => setGrid({ size: v })}
                label="Tamanho da Grade"
                format={v => `${v.toFixed(1)}m`}
              />
            </div>
          </div>

          {/* Snap section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Magnet className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Snap</p>
            </div>
            <div className="pl-6 divide-y divide-slate-800">
              <Toggle
                checked={snap.enabled}
                onChange={toggleSnap}
                label="Snap Ativado"
                description="Alinha automático a pontos e grade"
              />
              <Toggle
                checked={snap.grid}
                onChange={v => setSnap({ grid: v })}
                label="Snap à Grade"
              />
              <Toggle
                checked={snap.endpoints}
                onChange={v => setSnap({ endpoints: v })}
                label="Snap a Extremidades"
                description="Conecta início/fim de paredes"
              />
              <Toggle
                checked={snap.midpoints}
                onChange={v => setSnap({ midpoints: v })}
                label="Snap ao Ponto Médio"
              />
              <Toggle
                checked={snap.perpendicular}
                onChange={v => setSnap({ perpendicular: v })}
                label="Snap Perpendicular"
              />
            </div>
          </div>

          {/* Display section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exibição</p>
            </div>
            <div className="pl-6 divide-y divide-slate-800">
              <div className="py-3">
                <p className="text-sm font-medium text-white mb-2">Unidade padrão</p>
                <div className="flex gap-2">
                  {['m', 'cm', 'ft'].map(u => (
                    <button
                      key={u}
                      className="px-4 py-1.5 text-sm rounded-lg border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors first:border-blue-500 first:text-blue-400 first:bg-blue-500/10"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Shortcuts */}
          <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Atalhos principais</p>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
              {[
                ['V', 'Selecionar'],
                ['W', 'Parede'],
                ['R', 'Cômodo'],
                ['D', 'Porta'],
                ['Esc', 'Cancelar'],
                ['Enter', 'Confirmar'],
                ['F', 'Ajustar tela'],
                ['Ctrl+Z', 'Desfazer'],
                ['Shift+drag', 'Pan'],
                ['Scroll', 'Zoom'],
              ].map(([k, l]) => (
                <div key={k} className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-700 border border-slate-600 rounded font-mono text-slate-300 whitespace-nowrap">
                    {k}
                  </kbd>
                  <span className="text-xs text-slate-500">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
