import React, { useState } from 'react';
import { Language } from '../types';
import { DollarSign, TrendingUp, Sliders, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface PricingCalculatorProps {
  language: Language;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ language }) => {
  const [setupPrice, setSetupPrice] = useState<number>(199);
  const [setupClientsCount, setSetupClientsCount] = useState<number>(3);
  const [retainerPrice, setRetainerPrice] = useState<number>(399);
  const [retainerClientsCount, setRetainerClientsCount] = useState<number>(8);
  const [softwareCost, setSoftwareCost] = useState<number>(0);

  const monthlySetupRevenue = setupClientsCount * setupPrice;
  const monthlyRetainerRevenue = retainerClientsCount * retainerPrice;
  const totalMonthlyRevenue = monthlySetupRevenue + monthlyRetainerRevenue;
  const netMonthlyProfit = totalMonthlyRevenue - softwareCost;
  const profitMargin = totalMonthlyRevenue > 0 ? Math.round((netMonthlyProfit / totalMonthlyRevenue) * 100) : 100;
  const annualProjection = netMonthlyProfit * 12;

  // Days to $100 calculation
  const daysTo100 = setupClientsCount > 0 || retainerClientsCount > 0 ? '3 - 5 Days' : '0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {language === 'bs' ? 'Interaktivni Kalkulator Zarade & Cjenovnik' : 'Interactive Profit & Pricing Strategy Calculator'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bs'
                ? 'Prilagodite cijene i broj klijenata da vidite mjesečni i godišnji čisti profit sa $0 troškova'
                : 'Simulate pricing strategies and client count to project your net monthly & annual recurring revenue'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Input Panel */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-emerald-400" />
            {language === 'bs' ? 'Podešavanje Parametara Prodaje:' : 'Adjust Sales Parameters:'}
          </h3>

          {/* Setup Fee Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">
                {language === 'bs' ? 'Cijena Jednokratne Postavke (Express Setup):' : 'Express Setup Price:'}
              </span>
              <span className="font-extrabold text-emerald-400 text-sm">${setupPrice}</span>
            </div>
            <input
              type="range"
              min="99"
              max="499"
              step="10"
              value={setupPrice}
              onChange={(e) => setSetupPrice(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Setup Clients Count Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">
                {language === 'bs' ? 'Novi Klijenti Za Postavku mjesečno:' : 'New Setup Clients / month:'}
              </span>
              <span className="font-extrabold text-emerald-400 text-sm">{setupClientsCount} {language === 'bs' ? 'klijenta' : 'clients'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={setupClientsCount}
              onChange={(e) => setSetupClientsCount(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Monthly Retainer Price Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">
                {language === 'bs' ? 'Mjesečna Pretplata Za Održavanje:' : 'Monthly Retainer Fee:'}
              </span>
              <span className="font-extrabold text-emerald-400 text-sm">${retainerPrice} / {language === 'bs' ? 'mj' : 'mo'}</span>
            </div>
            <input
              type="range"
              min="199"
              max="999"
              step="25"
              value={retainerPrice}
              onChange={(e) => setRetainerPrice(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Monthly Retainer Clients Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">
                {language === 'bs' ? 'Aktivni Klijenti na Mjesečnoj Pretplati:' : 'Active Retainer Clients:'}
              </span>
              <span className="font-extrabold text-emerald-400 text-sm">{retainerClientsCount} {language === 'bs' ? 'firme' : 'firms'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={retainerClientsCount}
              onChange={(e) => setRetainerClientsCount(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Software Cost Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400">
                {language === 'bs' ? 'Mjesečni Trošak Alata (Make/Airtable):' : 'Monthly Software Tools Cost:'}
              </span>
              <span className="font-bold text-amber-400 text-xs">${softwareCost} / {language === 'bs' ? 'mj (Besplatno na startu)' : 'mo'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={softwareCost}
              onChange={(e) => setSoftwareCost(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Output Metrics Box */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {language === 'bs' ? 'PROJEKCIJA PROFITA' : 'PROJECTION BREAKDOWN'}
            </span>

            <div>
              <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Čisti Mjesečni Profit (Net Profit):' : 'Net Monthly Profit:'}</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight flex items-baseline gap-1 mt-1">
                ${netMonthlyProfit.toLocaleString()}
                <span className="text-xs text-slate-400 font-normal">/{language === 'bs' ? 'mjesec' : 'month'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Profitna Marža:' : 'Profit Margin:'}</span>
                <span className="text-base font-bold text-emerald-400">{profitMargin}%</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Godišnji Prihod:' : 'Annual Projection:'}</span>
                <span className="text-base font-bold text-white">${annualProjection.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'bs' ? 'Brzina Do Prvih $100:' : 'Fastest $100 Benchmark:'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'bs'
                  ? 'Samo 1 klijent za jednokratnu brzu postavku ($199) donosi Vam prvih $100 čistog novca unutar 3 do 5 dni!'
                  : 'Just 1 express audit & setup client ($199) reaches your first $100 profit within 3-5 days!'}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800 pt-4 flex items-center justify-between">
            <span>{language === 'bs' ? 'Cilj $5.000/mj prihod:' : 'Target $5,000/mo Goal:'}</span>
            <span className="font-bold text-emerald-400">
              {netMonthlyProfit >= 5000
                ? (language === 'bs' ? '✅ CILJ OSTVAREN!' : '✅ TARGET REACHED!')
                : (language === 'bs' ? `Preostalo još $${5000 - netMonthlyProfit}` : `$${5000 - netMonthlyProfit} remaining`)}
            </span>
          </div>
        </div>
      </div>

      {/* Recommended 3-Tier Offer Pricing Structure */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          {language === 'bs' ? 'Preporučeni Paket Paketa Za Klijente' : 'Recommended 3-Tier Client Pricing Architecture'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              TIER 1
            </span>
            <h4 className="text-base font-bold text-white">Express Audit & Setup</h4>
            <div className="text-2xl font-black text-emerald-400">$149 - $199</div>
            <p className="text-xs text-slate-400">
              {language === 'bs' ? 'Jednokratno podešavanje bez mjesečnih obaveza.' : 'One-time express setup with no monthly obligation.'}
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Google Maps Audit Report</li>
              <li>SMS Auto-reply on missed calls</li>
              <li>1-click review link creation</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/50 space-y-3 relative shadow-xl">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
              MOST POPULAR
            </span>
            <h4 className="text-base font-bold text-white">AI Lead & Review Retainer</h4>
            <div className="text-2xl font-black text-emerald-400">$399 / {language === 'bs' ? 'mj' : 'mo'}</div>
            <p className="text-xs text-slate-400">
              {language === 'bs' ? 'Sveobuhvatno mjesečno održavanje na autopilotu.' : 'Ongoing monthly maintenance on complete autopilot.'}
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Everything in Express Tier</li>
              <li>Automated 5-star review responses</li>
              <li>Website lead capture AI chatbot</li>
              <li>Weekly performance reports</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              VIP SCALE
            </span>
            <h4 className="text-base font-bold text-white">Full Growth Automation</h4>
            <div className="text-2xl font-black text-emerald-400">$899 / {language === 'bs' ? 'mj' : 'mo'}</div>
            <p className="text-xs text-slate-400">
              {language === 'bs' ? 'Potpuna automatizacija marketinga i prodaje.' : 'End-to-end local business marketing automation.'}
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Everything in Retainer Tier</li>
              <li>AI Social media post batching</li>
              <li>WhatsApp appointment booking</li>
              <li>Dedicated priority support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
