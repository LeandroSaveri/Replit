// ============================================
// VIRTUAL TOUR - Tour Virtual 360°
// ============================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  View, 
  Navigation, 
  MapPin, 
  Info, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Fullscreen,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Camera,
  MessageSquare,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Settings,
  Eye
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';

// ============================================
// TYPES
// ============================================
export interface TourPoint {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  thumbnail: string;
  hotspots: Hotspot[];
}

export interface Hotspot {
  id: string;
  type: 'navigate' | 'info' | 'media' | 'product';
  position: { x: number; y: number };
  target?: string;
  title: string;
  description?: string;
  mediaUrl?: string;
}

// ============================================
// MOCK TOUR DATA
// ============================================
const mockTourPoints: TourPoint[] = [
  {
    id: 'point-1',
    name: 'Sala de Estar',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    thumbnail: '/tour/living-room.jpg',
    hotspots: [
      { id: 'h1', type: 'navigate', position: { x: 30, y: 50 }, target: 'point-2', title: 'Ir para Cozinha' },
      { id: 'h2', type: 'info', position: { x: 60, y: 40 }, title: 'Sofá', description: 'Sofá em couro italiano, 3 lugares' },
      { id: 'h3', type: 'info', position: { x: 45, y: 30 }, title: 'TV', description: 'Smart TV 65" 4K' },
    ],
  },
  {
    id: 'point-2',
    name: 'Cozinha',
    position: { x: 5, y: 0, z: 0 },
    rotation: { x: 0, y: 90, z: 0 },
    thumbnail: '/tour/kitchen.jpg',
    hotspots: [
      { id: 'h4', type: 'navigate', position: { x: 20, y: 50 }, target: 'point-1', title: 'Voltar para Sala' },
      { id: 'h5', type: 'navigate', position: { x: 80, y: 50 }, target: 'point-3', title: 'Ir para Quarto' },
      { id: 'h6', type: 'info', position: { x: 50, y: 35 }, title: 'Ilha', description: 'Ilha em mármore Carrara' },
    ],
  },
  {
    id: 'point-3',
    name: 'Quarto Principal',
    position: { x: 10, y: 0, z: 5 },
    rotation: { x: 0, y: 180, z: 0 },
    thumbnail: '/tour/bedroom.jpg',
    hotspots: [
      { id: 'h7', type: 'navigate', position: { x: 30, y: 50 }, target: 'point-2', title: 'Voltar para Cozinha' },
      { id: 'h8', type: 'navigate', position: { x: 70, y: 50 }, target: 'point-4', title: 'Ir para Banheiro' },
      { id: 'h9', type: 'info', position: { x: 50, y: 40 }, title: 'Cama', description: 'Cama King Size com cabeceira estofada' },
    ],
  },
  {
    id: 'point-4',
    name: 'Banheiro Suite',
    position: { x: 10, y: 0, z: 8 },
    rotation: { x: 0, y: 270, z: 0 },
    thumbnail: '/tour/bathroom.jpg',
    hotspots: [
      { id: 'h10', type: 'navigate', position: { x: 50, y: 50 }, target: 'point-3', title: 'Voltar para Quarto' },
      { id: 'h11', type: 'info', position: { x: 30, y: 35 }, title: 'Banheira', description: 'Banheira de hidromassagem' },
    ],
  },
];

// ============================================
// COMPONENT
// ============================================
interface VirtualTourProps {
  onClose: () => void;
}

export function VirtualTour({ onClose }: VirtualTourProps) {
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const currentPoint = mockTourPoints[currentPointIndex];

  // Auto rotation
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({ ...prev, y: prev.y + 0.2 }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  // Handle mouse drag for 360 view
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.3)),
      y: prev.y + deltaX * 0.3,
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const navigateToPoint = (index: number) => {
    setCurrentPointIndex(index);
    setRotation({ x: 0, y: 0 });
    setSelectedHotspot(null);
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (hotspot.type === 'navigate' && hotspot.target) {
      const targetIndex = mockTourPoints.findIndex(p => p.id === hotspot.target);
      if (targetIndex !== -1) {
        navigateToPoint(targetIndex);
      }
    } else {
      setSelectedHotspot(hotspot);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Main View */}
      <div 
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 360 View Placeholder */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center"
          style={{
            transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Room Placeholder */}
          <div className="relative w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <View className="w-32 h-32 text-slate-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">{currentPoint.name}</h2>
                <p className="text-slate-400">Arraste para olhar ao redor</p>
              </div>
            </div>

            {/* Grid Lines for 3D Effect */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white" />
              <div className="absolute top-1/4 left-0 right-0 h-px bg-white" />
              <div className="absolute top-3/4 left-0 right-0 h-px bg-white" />
              <div className="absolute top-0 bottom-0 left-1/4 w-px bg-white" />
              <div className="absolute top-0 bottom-0 left-3/4 w-px bg-white" />
            </div>

            {/* Hotspots */}
            {currentPoint.hotspots.map(hotspot => (
              <motion.button
                key={hotspot.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${hotspot.position.x}%`,
                  top: `${hotspot.position.y}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHotspotClick(hotspot);
                }}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 hover:border-white hover:bg-white/30 transition-all">
                    {hotspot.type === 'navigate' && <Navigation className="w-5 h-5 text-white" />}
                    {hotspot.type === 'info' && <Info className="w-5 h-5 text-white" />}
                    {hotspot.type === 'media' && <Camera className="w-5 h-5 text-white" />}
                    {hotspot.type === 'product' && <Eye className="w-5 h-5 text-white" />}
                  </div>
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                </div>
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-black/70 text-white text-sm rounded-lg whitespace-nowrap">
                  {hotspot.title}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => navigateToPoint((currentPointIndex - 1 + mockTourPoints.length) % mockTourPoints.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => navigateToPoint((currentPointIndex + 1) % mockTourPoints.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-xl">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-white font-medium">{currentPoint.name}</p>
                <p className="text-xs text-slate-400">{currentPointIndex + 1} de {mockTourPoints.length}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-3 rounded-xl backdrop-blur-sm transition-colors ${
                autoRotate ? 'bg-blue-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
              title="Rotação Automática"
            >
              <Compass className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowMap(!showMap)}
              className={`p-3 rounded-xl backdrop-blur-sm transition-colors ${
                showMap ? 'bg-blue-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
              title="Mapa"
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-xl backdrop-blur-sm transition-colors"
              title={isMuted ? 'Ativar Som' : 'Mutar'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-xl backdrop-blur-sm transition-colors"
              title="Tela Cheia"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-black/50 hover:bg-red-500/70 text-white rounded-xl backdrop-blur-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent">
          {/* Thumbnail Navigation */}
          <div className="flex items-center gap-2">
            {mockTourPoints.map((point, index) => (
              <button
                key={point.id}
                onClick={() => navigateToPoint(index)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentPointIndex 
                    ? 'border-blue-500 ring-2 ring-blue-500/50' 
                    : 'border-transparent hover:border-white/50'
                }`}
              >
                <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">{index + 1}</span>
                </div>
                {index === currentPointIndex && (
                  <div className="absolute inset-0 bg-blue-500/20" />
                )}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-xl backdrop-blur-sm transition-colors"
            >
              <Info className="w-4 h-4" />
              <span className="text-sm">Info</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-xl backdrop-blur-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Compartilhar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Panel */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-16 right-4 bottom-20 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">Mapa do Tour</h3>
            </div>
            <div className="p-4 space-y-3">
              {mockTourPoints.map((point, index) => (
                <button
                  key={point.id}
                  onClick={() => navigateToPoint(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    index === currentPointIndex
                      ? 'bg-blue-500/20 border border-blue-500/50'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === currentPointIndex ? 'bg-blue-500' : 'bg-slate-700'
                  }`}>
                    <span className="text-sm font-bold text-white">{index + 1}</span>
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${index === currentPointIndex ? 'text-blue-400' : 'text-white'}`}>
                      {point.name}
                    </p>
                    <p className="text-xs text-slate-500">{point.hotspots.length} hotspots</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="absolute top-16 left-4 bottom-20 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">Informações</h3>
              <button 
                onClick={() => setShowInfo(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <h4 className="text-lg font-bold text-white mb-2">{currentPoint.name}</h4>
              <p className="text-slate-400 text-sm mb-4">
                Explore este ambiente em 360°. Clique nos hotspots para mais informações 
                ou navegue entre os diferentes cômodos.
              </p>
              
              <h5 className="font-semibold text-white mb-2">Hotspots Disponíveis</h5>
              <div className="space-y-2">
                {currentPoint.hotspots.map(hotspot => (
                  <div key={hotspot.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                      {hotspot.type === 'navigate' && <Navigation className="w-4 h-4 text-blue-400" />}
                      {hotspot.type === 'info' && <Info className="w-4 h-4 text-green-400" />}
                      {hotspot.type === 'media' && <Camera className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div>
                      <p className="text-sm text-white">{hotspot.title}</p>
                      {hotspot.description && (
                        <p className="text-xs text-slate-500">{hotspot.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hotspot Detail Modal */}
      <AnimatePresence>
        {selectedHotspot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
          >
            <div className="aspect-video bg-slate-800 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                {selectedHotspot.type === 'info' && <Info className="w-16 h-16 text-slate-600" />}
                {selectedHotspot.type === 'media' && <Camera className="w-16 h-16 text-slate-600" />}
                {selectedHotspot.type === 'product' && <Eye className="w-16 h-16 text-slate-600" />}
              </div>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{selectedHotspot.title}</h3>
              {selectedHotspot.description && (
                <p className="text-slate-400 mb-4">{selectedHotspot.description}</p>
              )}
              <button
                onClick={() => setSelectedHotspot(null)}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VirtualTour;
