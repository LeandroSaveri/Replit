/**
 * AICommandInput - Componente de Entrada de Comando de IA
 * Interface para o usuário digitar comandos em linguagem natural
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Sparkles, Loader2, Mic, History, X, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiOrchestrator, AIProcessResult } from '@/ai';
import { cn } from '@/utils/cn';

interface AICommandInputProps {
  onExecute?: (result: AIProcessResult) => void;
  onPreview?: (result: AIProcessResult) => void;
  className?: string;
  position?: 'top' | 'sidebar';
  placeholder?: string;
  showSuggestions?: boolean;
}

interface Suggestion {
  id: string;
  text: string;
  icon?: React.ReactNode;
}

interface CommandHistory {
  id: string;
  command: string;
  timestamp: number;
  success: boolean;
}

export const AICommandInput: React.FC<AICommandInputProps> = ({
  onExecute,
  onPreview,
  className,
  position = 'top',
  placeholder,
  showSuggestions = true,
}) => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<AIProcessResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carregar sugestões iniciais
  useEffect(() => {
    loadSuggestions();
  }, []);

  // Carregar histórico do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('auriaplan-ai-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        // Ignorar erro de parse
      }
    }
  }, []);

  // Salvar histórico
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('auriaplan-ai-history', JSON.stringify(history.slice(0, 20)));
    }
  }, [history]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSuggestions = async () => {
    try {
      const suggestionTexts = await aiOrchestrator.getSuggestions();
      const suggestionItems: Suggestion[] = suggestionTexts.map((text, index) => ({
        id: `sugg-${index}`,
        text,
        icon: <Sparkles className="w-4 h-4" />,
      }));
      setSuggestions(suggestionItems);
    } catch {
      // Usar sugestões padrão
      setSuggestions([
        { id: '1', text: 'criar uma casa com 2 quartos e sala', icon: <Sparkles className="w-4 h-4" /> },
        { id: '2', text: 'adicionar cozinha de 12 metros', icon: <Sparkles className="w-4 h-4" /> },
        { id: '3', text: 'colocar sofá na sala', icon: <Sparkles className="w-4 h-4" /> },
        { id: '4', text: 'criar quarto principal com banheiro', icon: <Sparkles className="w-4 h-4" /> },
      ]);
    }
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setPreviewResult(null);

    try {
      const result = await aiOrchestrator.processCommand(command.trim());

      // Adicionar ao histórico
      const historyItem: CommandHistory = {
        id: Date.now().toString(),
        command: command.trim(),
        timestamp: Date.now(),
        success: result.success,
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 20));

      if (result.success) {
        onExecute?.(result);
        setCommand('');
      } else {
        setError(result.error || 'Failed to process command');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [command, isProcessing, onExecute]);

  const handlePreview = useCallback(async () => {
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await aiOrchestrator.previewCommand(command.trim());
      setPreviewResult(result);

      if (result.success) {
        onPreview?.(result);
      } else {
        setError(result.error || 'Failed to preview command');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [command, isProcessing, onPreview]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setCommand(suggestion.text);
    inputRef.current?.focus();
  };

  const handleHistoryClick = (item: CommandHistory) => {
    setCommand(item.command);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('auriaplan-ai-history');
    setShowHistory(false);
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return 'Descreva o que você quer criar... (ex: "criar uma casa com 2 quartos")';
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative z-50',
        position === 'top' && 'w-full max-w-2xl mx-auto',
        position === 'sidebar' && 'w-full',
        className
      )}
    >
      {/* Container principal */}
      <div
        className={cn(
          'relative bg-white dark:bg-gray-900 rounded-xl shadow-lg border transition-all duration-200',
          isFocused
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-gray-200 dark:border-gray-700',
          error && 'border-red-500 ring-2 ring-red-500/20'
        )}
      >
        {/* Header com ícone */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Assistente IA
          </span>
          {isProcessing && (
            <span className="text-xs text-blue-500 animate-pulse">
              Processando...
            </span>
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowHistory(false);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={getPlaceholder()}
            disabled={isProcessing}
            className={cn(
              'w-full px-4 py-3 pr-24 bg-transparent text-gray-900 dark:text-white placeholder-gray-400',
              'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />

          {/* Botões de ação */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Botão de histórico */}
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Histórico"
              >
                <History className="w-4 h-4" />
              </button>
            )}

            {/* Botão de preview */}
            <button
              type="button"
              onClick={handlePreview}
              disabled={!command.trim() || isProcessing}
              className="p-2 text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Preview"
            >
              <Check className="w-4 h-4" />
            </button>

            {/* Botão de enviar */}
            <button
              type="submit"
              disabled={!command.trim() || isProcessing}
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
                command.trim() && !isProcessing
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
              title="Executar"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Mensagem de erro */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800"
            >
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview info */}
        <AnimatePresence>
          {previewResult?.success && previewResult.floorPlan && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800"
            >
              <div className="flex items-center gap-4 text-blue-600 dark:text-blue-400 text-sm">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Preview pronto
                </span>
                <span className="text-blue-400">
                  {previewResult.floorPlan.rooms?.length || 0} cômodos
                </span>
                <span className="text-blue-400">
                  {previewResult.floorPlan.furniture?.length || 0} móveis
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown de sugestões */}
      <AnimatePresence>
        {isFocused && showSuggestions && suggestions.length > 0 && !command && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              Sugestões
            </div>
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-blue-500">{suggestion.icon}</span>
                  <span className="capitalize">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown de histórico */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Histórico
              </span>
              <button
                onClick={clearHistory}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Limpar
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {item.command}
                  </span>
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      item.success ? 'bg-green-500' : 'bg-red-500'
                    )}
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AICommandInput;
