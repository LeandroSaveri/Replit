// ============================================
// DASHBOARD - Painel Principal (mobile-first)
// ============================================

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth';
import {
  FolderOpen,
  Plus,
  Clock,
  Star,
  TrendingUp,
  Users,
  Box,
  Layers,
  Home,
  MoreVertical,
  Search,
  Filter,
  Grid3X3,
  List,
  ScanLine,
  Camera,
  X,
  Check,
  AlertCircle,
  RotateCcw,
  LayoutTemplate,
  Calculator,
  View,
  Sparkles,
  BarChart3,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { arSessionManager, ARSessionPhase } from '@ar/ARSessionManager';
import { RoomScanConverter } from '@ar/RoomScanConverter';

interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  updatedAt: string;
  floors: number;
  isFavorite?: boolean;
}

// Mapeamento de cores para Tailwind (evita classes dinâmicas)
const colorStyles: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
  green: 'bg-green-500/20 text-green-400',
  purple: 'bg-purple-500/20 text-purple-400',
  pink: 'bg-pink-500/20 text-pink-400',
  orange: 'bg-orange-500/20 text-orange-400',
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Scan Room Modal State
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanPhase, setScanPhase] = useState<ARSessionPhase>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setProjects([
        {
          id: '1',
          name: 'Casa Moderna',
          description: 'Projeto residencial com 3 quartos',
          updatedAt: new Date().toISOString(),
          floors: 2,
          isFavorite: true,
        },
        {
          id: '2',
          name: 'Apartamento Centro',
          description: 'Apartamento de 2 quartos no centro',
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          floors: 1,
        },
        {
          id: '3',
          name: 'Escritório Comercial',
          description: 'Escritório com 5 salas',
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
          floors: 1,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    arSessionManager.on('phaseChange', (phase: ARSessionPhase) => {
      setScanPhase(phase);
    });
    arSessionManager.on('progress', (update: { progress: number; message: string }) => {
      setScanProgress(update.progress);
      setScanMessage(update.message);
    });
    arSessionManager.on('error', (error: Error) => {
      setScanError(error.message);
      setScanPhase('error');
    });
    arSessionManager.on('floorPlanReady', (floorPlan) => {
      localStorage.setItem('scannedFloorPlan', JSON.stringify(floorPlan));
      setTimeout(() => {
        setShowScanModal(false);
        navigate('/editor?mode=scan');
      }, 1500);
    });
    return () => {
      arSessionManager.removeAllListeners();
    };
  }, [navigate]);

  const checkARSupport = async () => {
    const supported = await arSessionManager.checkSupport();
    setIsARSupported(supported);
    return supported;
  };

  const startScanRoom = async () => {
    setShowScanModal(true);
    setScanPhase('initializing');
    setScanError(null);
    setScanProgress(0);
    const supported = await checkARSupport();
    if (supported && videoRef.current && canvasRef.current) {
      const initialized = await arSessionManager.initialize();
      if (initialized) {
        await arSessionManager.startARSession(canvasRef.current);
        await arSessionManager.startScanning();
      }
    } else if (videoRef.current) {
      const fallbackStarted = await arSessionManager.startFallbackMode(videoRef.current);
      if (fallbackStarted) {
        await arSessionManager.startScanning();
      }
    }
  };

  const stopScanning = async () => {
    await arSessionManager.completeScanWorkflow();
  };

  const cancelScan = () => {
    arSessionManager.endSession();
    setShowScanModal(false);
    setScanPhase('idle');
    setScanProgress(0);
    setScanError(null);
  };

  const retryScan = () => {
    setScanError(null);
    setScanPhase('idle');
    startScanRoom();
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Projetos', value: projects.length, icon: FolderOpen, color: 'blue' },
    { label: 'Favoritos', value: projects.filter(p => p.isFavorite).length, icon: Star, color: 'yellow' },
    { label: 'Colaborações', value: 3, icon: Users, color: 'green' },
    { label: 'Móveis', value: 156, icon: Box, color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-20 md:pb-0">
      {/* Header responsivo */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:inline">AuriPlan</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={startScanRoom}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm sm:text-base"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Room</span>
              <span className="sm:hidden">Scan</span>
            </button>
            <button
              onClick={() => navigate('/editor')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Projeto
            </button>
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Bem-vindo de volta, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Você tem {projects.length} projetos. Continue criando designs incríveis.
          </p>
        </div>

        {/* Stats grid responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const styleClass = colorStyles[stat.color] || 'bg-slate-500/20 text-slate-400';
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${styleClass} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-slate-500 text-sm sm:text-base">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { icon: LayoutTemplate, label: 'Templates', color: 'purple', onClick: () => navigate('/editor?template=true') },
              { icon: Calculator, label: 'Orçamento', color: 'green', onClick: () => navigate('/editor?quotation=true') },
              { icon: View, label: 'Tour 360°', color: 'blue', onClick: () => navigate('/editor?tour=true') },
              { icon: Sparkles, label: 'Design IA', color: 'pink', onClick: () => navigate('/editor?ai=true') },
              { icon: BarChart3, label: 'Relatórios', color: 'orange', onClick: () => {} },
              { icon: Lightbulb, label: 'Inspirações', color: 'yellow', onClick: () => {} },
            ].map((action, index) => {
              const Icon = action.icon;
              const styleClass = colorStyles[action.color] || 'bg-slate-500/20 text-slate-400';
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={action.onClick}
                  className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-${action.color}-500/50 hover:bg-slate-800/50 transition-all group`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${styleClass} rounded-xl flex items-center justify-center group-hover:bg-${action.color}-500/30 transition-colors`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Recent Templates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Templates Populares</h2>
            <button 
              onClick={() => navigate('/editor?template=true')}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Apartamento Moderno', category: 'Residencial', area: 75 },
              { name: 'Escritório Corporativo', category: 'Comercial', area: 200 },
              { name: 'Casa de Luxo', category: 'Residencial', area: 450 },
              { name: 'Loja de Roupas', category: 'Comercial', area: 120 },
            ].map((template, index) => (
              <motion.div
                key={template.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate('/editor')}
                className="group cursor-pointer"
              >
                <div className="aspect-video bg-slate-800 rounded-xl mb-3 flex items-center justify-center border border-slate-700 group-hover:border-blue-500/50 transition-colors">
                  <Home className="w-10 h-10 text-slate-600 group-hover:text-blue-400 transition-colors" />
                </div>
                <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors text-sm sm:text-base">{template.name}</h3>
                <p className="text-xs sm:text-sm text-slate-500">{template.category} • {template.area}m²</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-white">Meus Projetos</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-10 pr-4 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-40 sm:w-auto"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <Filter className="w-5 h-5" />
              </button>
              <div className="flex items-center bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Nenhum projeto encontrado</h3>
                <p className="text-slate-500 mb-4">Crie seu primeiro projeto para começar</p>
                <button
                  onClick={() => navigate('/editor')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Criar Projeto
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate('/editor')}
                    className="group p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/80 transition-all"
                  >
                    <div className="aspect-video bg-slate-700 rounded-lg mb-4 flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                      <Home className="w-12 h-12 text-slate-500" />
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-white mb-1">{project.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                      </div>
                      <button className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {project.floors} andar{project.floors > 1 ? 'es' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate('/editor')}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/80 transition-all"
                  >
                    <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Home className="w-8 h-8 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white mb-1">{project.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        {project.floors} andar{project.floors > 1 ? 'es' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors self-end sm:self-center">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FAB para criar novo projeto (mobile) */}
      <button
        onClick={() => navigate('/editor')}
        className="fixed bottom-6 right-6 md:hidden w-14 h-14 rounded-full bg-blue-500 text-white shadow-xl flex items-center justify-center hover:bg-blue-600 transition-all active:scale-95 z-20"
        title="Novo Projeto"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Scan Room Modal (com scroll seguro em mobile) */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Scan Room</h2>
                  <p className="text-sm text-slate-400">
                    Escaneie seu ambiente para criar uma planta automática
                  </p>
                </div>
              </div>
              <button
                onClick={cancelScan}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                />

                {scanPhase === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-purple-500" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-purple-500" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-purple-500" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-purple-500" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-12 h-12 border-2 border-purple-500/50 rounded-full animate-pulse" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full">
                      <span className="text-sm text-purple-300 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        Escaneando...
                      </span>
                    </div>
                  </div>
                )}

                {scanPhase === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                    <div className="text-center">
                      <ScanLine className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Clique em "Iniciar Scan" para começar</p>
                    </div>
                  </div>
                )}

                {scanPhase === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                    <div className="text-center">
                      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <p className="text-red-400 mb-2">Erro no escaneamento</p>
                      <p className="text-sm text-slate-500">{scanError}</p>
                    </div>
                  </div>
                )}

                {scanPhase === 'completed' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-green-400 mb-2">Planta criada com sucesso!</p>
                      <p className="text-sm text-slate-500">Abrindo editor...</p>
                    </div>
                  </div>
                )}
              </div>

              {(scanPhase === 'initializing' || scanPhase === 'scanning' || scanPhase === 'processing' || scanPhase === 'converting') && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">{scanMessage}</span>
                    <span className="text-sm text-slate-500">{Math.round(scanProgress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {scanPhase === 'scanning' && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
                  <h4 className="text-sm font-medium text-white mb-2">Dicas para um bom scan:</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Movimente-se lentamente pelo ambiente</li>
                    <li>• Mantenha a câmera apontada para as paredes</li>
                    <li>• Evite movimentos bruscos</li>
                    <li>• Certifique-se de boa iluminação</li>
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 flex-wrap">
                {scanPhase === 'error' && (
                  <button
                    onClick={retryScan}
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Tentar Novamente
                  </button>
                )}

                {scanPhase === 'idle' || scanPhase === 'error' ? (
                  <>
                    <button
                      onClick={cancelScan}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={startScanRoom}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      <ScanLine className="w-4 h-4" />
                      Iniciar Scan
                    </button>
                  </>
                ) : scanPhase === 'scanning' ? (
                  <button
                    onClick={stopScanning}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Finalizar Scan
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
