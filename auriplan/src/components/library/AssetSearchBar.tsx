/**
 * Asset Search Bar Component for AuriPlan
 * Search interface for the asset library
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Filter, History } from 'lucide-react';
import { assetSearchEngine, SearchSuggestion, SearchFilters } from '../../library/AssetSearchEngine';

interface AssetSearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  className?: string;
}

export const AssetSearchBar: React.FC<AssetSearchBarProps> = ({
  onSearch,
  onFilterClick,
  placeholder = 'Search furniture, styles, materials...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length >= 2) {
      const autocomplete = assetSearchEngine.getAutocompleteSuggestions(value);
      setSuggestions(autocomplete);
      setShowSuggestions(true);
      setShowHistory(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Handle search submission
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), {});
      setShowSuggestions(false);
      setShowHistory(false);
    }
  }, [query, onSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.value);
    onSearch(suggestion.value, {});
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onSearch]);

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  // Handle focus - show history
  const handleFocus = useCallback(() => {
    if (query.length === 0) {
      const history = assetSearchEngine.getSearchHistory();
      if (history.length > 0) {
        setShowHistory(true);
      }
    }
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowHistory(false);
    }
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-gray-400" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-2.5 bg-white border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       text-gray-700 placeholder-gray-400"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            
            <button
              type="button"
              onClick={onFilterClick}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </form>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between
                         first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="text-gray-700">{suggestion.display}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 capitalize">{suggestion.type}</span>
                {suggestion.count > 1 && (
                  <span className="text-xs text-gray-400">({suggestion.count})</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Search History */}
      {showHistory && !showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Recent Searches</span>
          </div>
          {assetSearchEngine.getSearchHistory().slice(0, 5).map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(item.query);
                onSearch(item.query, item.filters);
                setShowHistory(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between
                         first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="text-gray-700">{item.query}</span>
              <span className="text-xs text-gray-400">{item.resultCount} results</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetSearchBar;
