import React from 'react';
import { Camera, Sparkles, Layers, Sliders, Info, Image as ImageIcon } from 'lucide-react';
import { StylePreset, ImageSize } from '../types';

interface HeaderProps {
  restaurantName: string;
  cuisine: string;
  globalStyle: StylePreset;
  globalSize: ImageSize;
  totalDishes: number;
  photographedCount: number;
  onOpenSampleModal: () => void;
  onSelectTab: (tab: 'studio' | 'digital-menu') => void;
  activeTab: 'studio' | 'digital-menu';
}

export const Header: React.FC<HeaderProps> = ({
  restaurantName,
  cuisine,
  globalStyle,
  globalSize,
  totalDishes,
  photographedCount,
  onOpenSampleModal,
  onSelectTab,
  activeTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 font-bold shadow-lg shadow-amber-500/10">
              <Camera className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                  Virtual Food Photographer
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full">
                  AI Studio
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {restaurantName ? `${restaurantName} • ${cuisine}` : 'Turn text menus into studio-grade food photography'}
              </p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Active Style Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300">
              <span className="text-zinc-500">Style:</span>
              <span className="text-amber-400 font-semibold">{globalStyle}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-500">Res:</span>
              <span className="text-emerald-400 font-semibold">{globalSize}</span>
            </div>

            {/* Photoshoot Progress */}
            {totalDishes > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${(photographedCount / totalDishes) * 100}%` }}
                  />
                </div>
                <span>
                  <strong className="text-white">{photographedCount}</strong>/{totalDishes} shot
                </span>
              </div>
            )}

            {/* View Tab Buttons */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => onSelectTab('studio')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'studio'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Photo Studio
              </button>
              <button
                onClick={() => onSelectTab('digital-menu')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'digital-menu'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Digital Menu
              </button>
            </div>

            {/* Load Sample Button */}
            <button
              onClick={onOpenSampleModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sample Menus
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
