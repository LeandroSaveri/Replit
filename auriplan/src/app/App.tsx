// ============================================================
// AuriPlan — Dashboard SaaS Premium
// Inspired by Figma · Framer · Linear
// Layout: Fixed Sidebar + Main Content Area
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, LayoutTemplate, BookOpen,
  Sparkles, Settings, Plus, Upload, Clock, ChevronRight,
  Search, Bell, Zap, Home, Bed, UtensilsCrossed, Bath,
  Briefcase, Sofa, Lamp, Package, Star, TrendingUp,
  User, LogOut, HelpCircle, X, Check, ArrowRight,
  Building2, Trees, Coffee, Grid3X3,
} from 'lucide-react';
import { Editor } from '@features/editor/Editor';
import { useEditorStore } from '@store/editorStore';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { ToastProvider, useToastSimple } from '@components/ui/SimpleToast';
import { CommandPalette } from '@components/ui/CommandPalette';
import { FLOOR_PLAN_TEMPLATES } from '@features/editor/templates/floorPlanTemplates';

// ─── Types ────────────────────────────────────────────────────
type Page = 'dashboard' | 'projects' | 'templates' | 'library' | 'ai' | 'settings';

// ─── Constants ────────────────────────────────────────────────
const RECENT_PROJECTS = [
  {
    id: '1', name: 'Sala Moderna', time: 'Há 1 dia',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&h=380&fit=crop&auto=format',
  },
  {
    id: '2', name: 'Apartamento T2', time: '4 dias atrás',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=380&fit=crop&auto=format',
  },
  {
    id: '3', name: 'Escritório Home', time: '9 dias atrás',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=380&fit=crop&auto=format',
  },
];

const TEMPLATE_ITEMS = [
  {
    id: 'apt', name: 'Apartamento', desc: '2 quartos, 1 suíte',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=380&fit=crop&auto=format',
    templateId: 'apt-2br',
  },
  {
    id: 'house', name: 'Casa', desc: '3 quartos, quintal',
    image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=380&fit=crop&auto=format',
    templateId: 'house-3br',
  },
  {
    id: 'studio', name: 'Studio', desc: 'Espaço aberto',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=380&fit=crop&auto=format',
    templateId: 'studio',
  },
  {
    id: 'office', name: 'Escritório', desc: 'Home office',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=380&fit=crop&auto=format',
    templateId: 'apt-1br',
  },
  {
    id: 'loft', name: 'Loft', desc: 'Apartamento loft',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=380&fit=crop&auto=format',
    templateId: 'house-2br',
  },
  {
    id: 'kitchen', name: 'Cozinha', desc: 'Cozinha equipada',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=380&fit=crop&auto=format',
    templateId: 'studio',
  },
  {
    id: 'bath', name: 'Banheiro', desc: 'Banheiro moderno',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=380&fit=crop&auto=format',
    templateId: 'studio',
  },
];

const LIBRARY_CATEGORIES = [
  { id: 'sofas', label: 'Sofás', icon: Sofa },
  { id: 'camas', label: 'Camas', icon: Bed },
  { id: 'mesas', label: 'Mesas', icon: Coffee },
  { id: 'cozinha', label: 'Cozinha', icon: UtensilsCrossed },
  { id: 'banheiro', label: 'Banheiro', icon: Bath },
  { id: 'iluminacao', label: 'Iluminação', icon: Lamp },
  { id: 'decoracao', label: 'Decoração', icon: Star },
];

const LIBRARY_ITEMS: Record<string, { name: string; category: string; color: string }[]> = {
  sofas: [
    { name: 'Sofá 3 Lugares', category: 'Sofás', color: 'from-slate-400 to-slate-600' },
    { name: 'Sofá Retrátil', category: 'Sofás', color: 'from-amber-400 to-orange-500' },
    { name: 'Poltrona', category: 'Sofás', color: 'from-emerald-400 to-teal-500' },
    { name: 'Chaise Longue', category: 'Sofás', color: 'from-violet-400 to-purple-500' },
    { name: 'Sofá Canto', category: 'Sofás', color: 'from-blue-400 to-indigo-500' },
    { name: 'Love Seat', category: 'Sofás', color: 'from-rose-400 to-pink-500' },
  ],
  camas: [
    { name: 'Cama Queen', category: 'Camas', color: 'from-indigo-400 to-blue-500' },
    { name: 'Cama King', category: 'Camas', color: 'from-teal-400 to-emerald-500' },
    { name: 'Cama Solteiro', category: 'Camas', color: 'from-orange-400 to-amber-500' },
    { name: 'Beliche', category: 'Camas', color: 'from-pink-400 to-rose-500' },
    { name: 'Cama Box', category: 'Camas', color: 'from-slate-500 to-gray-600' },
    { name: 'Cama Casal', category: 'Camas', color: 'from-violet-400 to-indigo-500' },
  ],
  mesas: [
    { name: 'Mesa de Jantar', category: 'Mesas', color: 'from-amber-500 to-yellow-600' },
    { name: 'Mesa de Escritório', category: 'Mesas', color: 'from-slate-400 to-gray-500' },
    { name: 'Mesa de Centro', category: 'Mesas', color: 'from-emerald-400 to-green-500' },
    { name: 'Mesa Lateral', category: 'Mesas', color: 'from-blue-400 to-sky-500' },
    { name: 'Escrivaninha', category: 'Mesas', color: 'from-rose-400 to-red-500' },
    { name: 'Mesa Redonda', category: 'Mesas', color: 'from-purple-400 to-violet-500' },
  ],
  cozinha: [
    { name: 'Geladeira', category: 'Cozinha', color: 'from-gray-300 to-slate-400' },
    { name: 'Fogão', category: 'Cozinha', color: 'from-orange-400 to-red-500' },
    { name: 'Pia', category: 'Cozinha', color: 'from-sky-300 to-blue-400' },
    { name: 'Bancada', category: 'Cozinha', color: 'from-stone-300 to-stone-500' },
    { name: 'Ilha de Cozinha', category: 'Cozinha', color: 'from-slate-200 to-gray-400' },
    { name: 'Forno', category: 'Cozinha', color: 'from-red-400 to-rose-500' },
  ],
  banheiro: [
    { name: 'Banheira', category: 'Banheiro', color: 'from-sky-200 to-blue-300' },
    { name: 'Box Chuveiro', category: 'Banheiro', color: 'from-slate-300 to-gray-400' },
    { name: 'Vaso Sanitário', category: 'Banheiro', color: 'from-white to-slate-200' },
    { name: 'Pia Banheiro', category: 'Banheiro', color: 'from-stone-200 to-stone-400' },
    { name: 'Armário', category: 'Banheiro', color: 'from-amber-200 to-amber-400' },
    { name: 'Espelho', category: 'Banheiro', color: 'from-blue-100 to-blue-300' },
  ],
  iluminacao: [
    { name: 'Lustre', category: 'Iluminação', color: 'from-yellow-300 to-amber-400' },
    { name: 'Spot LED', category: 'Iluminação', color: 'from-white to-yellow-100' },
    { name: 'Abajur', category: 'Iluminação', color: 'from-orange-200 to-amber-300' },
    { name: 'Arandela', category: 'Iluminação', color: 'from-yellow-200 to-orange-300' },
    { name: 'Trilho de Luz', category: 'Iluminação', color: 'from-slate-200 to-yellow-200' },
    { name: 'Luminária Piso', category: 'Iluminação', color: 'from-amber-100 to-yellow-200' },
  ],
  decoracao: [
    { name: 'Vaso de Planta', category: 'Decoração', color: 'from-green-400 to-emerald-500' },
    { name: 'Quadro', category: 'Decoração', color: 'from-purple-300 to-pink-400' },
    { name: 'Tapete', category: 'Decoração', color: 'from-rose-200 to-red-300' },
    { name: 'Cortina', category: 'Decoração', color: 'from-slate-100 to-slate-300' },
    { name: 'Prateleira', category: 'Decoração', color: 'from-amber-300 to-yellow-400' },
    { name: 'Espelho Deco', category: 'Decoração', color: 'from-gold-200 to-amber-200' },
  ],
};

// ─── Sidebar ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects' as Page, label: 'Projetos', icon: FolderOpen },
  { id: 'templates' as Page, label: 'Templates', icon: LayoutTemplate },
  { id: 'library' as Page, label: 'Biblioteca', icon: BookOpen },
  { id: 'ai' as Page, label: 'AI Design', icon: Sparkles },
  { id: 'settings' as Page, label: 'Configurações', icon: Settings },
];

function Sidebar({
  activePage,
  onPageChange,
  onNewProject,
}: {
  activePage: Page;
  onPageChange: (p: Page) => void;
  onNewProject: () => void;
}) {
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[156px] flex flex-col z-40"
      style={{ background: '#0E1428', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5B8CFF,#8B5CF6)' }}>
          <Home className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-base tracking-tight">AuriPlan</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onPageChange(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group"
              style={{
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.color = '#fff';
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? '#5B8CFF' : 'inherit' }} />
              <span className="text-sm font-medium">{label}</span>
              {id === 'ai' && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(139,92,246,0.25)', color: '#a78bfa' }}>
                  NOVO
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Upgrade Pro */}
      <div className="p-3 flex-shrink-0 space-y-3">
        {/* Social icons */}
        <div className="flex items-center justify-center gap-3 pb-2">
          {[
            { label: '©', title: 'Instagram' },
            { label: '▶', title: 'YouTube' },
            { label: '⬡', title: 'Discord' },
            { label: '✕', title: 'Twitter/X' },
          ].map(s => (
            <button key={s.label} title={s.title}
              className="text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; }}>
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg"
          style={{
            background: 'linear-gradient(135deg,#5B8CFF,#8B5CF6)',
            boxShadow: '0 4px 20px rgba(91,140,255,0.25)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(91,140,255,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(91,140,255,0.25)'; }}
        >
          <Zap className="w-3.5 h-3.5" />
          Upgrade Pro
        </button>
      </div>
    </aside>
  );
}

// ─── Top Header ───────────────────────────────────────────────
function TopHeader({
  onSearch,
  onShowPalette,
}: {
  onSearch?: () => void;
  onShowPalette: () => void;
}) {
  return (
    <header
      className="h-14 flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-30"
      style={{
        background: 'rgba(15,20,40,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex-1" />

      {/* Search */}
      <button
        onClick={onShowPalette}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.4)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
        }}
      >
        <Search className="w-4 h-4" />
        <span>Buscar...</span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', fontSize: '11px' }}>
          Ctrl K
        </span>
      </button>

      {/* Bell */}
      <button
        className="relative p-2 rounded-xl transition-colors"
        style={{ color: 'rgba(255,255,255,0.4)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <Bell className="w-4.5 h-4.5" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#5B8CFF' }} />
      </button>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer ring-2 ring-offset-2 ring-offset-transparent"
        style={{ ringColor: 'rgba(91,140,255,0.4)' }}>
        <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: 'linear-gradient(135deg,#5B8CFF,#8B5CF6)' }}>
          L
        </div>
      </div>
    </header>
  );
}

// ─── Project Card ─────────────────────────────────────────────
function ProjectCard({
  name, time, image, onOpen, delay = 0,
}: {
  name: string; time: string; image: string; onOpen: () => void; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        borderRadius: '16px',
      }}
      onClick={onOpen}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(17,24,39,0.9) 0%, transparent 60%)' }} />
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex items-end justify-between">
        <div>
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{time}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all duration-150"
          style={{ background: 'rgba(91,140,255,0.15)', border: '1px solid rgba(91,140,255,0.3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,140,255,0.3)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,140,255,0.15)'; }}
        >
          Abrir
        </button>
      </div>
    </motion.div>
  );
}

// ─── Template Card ────────────────────────────────────────────
function TemplateCard({
  name, desc, image, onClick, delay = 0,
}: {
  name: string; desc: string; image: string; onClick: () => void; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        borderRadius: '16px',
      }}
      onClick={onClick}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(17,24,39,0.85) 0%, transparent 55%)' }} />
      </div>
      <div className="px-4 py-3">
        <p className="text-white font-semibold text-sm">{name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────
function DashboardPage({
  onNewProject,
  onImport,
  onOpenProject,
  onLoadTemplate,
}: {
  onNewProject: () => void;
  onImport: () => void;
  onOpenProject: () => void;
  onLoadTemplate: (id: string) => void;
}) {
  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          <span className="font-extrabold">Bem-vindo</span> de volta, Leandro 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
          Continue seu trabalho ou crie algo novo
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex items-center gap-3 mb-10">
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(91,140,255,0.45)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewProject}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg,#5B8CFF,#8B5CF6)',
            boxShadow: '0 6px 24px rgba(91,140,255,0.3)',
          }}
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onImport}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Upload className="w-4 h-4" />
          Importar Planta
        </motion.button>
      </div>

      {/* Divider */}
      <div className="mb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Recent Projects */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Projetos Recentes</h2>
          <button className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: 'rgba(91,140,255,0.8)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#5B8CFF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(91,140,255,0.8)'; }}
            onClick={onOpenProject}>
            Ver todos <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {RECENT_PROJECTS.map((p, i) => (
            <ProjectCard
              key={p.id}
              name={p.name}
              time={p.time}
              image={p.image}
              onOpen={onOpenProject}
              delay={i * 0.05}
            />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Templates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Começar com Template</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {TEMPLATE_ITEMS.map((t, i) => (
            <TemplateCard
              key={t.id}
              name={t.name}
              desc={t.desc}
              image={t.image}
              onClick={() => onLoadTemplate(t.templateId)}
              delay={i * 0.04}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Projects Page ────────────────────────────────────────────
function ProjectsPage({
  onNewProject,
  onOpenProject,
}: {
  onNewProject: () => void;
  onOpenProject: () => void;
}) {
  const allProjects = [
    ...RECENT_PROJECTS,
    { id: '4', name: 'Loft Industrial', time: '15 dias atrás', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=380&fit=crop&auto=format' },
    { id: '5', name: 'Quarto Casal', time: '22 dias atrás', image: 'https://images.unsplash.com/photo-1560185127-6a2a6a3a3a54?w=600&h=380&fit=crop&auto=format' },
    { id: '6', name: 'Cozinha Americana', time: '1 mês atrás', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=380&fit=crop&auto=format' },
  ];

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Projetos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{allProjects.length} projetos</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewProject}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg,#5B8CFF,#8B5CF6)', boxShadow: '0 6px 24px rgba(91,140,255,0.3)' }}
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </motion.button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {allProjects.map((p, i) => (
          <ProjectCard key={p.id} name={p.name} time={p.time} image={p.image} onOpen={onOpenProject} delay={i * 0.05} />
        ))}
      </div>
    </div>
  );
}

// ─── Templates Page ───────────────────────────────────────────
function TemplatesPage({ onLoadTemplate }: { onLoadTemplate: (id: string) => void }) {
  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Templates</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Escolha um template e personalize</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {TEMPLATE_ITEMS.map((t, i) => (
          <TemplateCard
            key={t.id}
            name={t.name}
            desc={t.desc}
            image={t.image}
            onClick={() => onLoadTemplate(t.templateId)}
            delay={i * 0.05}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Library Page ─────────────────────────────────────────────
function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState('sofas');
  const items = LIBRARY_ITEMS[activeCategory] ?? [];

  return (
    <div className="px-8 py-8 flex gap-6 max-w-5xl">
      {/* Category sidebar */}
      <div className="w-44 flex-shrink-0">
        <h1 className="text-xl font-bold text-white mb-5">Biblioteca</h1>
        <nav className="space-y-0.5">
          {LIBRARY_CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left"
              style={{
                background: activeCategory === id ? 'rgba(91,140,255,0.15)' : 'transparent',
                color: activeCategory === id ? '#5B8CFF' : 'rgba(255,255,255,0.5)',
                border: activeCategory === id ? '1px solid rgba(91,140,255,0.3)' : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (activeCategory !== id) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                }
              }}
              onMouseLeave={e => {
                if (activeCategory !== id) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
                }
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Items grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{items.length} itens</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
              className="rounded-2xl overflow-hidden cursor-pointer group"
              style={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              {/* Gradient preview */}
              <div className={`h-28 bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                <Package className="w-10 h-10 text-white/40 group-hover:text-white/60 transition-colors" />
              </div>
              <div className="px-3 py-2.5">
                <p className="text-white text-sm font-medium">{item.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Design Page ───────────────────────────────────────────
const AI_TOOLS = [
  {
    icon: Grid3X3,
    title: 'Gerar Layout Automático',
    desc: 'A IA analisa suas paredes e gera um layout otimizado com móveis posicionados perfeitamente.',
    tag: 'Popular',
    gradient: 'from-blue-500 to-violet-600',
    glow: 'rgba(91,140,255,0.35)',
  },
  {
    icon: Package,
    title: 'Sugerir Móveis',
    desc: 'Recomendações personalizadas de móveis com base no estilo do cômodo e espaço disponível.',
    tag: null,
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.35)',
  },
  {
    icon: TrendingUp,
    title: 'Otimizar Espaço',
    desc: 'Maximiza aproveitamento da área com sugestões de reorganização e uso de cada metro quadrado.',
    tag: null,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.35)',
  },
  {
    icon: Sparkles,
    title: 'Gerar Decoração',
    desc: 'Sugestões de paleta de cores, texturas e elementos decorativos para cada ambiente.',
    tag: 'Novo',
    gradient: 'from-pink-500 to-rose-600',
    glow: 'rgba(236,72,153,0.35)',
  },
];

function AIDesignPage({ onNewProject }: { onNewProject: () => void }) {
  const [running, setRunning] = useState<string | null>(null);

  const handleRun = (title: string) => {
    setRunning(title);
    setTimeout(() => {
      setRunning(null);
      onNewProject();
    }, 1600);
  };

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5" style={{ color: '#8B5CF6' }} />
          <h1 className="text-xl font-bold text-white">AI Design</h1>
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Ferramentas de inteligência artificial para acelerar seu projeto
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {AI_TOOLS.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-5 flex flex-col gap-4 group"
            style={{
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                style={{ boxShadow: `0 8px 24px ${tool.glow}` }}>
                <tool.icon className="w-5 h-5 text-white" />
              </div>
              {tool.tag && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(139,92,246,0.2)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    color: '#a78bfa',
                  }}>
                  {tool.tag}
                </span>
              )}
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm mb-1">{tool.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{tool.desc}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleRun(tool.title)}
              disabled={running !== null}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 ${running === tool.title ? 'opacity-70' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${tool.gradient.replace('from-', '').replace('to-', ',')})`,
                opacity: running !== null && running !== tool.title ? 0.5 : undefined,
              }}
            >
              {running === tool.title ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Gerando...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Usar ferramenta
                </>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────
function SettingsPage() {
  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Configurações</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Gerencie sua conta e preferências</p>
      </div>

      {[
        { label: 'Perfil', items: [
          { key: 'Nome', value: 'Leandro' },
          { key: 'Email', value: 'leandro@example.com' },
          { key: 'Plano', value: 'Gratuito' },
        ]},
        { label: 'Preferências', items: [
          { key: 'Idioma', value: 'Português (BR)' },
          { key: 'Unidade de medida', value: 'Metros' },
          { key: 'Tema', value: 'Escuro' },
        ]},
      ].map(section => (
        <div key={section.label} className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {section.label.toUpperCase()}
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)' }}>
            {section.items.map((item, i) => (
              <div
                key={item.key}
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: i < section.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.key}</span>
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
const DEFAULT_OWNER = { id: 'user-1', name: 'Leandro', email: 'leandro@example.com', role: 'owner' as const };

function InnerApp() {
  const [view, setView] = useState<'dashboard' | 'loading' | 'editor'>('dashboard');
  const [page, setPage] = useState<Page>('dashboard');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [openScanOnEnter, setOpenScanOnEnter] = useState(false);
  const { createProject, loadTemplate } = useEditorStore();
  const toast = useToastSimple();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const goToEditor = () => setTimeout(() => setView('editor'), 1400);

  const handleNewProject = () => {
    setView('loading');
    try { createProject('Novo Projeto', DEFAULT_OWNER, ''); } catch {}
    goToEditor();
  };

  const handleImport = () => {
    toast.info('Importar Planta', 'Suporte a DXF/PDF em breve.');
  };

  const handleOpenProject = () => {
    setView('loading');
    try { createProject('Projeto Aberto', DEFAULT_OWNER, ''); } catch {}
    goToEditor();
  };

  const handleLoadTemplate = (templateId: string) => {
    setView('loading');
    const found = FLOOR_PLAN_TEMPLATES.find(t => t.id === templateId);
    if (found) {
      try { loadTemplate(found); } catch {}
    } else {
      try { createProject(templateId, DEFAULT_OWNER, ''); } catch {}
    }
    goToEditor();
  };

  const handleScan = () => {
    setOpenScanOnEnter(true);
    setView('loading');
    try { createProject('Scan de Cômodo', DEFAULT_OWNER, ''); } catch {}
    goToEditor();
  };

  if (view === 'loading') {
    return <LoadingScreen />;
  }

  if (view === 'editor') {
    return (
      <Editor
        onBack={() => { setView('dashboard'); setOpenScanOnEnter(false); }}
        openScanOnMount={openScanOnEnter}
      />
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <DashboardPage
            onNewProject={handleNewProject}
            onImport={handleImport}
            onOpenProject={handleOpenProject}
            onLoadTemplate={handleLoadTemplate}
          />
        );
      case 'projects':
        return <ProjectsPage onNewProject={handleNewProject} onOpenProject={handleOpenProject} />;
      case 'templates':
        return <TemplatesPage onLoadTemplate={handleLoadTemplate} />;
      case 'library':
        return <LibraryPage />;
      case 'ai':
        return <AIDesignPage onNewProject={handleNewProject} />;
      case 'settings':
        return <SettingsPage />;
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#0B1020' }}
    >
      {/* Radial gradient background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '20%',
          width: '60vw', height: '60vh',
          background: 'radial-gradient(ellipse, rgba(91,140,255,0.07) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '10%',
          width: '50vw', height: '50vh',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 70%)',
        }} />
      </div>

      {/* Sidebar */}
      <Sidebar activePage={page} onPageChange={setPage} onNewProject={handleNewProject} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden ml-[156px] relative" style={{ zIndex: 1 }}>
        <TopHeader onShowPalette={() => setShowCommandPalette(true)} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            onAction={(id) => {
              const actions: Record<string, () => void> = {
                'save': () => toast.success('Salvo', 'Projeto salvo.'),
                'tool-wall': handleNewProject,
                'templates': () => setPage('templates'),
                'catalog': () => setPage('library'),
                'ai-assistant': () => setPage('ai'),
              };
              actions[id]?.();
              setShowCommandPalette(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────
function App() {
  return (
    <ToastProvider>
      <InnerApp />
    </ToastProvider>
  );
}

export default App;
