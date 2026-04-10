/**
 * Asset Category Sidebar Component for AuriPlan
 * Sidebar for browsing asset categories
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Star, Home, Sofa, Bed, ChefHat, Bath, Lightbulb, Palette, Refrigerator, Trees, DoorOpen, Square, Grid3X3, Paintbrush, Building2, Briefcase } from 'lucide-react';
import { AssetCategory } from '../../library/AssetRegistry';
import { assetCategoryManager, CategoryInfo } from '../../library/AssetCategoryManager';

interface AssetCategorySidebarProps {
  activeCategory: AssetCategory | null;
  onCategorySelect: (category: AssetCategory | null) => void;
  className?: string;
}

const categoryIcons: Record<AssetCategory, React.FC<{ className?: string }>> = {
  furniture: Sofa,
  livingroom: Home,
  bedroom: Bed,
  dining: Briefcase,
  office: Briefcase,
  kitchen: ChefHat,
  bathroom: Bath,
  lighting: Lightbulb,
  decor: Palette,
  appliances: Refrigerator,
  outdoor: Trees,
  doors: DoorOpen,
  windows: Square,
  flooring: Grid3X3,
  'wall-materials': Paintbrush,
  structural: Building2,
  plumbing: Bath,
  electrical: Lightbulb,
  garden: Trees,
  kids: Home,
  'decor-items': Palette,
};

export const AssetCategorySidebar: React.FC<AssetCategorySidebarProps> = ({
  activeCategory,
  onCategorySelect,
  className = '',
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<AssetCategory>>(new Set());
  const categoryTree = assetCategoryManager.getCategoryTree();

  const toggleCategory = (categoryId: AssetCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className={`w-64 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">Categories</h2>
      </div>

      {/* All Items */}
      <button
        onClick={() => onCategorySelect(null)}
        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                   ${activeCategory === null ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
      >
        <Grid3X3 className="w-5 h-5" />
        <span className="flex-1">All Items</span>
        <span className="text-sm text-gray-400">
          {assetCategoryManager.getAllCategories().reduce((sum, cat) => sum + cat.count, 0)}
        </span>
      </button>

      {/* Category Tree */}
      <div className="flex-1 overflow-auto py-2">
        {categoryTree.map(category => (
          <CategoryItem
            key={category.id}
            category={category}
            activeCategory={activeCategory}
            expandedCategories={expandedCategories}
            onToggle={toggleCategory}
            onSelect={onCategorySelect}
            depth={0}
          />
        ))}
      </div>

      {/* Featured Section */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Featured</h3>
        <div className="space-y-1">
          {assetCategoryManager.getFeaturedCategories().slice(0, 4).map(cat => {
            const Icon = categoryIcons[cat.id];
            return (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 rounded-md transition-colors
                           ${activeCategory === cat.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{cat.name}</span>
                {cat.count > 0 && (
                  <span className="text-xs text-gray-400 ml-auto">{cat.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Category Item Component
interface CategoryItemProps {
  category: CategoryInfo & { children: (CategoryInfo | AssetCategory)[] };
  activeCategory: AssetCategory | null;
  expandedCategories: Set<AssetCategory>;
  onToggle: (id: AssetCategory) => void;
  onSelect: (id: AssetCategory | null) => void;
  depth: number;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  activeCategory,
  expandedCategories,
  onToggle,
  onSelect,
  depth,
}) => {
  const Icon = categoryIcons[category.id];
  const isExpanded = expandedCategories.has(category.id);
  const isActive = activeCategory === category.id;
  const hasChildren = category.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            onToggle(category.id);
          }
          onSelect(category.id);
        }}
        className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors
                   ${isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )
        ) : (
          <span className="w-4" />
        )}
        
        <Icon className="w-4 h-4" />
        
        <span className="flex-1 text-sm">{category.name}</span>
        
        {category.count > 0 && (
          <span className="text-xs text-gray-400">{category.count}</span>
        )}
        
        {category.featured && (
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
        )}
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {category.children.map(child => {
            const childInfo: CategoryInfo & { children: (CategoryInfo | AssetCategory)[] } = 
              typeof child === 'string'
                ? { id: child as AssetCategory, name: child as string, description: '', count: 0, featured: false, icon: child as string, children: [] } as CategoryInfo & { children: (CategoryInfo | AssetCategory)[] }
                : { ...(child as CategoryInfo), children: [] };
            return (
            <CategoryItem
              key={childInfo.id}
              category={childInfo}
              activeCategory={activeCategory}
              expandedCategories={expandedCategories}
              onToggle={onToggle}
              onSelect={onSelect}
              depth={depth + 1}
            />
          );})}
        </div>
      )}
    </div>
  );
};

export default AssetCategorySidebar;
