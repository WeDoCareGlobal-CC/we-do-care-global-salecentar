import React, { useState } from 'react';
import {
  Camera,
  Download,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderDown,
  Layers,
  LayoutGrid
} from 'lucide-react';
import JSZip from 'jszip';
import { DishItem, PhotoShootConfig, StylePreset, ImageSize } from '../types';
import { DishCard } from './DishCard';

interface PhotoStudioGridProps {
  dishes: DishItem[];
  config: PhotoShootConfig;
  onGeneratePhoto: (dishId: string) => void;
  onGenerateAll: () => void;
  isBatchGenerating: boolean;
  onOpenRetouchModal: (dish: DishItem) => void;
  onOpenZoomModal: (dish: DishItem) => void;
  onChangeDishStyle: (dishId: string, newStyle: StylePreset) => void;
  onChangeDishSize?: (dishId: string, newSize: ImageSize) => void;
  onOpenDigitalMenu: () => void;
}

export const PhotoStudioGrid: React.FC<PhotoStudioGridProps> = ({
  dishes,
  config,
  onGeneratePhoto,
  onGenerateAll,
  isBatchGenerating,
  onOpenRetouchModal,
  onOpenZoomModal,
  onChangeDishStyle,
  onChangeDishSize,
  onOpenDigitalMenu,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isZipping, setIsZipping] = useState(false);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(dishes.map((d) => d.category)))];

  const filteredDishes = selectedCategory === 'All'
    ? dishes
    : dishes.filter((d) => d.category === selectedCategory);

  const shotCount = dishes.filter((d) => !!d.generatedImageUrl).length;

  const handleBatchZipDownload = async () => {
    const readyDishes = dishes.filter((d) => !!d.generatedImageUrl);
    if (readyDishes.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('Food_Photoshoot_Export');

      for (let i = 0; i < readyDishes.length; i++) {
        const dish = readyDishes[i];
        if (!dish.generatedImageUrl) continue;

        let base64Data = '';
        if (dish.generatedImageUrl.startsWith('data:image')) {
          base64Data = dish.generatedImageUrl.split(',')[1];
        } else {
          // If external URL, fetch blob
          const res = await fetch(dish.generatedImageUrl);
          const blob = await res.blob();
          folder?.file(`${dish.name.toLowerCase().replace(/\s+/g, '_')}.png`, blob);
          continue;
        }

        if (base64Data) {
          const filename = `${dish.category.toLowerCase()}_${dish.name.toLowerCase().replace(/\s+/g, '_')}_${dish.selectedStyle || config.globalStyle}.png`;
          folder?.file(filename, base64Data, { base64: true });
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `food_photography_batch_export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Batch Control Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        
        {/* Left Stats */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Menu Food Photography Studio
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {dishes.length} Items
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              {shotCount} of {dishes.length} items photographed • Style: <strong className="text-amber-400">{config.globalStyle}</strong>
            </p>
          </div>
        </div>

        {/* Right Batch Actions */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Photograph All Button */}
          <button
            onClick={onGenerateAll}
            disabled={isBatchGenerating || dishes.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isBatchGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                Shooting All Dishes...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Photograph All ({dishes.length} Items)
              </>
            )}
          </button>

          {/* Batch ZIP Export */}
          {shotCount > 0 && (
            <button
              onClick={handleBatchZipDownload}
              disabled={isZipping}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 font-bold text-xs rounded-xl border border-zinc-700 transition flex items-center gap-1.5"
            >
              {isZipping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FolderDown className="w-4 h-4 text-emerald-400" />
              )}
              Export ZIP ({shotCount})
            </button>
          )}

          {/* View Digital Menu */}
          <button
            onClick={onOpenDigitalMenu}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Digital Menu
          </button>

        </div>

      </div>

      {/* Category Filter Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1 pl-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Dish Cards */}
      {filteredDishes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              config={config}
              onGeneratePhoto={onGeneratePhoto}
              onOpenRetouchModal={onOpenRetouchModal}
              onOpenZoomModal={onOpenZoomModal}
              onChangeDishStyle={onChangeDishStyle}
              onChangeDishSize={onChangeDishSize}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm text-zinc-400 mb-2">No dishes in this category.</p>
          <button
            onClick={() => setSelectedCategory('All')}
            className="text-xs text-amber-400 font-bold hover:underline"
          >
            Show All Dishes
          </button>
        </div>
      )}

    </div>
  );
};
