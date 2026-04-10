// ============================================
// PROJECT MANAGER - Gerenciador de Projetos
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEditorStore } from '@store/editorStore';
import { 
  X, 
  FolderOpen, 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  Users, 
  Star,
  Trash2,
  Edit3,
  Copy,
  Download,
  Share2,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';

interface ProjectManagerProps {
  onClose: () => void;
}

interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  updatedAt: string;
  scenes: number;
  isFavorite?: boolean;
  isShared?: boolean;
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Casa Moderna - São Paulo',
    description: 'Projeto residencial com 3 quartos e 2 suítes',
    updatedAt: '2024-01-15T10:30:00Z',
    scenes: 2,
    isFavorite: true,
  },
  {
    id: '2',
    name: 'Apartamento Centro',
    description: 'Apartamento de 2 quartos no centro da cidade',
    updatedAt: '2024-01-14T16:45:00Z',
    scenes: 1,
  },
  {
    id: '3',
    name: 'Escritório Comercial',
    description: 'Escritório com 5 salas e área de convivência',
    updatedAt: '2024-01-13T09:20:00Z',
    scenes: 1,
    isShared: true,
  },
  {
    id: '4',
    name: 'Casa de Praia',
    description: 'Casa de veraneio com vista para o mar',
    updatedAt: '2024-01-10T14:15:00Z',
    scenes: 3,
    isFavorite: true,
  },
  {
    id: '5',
    name: 'Consultório Médico',
    description: 'Consultório com sala de espera e 3 consultórios',
    updatedAt: '2024-01-08T11:00:00Z',
    scenes: 1,
  },
];

export function ProjectManager({ onClose }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'shared'>('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const { createProject } = useEditorStore();

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'favorites') return matchesSearch && project.isFavorite;
    if (filter === 'shared') return matchesSearch && project.isShared;
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(
        newProjectName.trim(),
        { id: 'user-1', email: 'user@example.com', name: 'Usuário', role: 'owner' }
      );
      setNewProjectName('');
      setShowNewProject(false);
      onClose();
    }
  };

  const toggleFavorite = (id: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Meus Projetos</h2>
              <p className="text-xs text-slate-400">{projects.length} projetos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'favorites', label: 'Favoritos' },
              { id: 'shared', label: 'Compartilhados' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === f.id
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* New Project Button */}
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {showNewProject ? (
            <div className="max-w-md mx-auto p-6 bg-slate-800 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Criar Novo Projeto</h3>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Nome do projeto"
                className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') setShowNewProject(false);
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateProject}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  Criar Projeto
                </button>
                <button
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum projeto encontrado</h3>
              <p className="text-slate-500">Crie um novo projeto para começar</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-slate-700 flex items-center justify-center relative">
                    <FolderOpen className="w-12 h-12 text-slate-500" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(project.id);
                        }}
                        className={`p-1.5 rounded-lg ${project.isFavorite ? 'text-yellow-500' : 'text-slate-400 hover:text-white'}`}
                      >
                        <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h4 className="font-medium text-white mb-1 line-clamp-1">{project.name}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1 mb-3">{project.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updatedAt)}
                      </span>
                      <span>{project.scenes} andar(es)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-8 h-8 text-slate-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{project.name}</h4>
                      {project.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      {project.isShared && <Users className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{project.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(project.updatedAt)}
                    </span>
                    <span>{project.scenes} andar(es)</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
