import React, { useState } from 'react';
import {
  Camera,
  Sparkles,
  RefreshCw,
  Download,
  Edit2,
  Maximize2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Tag,
  Maximize,
  Sliders
} from 'lucide-react';
import { DishItem, PhotoShootConfig, StylePreset, ImageSize, AspectRatio } from '../types';

interface DishCardProps {
  dish: DishItem;
  config: PhotoShootConfig;
  onGeneratePhoto: (dishId: string) => void;
  onOpenRetouchModal: (dish: DishItem) => void;
  onOpenZoomModal: (dish: DishItem) => void;
  onChangeDishStyle: (dishId: string, newStyle: StylePreset) => void;
  onChangeDishSize?: (dishId: string, newSize: ImageSize) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  config,
  onGeneratePhoto,
  onOpenRetouchModal,
  onOpenZoomModal,
  onChangeDishStyle,
  onChangeDishSize,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const activeStyle = dish.selectedStyle || config.globalStyle;
  const activeSize = dish.selectedSize || config.globalSize;
  const activeAspect = dish.selectedAspectRatio || config.globalAspectRatio;

  const styleList: StylePreset[] = ['Rustic/Dark', 'Bright/Modern', 'Social Media', 'Fine Dining', 'Cozy Cafe'];
  const sizeList: ImageSize[] = ['1K', '2K', '4K'];

  const handleDownload = () => {
    if (!dish.generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = dish.generatedImageUrl;
    link.download = `${dish.name.toLowerCase().replace(/\s+/g, '_')}_${activeStyle.toLowerCase().replace(/[^a-z]/g, '')}_${activeSize}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col group">
      
      {/* Photo Stage Area */}
      <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden flex items-center justify-center border-b border-zinc-800">
        
        {/* Case 1: Image Generated */}
        {dish.generatedImageUrl && !dish.isGenerating && (
          <div className="relative w-full h-full group/img cursor-pointer" onClick={() => onOpenZoomModal(dish)}>
            <img
              src={dish.generatedImageUrl}
              alt={dish.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
            />
            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-3 justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> Click to Zoom
              </span>
              <span className="text-[10px] bg-zinc-900/90 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                {activeSize} • {activeAspect}
              </span>
            </div>
          </div>
        )}

        {/* Case 2: Currently Generating - Shutter Animation */}
        {dish.isGenerating && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
            {/* Pulsing aperture ring */}
            <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400 animate-spin" />
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Camera className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <p className="text-xs font-bold text-amber-300 animate-pulse">
              Shooting in {activeStyle} Style...
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
              Rendering {activeSize} food photography with Gemini Pro Image AI
            </p>
          </div>
        )}

        {/* Case 3: Empty State - Ready to Shoot */}
        {!dish.generatedImageUrl && !dish.isGenerating && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-zinc-400 group-hover:text-amber-400 group-hover:border-amber-500/30">
              <Camera className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-zinc-300 mb-1">Photo Shoot Ready</span>
            <span className="text-[11px] text-zinc-500 max-w-[220px]">
              Click button below to capture studio-grade photography for this dish.
            </span>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Category Badge */}
          <span className="px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[11px] font-bold text-amber-400">
            {dish.category}
          </span>

          {/* Active Style Badge */}
          <div className="relative pointer-events-auto">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 hover:border-amber-500/50 text-[11px] font-semibold text-zinc-200 transition flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {activeStyle}
            </button>

            {/* Style Selector Popup */}
            {showStyleMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-30">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1">
                  Change Dish Style:
                </div>
                {styleList.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onChangeDishStyle(dish.id, st);
                      setShowStyleMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition ${
                      activeStyle === st
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Error Notice if any */}
        {dish.generationError && (
          <div className="absolute bottom-2 left-2 right-2 p-2 bg-red-950/90 border border-red-500/50 rounded-lg text-[11px] text-red-200 flex items-center gap-1.5 backdrop-blur-md">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
            <span className="truncate">{dish.generationError}</span>
          </div>
        )}

      </div>

      {/* Dish Information Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Price */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              {dish.name}
            </h3>
            {dish.price && (
              <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex-shrink-0">
                {dish.price}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
            {dish.description}
          </p>

          {/* Ingredients Pills */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {dish.ingredients.slice(0, 4).map((ing, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400"
                >
                  {ing}
                </span>
              ))}
              {dish.ingredients.length > 4 && (
                <span className="text-[10px] text-zinc-500 self-center">
                  +{dish.ingredients.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-2 mt-2">
          
          {/* Main Action Button */}
          {!dish.generatedImageUrl ? (
            <button
              onClick={() => onGeneratePhoto(dish.id)}
              disabled={dish.isGenerating}
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Photograph Dish ({activeSize})
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onGeneratePhoto(dish.id)}
                disabled={dish.isGenerating}
                className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-lg transition border border-zinc-700 flex items-center justify-center gap-1.5"
                title="Re-shoot photo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dish.isGenerating ? 'animate-spin text-amber-400' : ''}`} />
                Re-Shoot
              </button>

              <button
                onClick={() => onOpenRetouchModal(dish)}
                className="py-1.5 px-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30 transition flex items-center gap-1"
                title="AI Touch-Up / Edit photo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Retouch
              </button>

              <button
                onClick={handleDownload}
                className="py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs rounded-lg border border-zinc-700 transition flex items-center justify-center"
                title="Download High-Res Photo"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
