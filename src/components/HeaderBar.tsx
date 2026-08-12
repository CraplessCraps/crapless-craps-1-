import React from 'react';
import { Wallet, Coins, RefreshCw, BarChart2, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { formatMoney } from '../utils/crapsEngine';

interface HeaderBarProps {
  bank: number;
  risk: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenRefreshModal: () => void;
  onOpenStats: () => void;
  onOpenHelp: () => void;
}

const formatHeaderValue = (val: number): string => {
  const rounded = Math.round(val * 100) / 100;
  if (rounded >= 10_000_000) {
    const m = rounded / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
  }
  return `$${formatMoney(rounded)}`;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  bank,
  risk,
  soundEnabled,
  onToggleSound,
  onOpenRefreshModal,
  onOpenStats,
  onOpenHelp,
}) => {
  const canRefresh = bank + risk < 1;

  return (
    <header className="w-full bg-[#0b140f] border-b border-[#1b2f24] px-1.5 sm:px-3 py-1 flex items-center justify-between text-yellow-500 select-none shadow-md overflow-hidden min-w-0">
      {/* Left side: Small REFRESH CHIPS Icon Button */}
      <button
        onClick={onOpenRefreshModal}
        title={canRefresh ? 'Refresh chips ($1,000)' : 'Refresh chips (Unlocks when total balance < $1)'}
        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-all border shrink-0 ${
          canRefresh
            ? 'bg-gradient-to-br from-amber-500 to-yellow-400 text-amber-950 border-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.6)] animate-pulse cursor-pointer hover:scale-105 active:scale-95'
            : 'bg-[#122018] border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
        }`}
      >
        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
      </button>

      {/* Right side: Badges & Controls Cluster */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs min-w-0">
        {/* BANK Badge */}
        <div className="flex items-center space-x-1 bg-[#122018] border border-amber-500/30 px-1.5 sm:px-2 py-1 rounded-lg shadow-inner min-w-0 shrink">
          <Wallet className="w-3 h-3 text-yellow-400 shrink-0" />
          <div className="flex items-center space-x-1 leading-none min-w-0">
            <span className="text-[8px] sm:text-[9px] text-amber-300/80 uppercase font-semibold shrink-0">BANK</span>
            <span className="font-extrabold text-yellow-300 tracking-wide text-[11px] sm:text-xs truncate">
              {formatHeaderValue(bank)}
            </span>
          </div>
        </div>

        {/* RISK Badge */}
        <div className="flex items-center space-x-1 bg-[#122018] border border-emerald-500/20 px-1.5 sm:px-2 py-1 rounded-lg shadow-inner min-w-0 shrink">
          <Coins className="w-3 h-3 text-emerald-400 shrink-0" />
          <div className="flex items-center space-x-1 leading-none min-w-0">
            <span className="text-[8px] sm:text-[9px] text-zinc-400 uppercase font-semibold shrink-0">RISK</span>
            <span className="font-extrabold text-white tracking-wide text-[11px] sm:text-xs truncate">
              {formatHeaderValue(risk)}
            </span>
          </div>
        </div>

        {/* Stats Button */}
        <button
          onClick={onOpenStats}
          title="Roll History & Stats"
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[#18281f] border border-[#263e30] text-amber-400 hover:bg-[#20362a] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[#18281f] border border-[#263e30] text-amber-400 hover:bg-[#20362a] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 shrink-0" />
          )}
        </button>

        {/* Help / Info Button */}
        <button
          onClick={onOpenHelp}
          title="Crapless Craps Rules & Guide"
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[#18281f] border border-[#263e30] text-amber-400 hover:bg-[#20362a] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        </button>
      </div>
    </header>
  );
};

