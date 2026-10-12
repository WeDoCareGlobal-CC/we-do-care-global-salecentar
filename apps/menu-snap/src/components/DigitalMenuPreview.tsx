import React from 'react';
import { ChefHat, Printer, Sparkles, ExternalLink, QrCode, Download, ArrowLeft } from 'lucide-react';
import { MenuData, DishItem } from '../types';

interface DigitalMenuPreviewProps {
  menu: MenuData;
  onBackToStudio: () => void;
}

export const DigitalMenuPreview: React.FC<DigitalMenuPreviewProps> = ({
  menu,
  onBackToStudio,
}) => {
  // Group dishes by category
  const categories = Array.from(new Set(menu.dishes.map((d) => d.category)));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl print:hidden">
        <button
          onClick={onBackToStudio}
          className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Photo Studio
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print / Export PDF Menu
          </button>
        </div>
      </div>

      {/* Styled Printable Digital Menu Paper */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-zinc-100 font-sans print:bg-white print:text-zinc-900 print:border-none print:shadow-none print:p-0">
        
        {/* Restaurant Header */}
        <div className="text-center pb-8 border-b border-zinc-800 print:border-zinc-300">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3 print:bg-amber-100 print:text-amber-800">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white print:text-zinc-900 font-serif mb-2">
            {menu.restaurantName || 'Gourmet Restaurant'}
          </h1>
          <p className="text-sm font-semibold text-amber-400 uppercase tracking-widest print:text-amber-700">
            {menu.cuisine}
          </p>
          {menu.description && (
            <p className="text-xs text-zinc-400 max-w-xl mx-auto mt-2 italic print:text-zinc-600">
              "{menu.description}"
            </p>
          )}
        </div>

        {/* Menu Sections by Category */}
        <div className="py-8 space-y-10">
          {categories.map((cat) => {
            const catDishes = menu.dishes.filter((d) => d.category === cat);
            return (
              <div key={cat} className="space-y-6">
                
                {/* Category Header */}
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px bg-zinc-800 flex-1 print:bg-zinc-300" />
                  <h2 className="text-lg font-bold uppercase tracking-wider text-amber-300 print:text-amber-800 px-3 py-1 bg-zinc-900 print:bg-zinc-100 rounded-lg">
                    {cat}
                  </h2>
                  <div className="h-px bg-zinc-800 flex-1 print:bg-zinc-300" />
                </div>

                {/* Dish Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {catDishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="bg-zinc-900/60 print:bg-zinc-50 border border-zinc-800 print:border-zinc-200 rounded-2xl p-4 flex gap-4 overflow-hidden"
                    >
                      {/* Photo Thumbnail */}
                      {dish.generatedImageUrl ? (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-zinc-950 overflow-hidden flex-shrink-0 border border-zinc-800 print:border-zinc-300">
                          <img
                            src={dish.generatedImageUrl}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-zinc-950 flex flex-col items-center justify-center text-zinc-600 flex-shrink-0 border border-zinc-800">
                          <ChefHat className="w-6 h-6 mb-1" />
                          <span className="text-[9px]">No Photo</span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-bold text-white print:text-zinc-900">
                              {dish.name}
                            </h3>
                            {dish.price && (
                              <span className="text-xs font-extrabold text-amber-400 print:text-amber-800">
                                {dish.price}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 print:text-zinc-600 line-clamp-3 leading-relaxed">
                            {dish.description}
                          </p>
                        </div>

                        {/* Ingredients */}
                        {dish.ingredients && dish.ingredients.length > 0 && (
                          <p className="text-[10px] text-zinc-500 print:text-zinc-500 italic mt-2">
                            Contains: {dish.ingredients.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-zinc-800 print:border-zinc-300 text-center text-xs text-zinc-500 print:text-zinc-600 flex flex-col items-center gap-2">
          <p>© {new Date().getFullYear()} {menu.restaurantName || 'Restaurant'}. All photos produced with Virtual Food Photographer.</p>
          <div className="flex items-center gap-2 text-[11px] text-amber-400 print:text-amber-800 font-semibold">
            <QrCode className="w-4 h-4" />
            Scan for Digital Menu & Live Orders
          </div>
        </div>

      </div>

    </div>
  );
};
