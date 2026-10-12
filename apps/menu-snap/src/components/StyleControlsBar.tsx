import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Camera,
  Sliders,
  ChevronDown,
  Sparkles,
  Award,
  Coffee,
  Maximize2,
  Ratio,
  Flame,
  Focus,
  Layers
} from 'lucide-react';
import {
  StylePreset,
  ImageSize,
  AspectRatio,
  SurfaceOption,
  SteamOption,
  DepthOfField,
  PhotoShootConfig
} from '../types';

interface StyleControlsBarProps {
  config: PhotoShootConfig;
  onChangeConfig: (newConfig: PhotoShootConfig) => void;
  onApplyToAllDishes?: () => void;
}

export const StyleControlsBar: React.FC<StyleControlsBarProps> = ({
  config,
  onChangeConfig,
  onApplyToAllDishes,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const styleOptions: { id: StylePreset; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'Rustic/Dark',
      label: 'Rustic / Dark',
      icon: <Moon className="w-4 h-4 text-amber-400" />,
      desc: 'Moody charcoal slate & reclaimed wood, warm side lighting, artisanal vibe'
    },
    {
      id: 'Bright/Modern',
      label: 'Bright / Modern',
      icon: <Sun className="w-4 h-4 text-amber-300" />,
      desc: 'Italian Carrara marble, bright diffused natural daylight, crisp vibrant colors'
    },
    {
      id: 'Social Media',
      label: 'Social Media (Flatlay)',
      icon: <Camera className="w-4 h-4 text-pink-400" />,
      desc: '90° top-down flatlay, artistic raw ingredient props, Instagram-ready'
    },
    {
      id: 'Fine Dining',
      label: 'Fine Dining',
      icon: <Award className="w-4 h-4 text-yellow-300" />,
      desc: 'Sleek dark velvet, pinpoint spotlighting, gold accents, Michelin star plating'
    },
    {
      id: 'Cozy Cafe',
      label: 'Cozy Cafe',
      icon: <Coffee className="w-4 h-4 text-orange-300" />,
      desc: 'Sun-drenched honey oak wood, warm bokeh, cozy bistro atmosphere'
    }
  ];

  const sizeOptions: { id: ImageSize; label: string; sub: string }[] = [
    { id: '1K', label: '1K Standard', sub: '1024 x 1024' },
    { id: '2K', label: '2K High-Def', sub: '2048 x 2048' },
    { id: '4K', label: '4K Ultra-Print', sub: '3840 x 3840' }
  ];

  const aspectOptions: { id: AspectRatio; label: string; ratio: string }[] = [
    { id: '1:1', label: 'Square 1:1', ratio: 'Instagram / Menu' },
    { id: '4:3', label: 'Standard 4:3', ratio: 'Menu Card' },
    { id: '9:16', label: 'Story 9:16', ratio: 'TikTok / Reel' },
    { id: '16:9', label: 'Banner 16:9', ratio: 'Website Header' }
  ];

  const surfaceOptions: SurfaceOption[] = [
    'Dark Slate',
    'Carrara Marble',
    'Rustic Wood Table',
    'Sleek Stainless',
    'Textured Concrete'
  ];

  const steamOptions: SteamOption[] = [
    'None',
    'Subtle Steam',
    'Hot Steam & Sizzle',
    'Ice & Condensation'
  ];

  const depthOptions: DepthOfField[] = [
    'Cinematic Shallow Macro',
    'Balanced',
    'Deep Sharp Focus'
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-5 shadow-xl my-6">
      <div className="flex flex-col gap-5">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Photography Studio Style & Camera Controls
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select your restaurant's visual aesthetic, resolution size, and lighting configuration.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onApplyToAllDishes && (
              <button
                onClick={onApplyToAllDishes}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply Style to All Dishes
              </button>
            )}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showAdvanced ? 'Hide Camera Tweaks' : 'Fine-Tune Camera'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 1. PRIMARY STYLE TOGGLES */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5">
            Aesthetic Style Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {styleOptions.map((st) => {
              const isActive = config.globalStyle === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => onChangeConfig({ ...config, globalStyle: st.id })}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                      {st.icon}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-300">
                    {st.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-tight">
                    {st.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. RESOLUTION & ASPECT RATIO ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Resolution Affordance (1K, 2K, 4K) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                Image Resolution (Quality)
              </span>
              <span className="text-[10px] text-zinc-500">Gemini Pro Image Model</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sizeOptions.map((s) => {
                const isActive = config.globalSize === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onChangeConfig({ ...config, globalSize: s.id })}
                    className={`py-2 px-3 rounded-xl border text-center transition ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{s.id}</div>
                    <div className="text-[10px] text-zinc-500">{s.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Ratio className="w-3.5 h-3.5 text-amber-400" />
              Framing & Aspect Ratio
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {aspectOptions.map((a) => {
                const isActive = config.globalAspectRatio === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => onChangeConfig({ ...config, globalAspectRatio: a.id })}
                    className={`py-2 px-2.5 rounded-xl border text-center transition ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{a.id}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{a.ratio}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* 3. ADVANCED CAMERA TWEAKS (EXPANDABLE) */}
        {showAdvanced && (
          <div className="pt-4 mt-2 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
            
            {/* Surface Texture */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-zinc-400" />
                Table Surface Texture
              </label>
              <select
                value={config.surface}
                onChange={(e) => onChangeConfig({ ...config, surface: e.target.value as SurfaceOption })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                {surfaceOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Steam / Heat Effect */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                Freshness & Steam
              </label>
              <select
                value={config.steam}
                onChange={(e) => onChangeConfig({ ...config, steam: e.target.value as SteamOption })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                {steamOptions.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Depth of Field */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Focus className="w-3 h-3 text-cyan-400" />
                Lens Focus & Depth
              </label>
              <select
                value={config.depthOfField}
                onChange={(e) => onChangeConfig({ ...config, depthOfField: e.target.value as DepthOfField })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                {depthOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
