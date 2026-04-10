// ============================================
// SHARE SYSTEM - Sistema de Compartilhamento
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, 
  Link, 
  Copy, 
  Check, 
  Mail, 
  MessageCircle, 
  Facebook, 
  Twitter, 
  Linkedin,
  Lock,
  Globe,
  Users,
  Clock,
  Eye,
  Edit3,
  Download,
  QrCode,
  X,
  Send,
  Settings,
  Shield,
  History,
  Trash2,
  Plus,
  DollarSign
} from 'lucide-react';
import { useEditorStore } from '@store/editorStore';

// ============================================
// TYPES
// ============================================
export interface ShareLink {
  id: string;
  url: string;
  type: 'view' | 'edit' | 'comment';
  expiresAt: Date | null;
  password: string | null;
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date | null;
}

export interface ShareCollaborator {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: Date;
  lastActive: Date;
}

export interface ShareSettings {
  allowDownload: boolean;
  allowComments: boolean;
  allowExport: boolean;
  showDimensions: boolean;
  showPrices: boolean;
  watermarkEnabled: boolean;
  watermarkText: string;
}

// ============================================
// MOCK DATA
// ============================================
const mockCollaborators: ShareCollaborator[] = [
  {
    id: 'col-1',
    email: 'joao@email.com',
    name: 'João Silva',
    avatar: null,
    role: 'editor',
    status: 'active',
    joinedAt: new Date('2024-01-15'),
    lastActive: new Date(),
  },
  {
    id: 'col-2',
    email: 'maria@email.com',
    name: 'Maria Santos',
    avatar: null,
    role: 'viewer',
    status: 'active',
    joinedAt: new Date('2024-01-20'),
    lastActive: new Date(Date.now() - 86400000),
  },
  {
    id: 'col-3',
    email: 'pedro@email.com',
    name: 'Pedro Costa',
    avatar: null,
    role: 'commenter',
    status: 'pending',
    joinedAt: new Date(),
    lastActive: undefined as any,
  },
];

const mockLinks: ShareLink[] = [
  {
    id: 'link-1',
    url: 'https://auriplan.com/s/abc123',
    type: 'view',
    expiresAt: null,
    password: null,
    createdAt: new Date('2024-01-10'),
    accessCount: 45,
    lastAccessed: new Date(Date.now() - 3600000),
  },
  {
    id: 'link-2',
    url: 'https://auriplan.com/s/def456',
    type: 'edit',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    password: 'projeto2024',
    createdAt: new Date(),
    accessCount: 3,
    lastAccessed: new Date(),
  },
];

// ============================================
// COMPONENT
// ============================================
interface ShareSystemProps {
  onClose: () => void;
}

export function ShareSystem({ onClose }: ShareSystemProps) {
  const { project } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'people' | 'links' | 'settings'>('people');
  const [collaborators, setCollaborators] = useState<ShareCollaborator[]>(mockCollaborators);
  const [links, setLinks] = useState<ShareLink[]>(mockLinks);
  const [settings, setSettings] = useState<ShareSettings>({
    allowDownload: true,
    allowComments: true,
    allowExport: false,
    showDimensions: true,
    showPrices: false,
    watermarkEnabled: true,
    watermarkText: 'AuriPlan Preview',
  });

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<ShareCollaborator['role']>('viewer');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, linkId?: string) => {
    navigator.clipboard.writeText(text);
    if (linkId) {
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const addCollaborator = () => {
    if (!newEmail) return;
    
    const newCollaborator: ShareCollaborator = {
      id: `col-${Date.now()}`,
      email: newEmail,
      name: newEmail.split('@')[0],
      avatar: null,
      role: newRole,
      status: 'pending',
      joinedAt: new Date(),
      lastActive: undefined as any,
    };
    
    setCollaborators([...collaborators, newCollaborator]);
    setNewEmail('');
  };

  const removeCollaborator = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
  };

  const updateCollaboratorRole = (id: string, role: ShareCollaborator['role']) => {
    setCollaborators(collaborators.map(c => 
      c.id === id ? { ...c, role } : c
    ));
  };

  const createLink = (type: ShareLink['type']) => {
    const newLink: ShareLink = {
      id: `link-${Date.now()}`,
      url: `https://auriplan.com/s/${Math.random().toString(36).substring(2, 8)}`,
      type,
      expiresAt: null,
      password: null,
      createdAt: new Date(),
      accessCount: 0,
      lastAccessed: null,
    };
    setLinks([...links, newLink]);
  };

  const deleteLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const getRoleIcon = (role: ShareCollaborator['role']) => {
    switch (role) {
      case 'owner': return <Lock className="w-4 h-4 text-yellow-400" />;
      case 'editor': return <Edit3 className="w-4 h-4 text-blue-400" />;
      case 'viewer': return <Eye className="w-4 h-4 text-green-400" />;
      case 'commenter': return <MessageCircle className="w-4 h-4 text-purple-400" />;
    }
  };

  const getRoleLabel = (role: ShareCollaborator['role']) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'editor': return 'Editor';
      case 'viewer': return 'Visualizador';
      case 'commenter': return 'Comentarista';
    }
  };

  const getRoleDescription = (role: ShareCollaborator['role']) => {
    switch (role) {
      case 'owner': return 'Controle total do projeto';
      case 'editor': return 'Pode editar e adicionar conteúdo';
      case 'viewer': return 'Apenas visualização';
      case 'commenter': return 'Pode visualizar e comentar';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl h-[80vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Compartilhar</h2>
              <p className="text-sm text-slate-400">{project?.name || 'Projeto'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {[
            { id: 'people', label: 'Pessoas', icon: Users },
            { id: 'links', label: 'Links', icon: Link },
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* People Tab */}
            {activeTab === 'people' && (
              <motion.div
                key="people"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col"
              >
                {/* Add Collaborator */}
                <div className="p-6 border-b border-slate-800">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Email do colaborador"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="viewer">Visualizador</option>
                      <option value="commenter">Comentarista</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button
                      onClick={addCollaborator}
                      disabled={!newEmail}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Collaborators List */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {collaborators.map(collaborator => (
                      <div
                        key={collaborator.id}
                        className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {collaborator.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{collaborator.name}</p>
                            {collaborator.status === 'pending' && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                Pendente
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">{collaborator.email}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={collaborator.role}
                            onChange={(e) => updateCollaboratorRole(collaborator.id, e.target.value as any)}
                            disabled={collaborator.role === 'owner'}
                            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="viewer">Visualizador</option>
                            <option value="commenter">Comentarista</option>
                            <option value="editor">Editor</option>
                            <option value="owner">Proprietário</option>
                          </select>
                          
                          {collaborator.role !== 'owner' && (
                            <button
                              onClick={() => removeCollaborator(collaborator.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role Info */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">Permissões</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(['owner', 'editor', 'viewer', 'commenter'] as const).map(role => (
                      <div key={role} className="flex items-start gap-2">
                        {getRoleIcon(role)}
                        <div>
                          <p className="text-sm text-white font-medium">{getRoleLabel(role)}</p>
                          <p className="text-xs text-slate-500">{getRoleDescription(role)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Links Tab */}
            {activeTab === 'links' && (
              <motion.div
                key="links"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col"
              >
                {/* Create Links */}
                <div className="p-6 border-b border-slate-800">
                  <p className="text-sm text-slate-400 mb-4">Criar novo link de compartilhamento</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => createLink('view')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Apenas Visualizar
                    </button>
                    <button
                      onClick={() => createLink('edit')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Permitir Edição
                    </button>
                    <button
                      onClick={() => createLink('comment')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Comentários
                    </button>
                  </div>
                </div>

                {/* Links List */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {links.map(link => (
                      <div
                        key={link.id}
                        className="p-4 bg-slate-800 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {link.type === 'view' && <Eye className="w-4 h-4 text-green-400" />}
                            {link.type === 'edit' && <Edit3 className="w-4 h-4 text-blue-400" />}
                            {link.type === 'comment' && <MessageCircle className="w-4 h-4 text-purple-400" />}
                            <span className="text-sm font-medium text-white capitalize">
                              {link.type === 'view' && 'Visualização'}
                              {link.type === 'edit' && 'Edição'}
                              {link.type === 'comment' && 'Comentários'}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteLink(link.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <input
                            type="text"
                            value={link.url}
                            readOnly
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-400"
                          />
                          <button
                            onClick={() => copyToClipboard(link.url, link.id)}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            title="Copiar link"
                          >
                            {copiedLink === link.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setShowQRCode(link.id)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            title="Ver QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {link.accessCount} acessos
                          </span>
                          {link.lastAccessed && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Último: {link.lastAccessed.toLocaleDateString()}
                            </span>
                          )}
                          {link.expiresAt && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <Clock className="w-3 h-3" />
                              Expira: {link.expiresAt.toLocaleDateString()}
                            </span>
                          )}
                          {link.password && (
                            <span className="flex items-center gap-1 text-orange-400">
                              <Lock className="w-3 h-3" />
                              Com senha
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full overflow-y-auto p-6"
              >
                <div className="space-y-6">
                  {/* General Settings */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      Geral
                    </h4>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-white">Permitir download</p>
                            <p className="text-sm text-slate-500">Usuários podem baixar o projeto</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.allowDownload}
                          onChange={(e) => setSettings({ ...settings, allowDownload: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-white">Permitir comentários</p>
                            <p className="text-sm text-slate-500">Usuários podem adicionar comentários</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.allowComments}
                          onChange={(e) => setSettings({ ...settings, allowComments: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Share2 className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-white">Permitir exportação</p>
                            <p className="text-sm text-slate-500">Usuários podem exportar em outros formatos</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.allowExport}
                          onChange={(e) => setSettings({ ...settings, allowExport: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Display Settings */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      Exibição
                    </h4>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Eye className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-white">Mostrar dimensões</p>
                            <p className="text-sm text-slate-500">Exibir medidas no projeto</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.showDimensions}
                          onChange={(e) => setSettings({ ...settings, showDimensions: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-white">Mostrar preços</p>
                            <p className="text-sm text-slate-500">Exibir valores dos itens</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.showPrices}
                          onChange={(e) => setSettings({ ...settings, showPrices: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Watermark Settings */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      Marca d'água
                    </h4>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="text-white">Habilitar marca d'água</p>
                            <p className="text-sm text-slate-500">Adicionar marca em visualizações</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.watermarkEnabled}
                          onChange={(e) => setSettings({ ...settings, watermarkEnabled: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                        />
                      </label>

                      {settings.watermarkEnabled && (
                        <div className="p-4 bg-slate-800 rounded-xl">
                          <label className="block text-sm text-slate-400 mb-2">Texto da marca d'água</label>
                          <input
                            type="text"
                            value={settings.watermarkText}
                            onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => copyToClipboard(window.location.href)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copiar URL
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Mail className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Twitter className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Facebook className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Linkedin className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowQRCode(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl border border-slate-700 p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-64 h-64 bg-white rounded-xl flex items-center justify-center mb-6">
                <QrCode className="w-48 h-48 text-slate-900" />
              </div>
              <p className="text-white font-medium mb-2">Escaneie para acessar</p>
              <p className="text-sm text-slate-400 mb-6">
                {links.find(l => l.id === showQRCode)?.url}
              </p>
              <button
                onClick={() => setShowQRCode(null)}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ShareSystem;
