import { ownerHeaders } from '../utils/ownerAuth';
import React, { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertCircle, Wand2 } from 'lucide-react';
import { DishItem } from '../types';

interface PhotoRetouchModalProps {
  dish: DishItem | null;
  onClose: () => void;
  onSaveRetouchedImage: (dishId: string, newImageUrl: string) => void;
}

export const PhotoRetouchModal: React.FC<PhotoRetouchModalProps> = ({
  dish,
  onClose,
  onSaveRetouchedImage,
}) => {
  if (!dish) return null;

  const [instruction, setInstruction] = useState('');
  const [isRetouching, setIsRetouching] = useState(false);
  const [retouchedPreview, setRetouchedPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const quickChips = [
    'Add extra melted cheese drip',
    'Make background dark textured slate',
    'Add fresh green basil leaves & sea salt',
    'Add subtle rising hot steam',
    'Add a cold craft beverage in background',
    'Make food glazes extra glistening',
    'Add charred edges on meat/bread'
  ];

  const handleApplyRetouch = async () => {
    if (!instruction.trim() || !dish.generatedImageUrl) return;

    setIsRetouching(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/edit-food-photo', {
        headers: { 'Content-Type': 'application/json', ...ownerHeaders() },
method: 'POST',
        body: JSON.stringify({
          imageUrl: dish.generatedImageUrl,
          instruction: instruction.trim(),
          dish
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to edit photo');
      }

      const data = await res.json();
      if (data.imageUrl) {
        setRetouchedPreview(data.imageUrl);
      } else {
        throw new Error('No updated image returned.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Retouching failed');
    } finally {
      setIsRetouching(false);
    }
  };

  const handleConfirmApply = () => {
    if (retouchedPreview) {
      onSaveRetouchedImage(dish.id, retouchedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Retouch & Edit Photo: <span className="text-amber-300">{dish.name}</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Give Gemini natural language instructions to adjust lighting, garnishes, or props.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 overflow-y-auto space-y-4">
          
          {/* Image Comparison View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Original */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Original Shot
              </span>
              <div className="aspect-square bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
                <img
                  src={dish.generatedImageUrl}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Retouched Preview */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center justify-between">
                <span>AI Retouched Result</span>
                {retouchedPreview && <span className="text-emerald-400 text-[10px] font-bold">New!</span>}
              </span>
              <div className="aspect-square bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center relative">
                {retouchedPreview ? (
                  <img
                    src={retouchedPreview}
                    alt="Retouched result"
                    className="w-full h-full object-cover"
                  />
                ) : isRetouching ? (
                  <div className="text-center p-4">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-amber-300 font-bold">Retouching Food Photo...</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Applying instructions with Gemini</p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 text-center px-4">
                    Enter edit instruction below and click "Apply AI Touch-Up".
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Quick Suggestion Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2">
              Quick Touch-Up Ideas:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setInstruction(chip)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-amber-300 text-xs transition"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction Input */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5">
              Custom Retouch Instruction:
            </label>
            <textarea
              rows={2}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Sprinkle roasted sesame seeds and make the cheese melt extra gooey..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyRetouch}
              disabled={isRetouching || !instruction.trim()}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isRetouching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              Apply AI Touch-Up
            </button>

            {retouchedPreview && (
              <button
                onClick={handleConfirmApply}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Keep Retouched Image
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
