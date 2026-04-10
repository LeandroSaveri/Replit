/**
 * Asset Library Panel Component for AuriPlan
 * Main panel for browsing and selecting assets
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Grid, List, ChevronLeft, ChevronRight, Star, Loader2 } from 'lucide-react';
import { AssetMetadata, AssetCategory } from '../../library/AssetRegistry';
import { assetCategoryManager } from '../../library/AssetCategoryManager';
import { assetSearchEngine, SearchFilters, SearchResult } from '../../library/AssetSearchEngine';
import { AssetSearchBar } from './AssetSearchBar';
import { AssetCategorySidebar } from './AssetCategorySidebar';

interface AssetLibraryPanelProps {
  onAssetSelect: (asset: AssetMetadata) => void;
  onAssetDragStart?: (asset: AssetMetadata) => void;
  selectedCategory?: AssetCategory;
  className?: string;
}

export const AssetLibraryPanel: React.FC<AssetLibraryPanelProps> = ({
  onAssetSelect,
  onAssetDragStart,
  selectedCategory,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<AssetCategory | null>(selectedCategory || null);
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const itemsPerPage = 20;

  // Handle search
  const handleSearch = useCallback((query: string, filters: SearchFilters) => {
    setIsLoading(true);
    setPage(0);
    
    const result = assetSearchEngine.search(query, filters, {
      limit: itemsPerPage,
      offset: 0,
      sortBy: 'popularity',
    });
    
    setSearchResult(result);
    setIsLoading(false);
  }, []);

  // Handle category select
  const handleCategorySelect = useCallback((category: AssetCategory | null) => {
    setActiveCategory(category);
    setPage(0);
    
    const filters: SearchFilters = category ? { categories: [category] } : {};
    setActiveFilters(filters);
    
    const result = assetSearchEngine.search('', filters, {
      limit: itemsPerPage,
      offset: 0,
    });
    
    setSearchResult(result);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setActiveFilters(newFilters);
    setPage(0);
    
    const result = assetSearchEngine.search('', newFilters, {
      limit: itemsPerPage,
      offset: 0,
    });
    
    setSearchResult(result);
  }, []);

  // Load more items
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    
    const result = assetSearchEngine.search('', activeFilters, {
      limit: itemsPerPage,
      offset: nextPage * itemsPerPage,
    });
    
    if (searchResult) {
      setSearchResult({
        ...result,
        assets: [...searchResult.assets, ...result.assets],
      });
    }
  }, [page, activeFilters, searchResult]);

  // Initial load
  useEffect(() => {
    handleCategorySelect(selectedCategory || null);
  }, [selectedCategory, handleCategorySelect]);

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Category Sidebar */}
      <AssetCategorySidebar
        activeCategory={activeCategory}
        onCategorySelect={handleCategorySelect}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <AssetSearchBar
              onSearch={handleSearch}
              className="flex-1"
            />
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results Count */}
          {searchResult && (
            <div className="mt-2 text-sm text-gray-500">
              {searchResult.totalCount} items found
            </div>
          )}
        </div>

        {/* Asset Grid/List */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : searchResult?.assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg">No items found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResult?.assets.map(asset => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onSelect={() => onAssetSelect(asset)}
                      onDragStart={() => onAssetDragStart?.(asset)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResult?.assets.map(asset => (
                    <AssetListItem
                      key={asset.id}
                      asset={asset}
                      onSelect={() => onAssetSelect(asset)}
                      onDragStart={() => onAssetDragStart?.(asset)}
                    />
                  ))}
                </div>
              )}

              {/* Load More */}
              {searchResult && searchResult.assets.length < searchResult.totalCount && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Asset Card Component
interface AssetCardProps {
  asset: AssetMetadata;
  onSelect: () => void;
  onDragStart?: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onSelect, onDragStart }) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className="group bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer
                 hover:shadow-lg hover:border-blue-300 transition-all"
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <img
          src={asset.thumbnailUrl}
          alt={asset.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        {asset.isPremium && (
          <div className="absolute top-2 right-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-800 truncate">{asset.name}</h3>
        <p className="text-sm text-gray-500 capitalize">{asset.category}</p>
        {asset.price && (
          <p className="text-sm font-medium text-blue-600 mt-1">
            ${asset.price.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
};

// Asset List Item Component
interface AssetListItemProps {
  asset: AssetMetadata;
  onSelect: () => void;
  onDragStart?: () => void;
}

const AssetListItem: React.FC<AssetListItemProps> = ({ asset, onSelect, onDragStart }) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer
                 hover:shadow-md hover:border-blue-300 transition-all"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
        <img
          src={asset.thumbnailUrl}
          alt={asset.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-800 truncate">{asset.name}</h3>
        <p className="text-sm text-gray-500 capitalize">{asset.category}</p>
        <div className="flex items-center gap-2 mt-1">
          {asset.materials.slice(0, 3).map(m => (
            <span key={m} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Price */}
      {asset.price && (
        <div className="text-right">
          <p className="font-medium text-blue-600">${asset.price.toFixed(2)}</p>
        </div>
      )}

      {/* Premium Badge */}
      {asset.isPremium && (
        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
      )}
    </div>
  );
};

export default AssetLibraryPanel;
