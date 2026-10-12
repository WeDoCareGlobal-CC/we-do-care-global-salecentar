import React from 'react';
import { X, Download, Camera, Sparkles, Tag, Layers, Maximize2 } from 'lucide-react';
import { DishItem, PhotoShootConfig } from '../types';
import { buildFoodPhotoPrompt } from '../utils/promptBuilder';

interface ZoomModalProps {
  dish: DishItem | null;
  config: PhotoShootConfig;
  onClose: () => void;
  onReShoot: (dishId: string) => void;
}

export const ZoomModal: React.FC<ZoomModalProps> = ({
  dish,
  config,
  onClose,
  onReShoot,
}) => {
  if (!dish || !dish.generatedImageUrl) return null;

  const style = dish.selectedStyle || config.globalStyle;
  const size = dish.selectedSize || config.globalSize;
  const aspect = dish.selectedAspectRatio || config.globalAspectRatio;
  const fullPrompt = buildFoodPhotoPrompt(dish, config);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = dish.generatedImageUrl!;
    link.download = `${dish.name.toLowerCase().replace(/\s+/g, '_')}_${size}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col md:flex-row gap-6 max-h-[90vh]">
        
        {/* Left Full-Res Photo View */}
        <div className="flex-1 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center relative min-h-[300px] md:min-h-[450px]">
          <img
            src={dish.generatedImageUrl}
            alt={dish.name}
            className="w-full h-full object-contain max-h-[70vh]"
          />
          <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-800 text-xs font-bold text-amber-400">
            {size} • {aspect}
          </div>
        </div>

        {/* Right Info & Actions Sidebar */}
        <div className="w-full md:w-80 flex flex-col justify-between space-y-4 overflow-y-auto">
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-xs font-bold border border-amber-500/30">
                {dish.category}
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-lg font-extrabold text-white mb-1">{dish.name}</h2>
            {dish.price && <p className="text-sm font-bold text-amber-400 mb-2">{dish.price}</p>}
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">{dish.description}</p>

            {/* Photo Shoot Specifications */}
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2 mb-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Photography Parameters
              </span>
              <div className="text-xs text-zinc-300 space-y-1">
                <p><strong className="text-zinc-500">Style Preset:</strong> {style}</p>
                <p><strong className="text-zinc-500">Resolution:</strong> {size}</p>
                <p><strong className="text-zinc-500">Surface:</strong> {config.surface}</p>
                <p><strong className="text-zinc-500">Freshness/Steam:</strong> {config.steam}</p>
              </div>
            </div>

            {/* Prompt View */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Generated Gemini Prompt
              </span>
              <p className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 leading-relaxed max-h-32 overflow-y-auto font-mono">
                {fullPrompt}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <button
              onClick={handleDownload}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download High-Res Image ({size})
            </button>

            <button
              onClick={() => {
                onReShoot(dish.id);
                onClose();
              }}
              className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              Re-Shoot Photo
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
