import { ownerHeaders } from '../utils/ownerAuth';
import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Plus,
  Trash2,
  UtensilsCrossed,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3
} from 'lucide-react';
import { MenuData, DishItem } from '../types';
import { SAMPLE_MENUS } from '../data/sampleMenus';

interface MenuInputSectionProps {
  currentMenu: MenuData;
  onUpdateMenu: (menu: MenuData) => void;
  onParseComplete?: () => void;
}

export const MenuInputSection: React.FC<MenuInputSectionProps> = ({
  currentMenu,
  onUpdateMenu,
  onParseComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'preset' | 'manual'>('preset');
  const [rawText, setRawText] = useState<string>(
    'Burrata Crostini $18 - Fresh burrata, charred sourdough, heirloom cherry tomatoes, basil pesto, balsamic reduction.\n\nHand-Rolled Truffle Tagliolini $32 - Egg tagliolini, Normandy cultured butter, Parmigiano-Reggiano, freshly shaved black summer truffle.\n\nDry-Aged Bistecca alla Fiorentina $68 - T-Bone steak grilled over oak charcoal, Maldon sea salt flakes, rosemary olive oil.\n\nEspresso Tiramisu $14 - ladyfingers soaked in dark espresso & dark rum, mascarpone cream, cocoa powder.'
  );
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual new dish form state
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('Mains');
  const [manualDesc, setManualDesc] = useState('');
  const [manualIngredients, setManualIngredients] = useState('');
  const [manualPlating, setManualPlating] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  const handleParseRawText = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/parse-menu', {
        headers: { 'Content-Type': 'application/json', ...ownerHeaders() },
method: 'POST',
        body: JSON.stringify({ menuText: rawText })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to parse menu text');
      }

      const data = await res.json();
      if (data.dishes && data.dishes.length > 0) {
        onUpdateMenu({
          restaurantName: data.restaurantName || currentMenu.restaurantName || 'Custom Restaurant',
          cuisine: data.cuisine || currentMenu.cuisine || 'Gourmet Cuisine',
          description: data.description || 'Custom parsed menu',
          dishes: data.dishes
        });
        if (onParseComplete) onParseComplete();
      } else {
        throw new Error('No dishes detected from text. Try pasting a clearer menu format.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error parsing menu text');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSelectSample = (sample: MenuData) => {
    onUpdateMenu(sample);
    if (onParseComplete) onParseComplete();
  };

  const handleAddManualDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newDish: DishItem = {
      id: `manual-${Date.now()}`,
      name: manualName.trim(),
      category: manualCategory,
      description: manualDesc.trim() || 'Signature gourmet preparation.',
      ingredients: manualIngredients.split(',').map((s) => s.trim()).filter(Boolean),
      platingNotes: manualPlating.trim() || 'Plated elegantly on modern restaurant dinnerware.',
      price: manualPrice.trim() ? (manualPrice.startsWith('$') ? manualPrice : `$${manualPrice}`) : undefined,
      version: 1
    };

    onUpdateMenu({
      ...currentMenu,
      dishes: [...currentMenu.dishes, newDish]
    });

    // Reset manual form
    setManualName('');
    setManualDesc('');
    setManualIngredients('');
    setManualPlating('');
    setManualPrice('');
    if (onParseComplete) onParseComplete();
  };

  const handleRemoveDish = (id: string) => {
    onUpdateMenu({
      ...currentMenu,
      dishes: currentMenu.dishes.filter((d) => d.id !== id)
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl mb-8">
      
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            Restaurant Menu & Dish Setup
          </h2>
          <p className="text-xs text-zinc-400">
            Upload or paste your text menu, or load a sample concept to photograph immediately.
          </p>
        </div>

        {/* Input Selector Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('preset')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'preset'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Sample Menus ({SAMPLE_MENUS.length})
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Text Menu
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Single Dish
          </button>
        </div>
      </div>

      {/* TAB 1: SAMPLE PRESETS */}
      {activeTab === 'preset' && (
        <div className="mt-4">
          <p className="text-xs text-zinc-400 mb-3">
            Choose a curated restaurant concept to test AI food photography instantly:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {SAMPLE_MENUS.map((menu) => {
              const isSelected = currentMenu.restaurantName === menu.restaurantName;
              return (
                <button
                  key={menu.restaurantName}
                  onClick={() => handleSelectSample(menu)}
                  className={`flex flex-col text-left p-4 rounded-xl border transition group relative ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400 truncate">
                      {menu.cuisine}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 mb-1">
                    {menu.restaurantName}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                    {menu.description}
                  </p>
                  <div className="mt-auto pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{menu.dishes.length} Dishes</span>
                    <span className="text-amber-400 font-medium group-hover:underline">Load Menu &rarr;</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PASTE RAW TEXT */}
      {activeTab === 'text' && (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-zinc-300">
            Paste your restaurant menu (items, ingredients, prices, descriptions):
          </label>
          <textarea
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste text menu here..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
          />

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              AI automatically extracts titles, ingredients, and builds photography plating specs.
            </span>
            <button
              onClick={handleParseRawText}
              disabled={isParsing || !rawText.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/10 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing Menu with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Parse & Build Photography Prompts
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL DISH ADDER */}
      {activeTab === 'manual' && (
        <form onSubmit={handleAddManualDish} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Dish Name *</label>
              <input
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Pan-Seared Chilean Sea Bass"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Category</label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Appetizers">Appetizers</option>
                <option value="Mains">Mains</option>
                <option value="Desserts">Desserts</option>
                <option value="Drinks">Drinks</option>
                <option value="Sides">Sides</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Price (Optional)</label>
              <input
                type="text"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                placeholder="e.g. $28.00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Culinary Description</label>
            <input
              type="text"
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
              placeholder="e.g. Served over saffron risotto with brown butter lemon caper reduction."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Ingredients (comma-separated)</label>
              <input
                type="text"
                value={manualIngredients}
                onChange={(e) => setManualIngredients(e.target.value)}
                placeholder="Sea bass, Saffron risotto, Capers, Lemon, Micro parsley"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Plating & Vessel Notes</label>
              <input
                type="text"
                value={manualPlating}
                onChange={(e) => setManualPlating(e.target.value)}
                placeholder="Shallow dark ceramic plate, microgreens garnish."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Dish to Photo Shoot List
            </button>
          </div>
        </form>
      )}

      {/* Active Dish List Summary */}
      {currentMenu.dishes.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-300">
              Active Shoot List ({currentMenu.dishes.length} Items):
            </span>
            <span className="text-[11px] text-zinc-500">
              Click any dish card below to shoot or edit parameters.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentMenu.dishes.map((dish) => (
              <div
                key={dish.id}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${
                  dish.generatedImageUrl
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
              >
                <span>{dish.name}</span>
                {dish.price && <span className="text-zinc-500 text-[10px]">{dish.price}</span>}
                {dish.generatedImageUrl && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                <button
                  onClick={() => handleRemoveDish(dish.id)}
                  className="text-zinc-500 hover:text-red-400 transition ml-1"
                  title="Remove dish"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
