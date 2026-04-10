// ============================================================
// AIAssistant — Gerador de Plantas via Linguagem Natural
// Motor arquitetônico integrado com normas ABNT + padrões internacionais
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, Loader2, Check, ChevronRight,
  AlertTriangle, Home, BedDouble, LayoutGrid, Briefcase,
  RefreshCw, ArrowLeft, Info, Building2,
} from 'lucide-react';
import {
  parseDescription, generateFloorPlan, applyFloorPlan,
  type GeneratedFloorPlan,
} from '@/engine/floorplan/FloorPlanGenerator';

interface AIAssistantProps {
  onClose: () => void;
}

// ── Quick templates ──────────────────────────────────────────
const QUICK_TEMPLATES = [
  {
    icon: Home,
    label: 'Casa 2 Quartos',
    sub: '~65m² · Sala americana',
    prompt: 'casa com 2 quartos, sala americana, cozinha e 1 banheiro',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: BedDouble,
    label: 'Casa 3 Quartos',
    sub: '~90m² · 1 suíte · Garagem',
    prompt: 'casa com 3 quartos sendo 1 suíte, sala de jantar, cozinha, 2 banheiros, área de serviço e garagem',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Building2,
    label: 'Apartamento',
    sub: '~75m² · Varanda · 2 suítes',
    prompt: 'apartamento com 2 suítes, sala americana, varanda, cozinha, área de serviço',
    color: 'from-indigo-500 to-blue-600',
  },
  {
    icon: LayoutGrid,
    label: 'Studio',
    sub: '~35m² · Open-plan',
    prompt: 'studio open-plan moderno com varanda',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Briefcase,
    label: 'Casa Grande',
    sub: '~150m² · 4 quartos · 3 banheiros',
    prompt: 'casa com 4 quartos sendo 2 suítes, sala de estar, sala de jantar, cozinha americana, 3 banheiros, área de serviço, escritório e garagem para 2 carros',
    color: 'from-orange-500 to-amber-500',
  },
];

// ── SVG Floor Plan Preview ───────────────────────────────────
function FloorPlanPreview({ plan }: { plan: GeneratedFloorPlan }) {
  const W = 320;
  const H = 200;
  const PAD = 12;

  const fw = plan.footprintW;
  const fd = plan.footprintD;
  const scaleX = (W - PAD * 2) / fw;
  const scaleY = (H - PAD * 2) / fd;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (W - fw * scale) / 2;
  const offsetY = (H - fd * scale) / 2;

  function toSvg(x: number, y: number) {
    return [offsetX + x * scale, offsetY + y * scale] as const;
  }

  const totalRoomArea = plan.rooms.reduce((s, r) => s + r.area, 0);

  return (
    <div className="space-y-3">
      {/* SVG Blueprint */}
      <div className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-600">
        <div className="absolute top-2 left-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
          Planta Baixa · Escala aprox.
        </div>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Background grid */}
          <defs>
            <pattern id="grid" width={scale} height={scale} patternUnits="userSpaceOnUse"
              x={offsetX % scale} y={offsetY % scale}>
              <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#ffffff08" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" />

          {/* Rooms */}
          {plan.rooms.map((room) => {
            const [x1, y1] = toSvg(room.x, room.y);
            const rw = room.w * scale;
            const rh = room.d * scale;
            const cx = x1 + rw / 2;
            const cy = y1 + rh / 2;

            return (
              <g key={room.id}>
                <rect
                  x={x1} y={y1} width={rw} height={rh}
                  fill={room.floorColor}
                  stroke={room.wallColor}
                  strokeWidth={1.5}
                  rx={1}
                />
                {rw > 30 && rh > 16 && (
                  <>
                    <text x={cx} y={cy - 4} textAnchor="middle" fontSize={rw > 50 ? 7 : 6}
                      fill="#374151" fontWeight="600" fontFamily="system-ui">
                      {room.name.split(' ').slice(0, 2).join(' ')}
                    </text>
                    <text x={cx} y={cy + 6} textAnchor="middle" fontSize={5.5}
                      fill="#6b7280" fontFamily="system-ui">
                      {room.area.toFixed(1)}m²
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Dimension labels */}
          <text x={offsetX + fw * scale / 2} y={H - 3} textAnchor="middle"
            fontSize={8} fill="#64748b" fontFamily="monospace">
            {fw.toFixed(1)}m
          </text>
          <text x={4} y={offsetY + fd * scale / 2} textAnchor="middle"
            fontSize={8} fill="#64748b" fontFamily="monospace"
            transform={`rotate(-90, 8, ${offsetY + fd * scale / 2})`}>
            {fd.toFixed(1)}m
          </text>
        </svg>
      </div>

      {/* Room list */}
      <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
        {plan.rooms.filter(r => r.type !== 'hallway').map((room) => (
          <div key={room.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: room.floorColor, border: `1px solid ${room.wallColor}` }} />
            <span className="text-xs text-slate-300 truncate flex-1">{room.name}</span>
            <span className="text-[10px] text-slate-500 flex-shrink-0">{room.area.toFixed(0)}m²</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Área total', value: `~${plan.totalArea}m²` },
          { label: 'Cômodos', value: `${plan.rooms.filter(r => r.type !== 'hallway').length}` },
          { label: 'Dimensões', value: `${plan.footprintW.toFixed(0)}×${plan.footprintD.toFixed(0)}m` },
        ].map(({ label, value }) => (
          <div key={label} className="text-center p-2 bg-slate-800 rounded-lg">
            <p className="text-sm font-semibold text-white">{value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Thinking animation ────────────────────────────────────────
function ThinkingState({ text }: { text: string }) {
  const steps = [
    'Interpretando o pedido…',
    'Calculando dimensões ABNT…',
    'Organizando zonas sociais e privadas…',
    'Posicionando circulação…',
    'Gerando planta final…',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center py-8 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-purple-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-white text-sm font-medium">{steps[step]}</p>
        <p className="text-slate-500 text-xs">"{text.slice(0, 60)}{text.length > 60 ? '…' : ''}"</p>
      </div>
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'w-6 bg-purple-500' : 'w-2 bg-slate-700'}`} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
type Phase = 'input' | 'thinking' | 'preview' | 'done';

export function AIAssistant({ onClose }: AIAssistantProps) {
  const [phase, setPhase] = useState<Phase>('input');
  const [inputText, setInputText] = useState('');
  const [plan, setPlan] = useState<GeneratedFloorPlan | null>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generate = (prompt: string) => {
    if (!prompt.trim()) return;
    setInputText(prompt);
    setPhase('thinking');
    setError('');

    // Simulate async processing (architectural rules are synchronous but feel premium with delay)
    setTimeout(() => {
      try {
        const parsed = parseDescription(prompt);
        const generated = generateFloorPlan(parsed);
        setPlan(generated);
        setPhase('preview');
      } catch (e) {
        setError('Não foi possível gerar a planta. Tente descrever de forma mais detalhada.');
        setPhase('input');
      }
    }, 1800);
  };

  const applyPlan = () => {
    if (!plan) return;
    applyFloorPlan(plan);
    setPhase('done');
    setTimeout(onClose, 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-purple-900/40 to-pink-900/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Gerador de Plantas IA</h2>
              <p className="text-[11px] text-slate-400">Normas ABNT · Layout arquitetônico automático</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* DONE */}
            {phase === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 px-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1, damping: 15 }}
                  className="w-20 h-20 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mb-5"
                >
                  <Check className="w-10 h-10 text-green-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Planta gerada!</h3>
                <p className="text-slate-400 text-sm">
                  {plan?.rooms.length} cômodos adicionados ao canvas.
                </p>
              </motion.div>
            )}

            {/* THINKING */}
            {phase === 'thinking' && (
              <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-5 py-4">
                <ThinkingState text={inputText} />
              </motion.div>
            )}

            {/* PREVIEW */}
            {phase === 'preview' && plan && (
              <motion.div key="preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="p-5 space-y-4">

                {/* Plan header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-white font-semibold text-base">{plan.title}</h3>
                    <p className="text-slate-400 text-xs mt-0.5 capitalize">{plan.description}</p>
                  </div>
                  <button
                    onClick={() => { setPhase('input'); setPlan(null); }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Gerar outro
                  </button>
                </div>

                {/* SVG Preview */}
                <FloorPlanPreview plan={plan} />

                {/* Warnings */}
                {plan.warnings.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                    {plan.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* ABNT compliance badge */}
                <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-xs text-green-300">
                    Layout gerado seguindo normas <strong>ABNT NBR 15575</strong> e boas práticas de arquitetura residencial.
                  </p>
                </div>

                {/* Apply button */}
                <button
                  onClick={applyPlan}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                >
                  <Check className="w-5 h-5" />
                  Aplicar no Canvas
                </button>
              </motion.div>
            )}

            {/* INPUT */}
            {phase === 'input' && (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} className="p-5 space-y-5">

                {/* Text input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Descreva a planta que deseja
                  </label>
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(inputText); }
                      }}
                      placeholder="Ex: casa com 3 quartos sendo 1 suíte, sala americana, cozinha, 2 banheiros, área de serviço e garagem para 2 carros"
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 resize-none pr-12 transition-colors"
                    />
                    <button
                      onClick={() => generate(inputText)}
                      disabled={!inputText.trim()}
                      className="absolute bottom-3 right-3 p-2 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Info box */}
                <div className="flex items-start gap-2.5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300 leading-relaxed">
                    O gerador respeita dimensões mínimas da <strong>ABNT NBR 15575</strong>, organiza zonas sociais, privadas e de serviço, e posiciona corredores de circulação automaticamente.
                  </p>
                </div>

                {/* Quick templates */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Ou escolha um modelo pronto
                  </p>
                  <div className="space-y-2">
                    {QUICK_TEMPLATES.map(({ icon: Icon, label, sub, prompt, color }) => (
                      <button
                        key={label}
                        onClick={() => generate(prompt)}
                        className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl text-left transition-all group"
                      >
                        <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-md`}>
                          <Icon className="w-[18px] h-[18px] text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{label}</p>
                          <p className="text-xs text-slate-500 truncate">{sub}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
