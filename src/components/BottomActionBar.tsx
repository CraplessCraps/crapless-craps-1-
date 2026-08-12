import React from 'react';
import { RotateCcw, Trash2, Repeat } from 'lucide-react';

interface BottomActionBarProps {
  onClear: () => void;
  onRebet: () => void;
  autoRebet: boolean;
  onToggleAutoRebet: () => void;
  onDoubleBets: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  onClear,
  onRebet,
  autoRebet,
  onToggleAutoRebet,
  onDoubleBets,
}) => {
  return (
    <div className="w-full bg-[#0a120e] border-t border-[#1b2f24] px-2 sm:px-4 py-1 select-none shadow-2xl">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full max-w-xl mx-auto">
        {/* CLEAR Button */}
        <button
          onClick={onClear}
          className="flex-1 h-7 sm:h-8 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 hover:border-rose-600 px-1.5 sm:px-3 rounded-md text-xs font-black uppercase tracking-wider shadow flex items-center justify-center space-x-1 active:scale-95 transition-all cursor-pointer"
          title="Clear all active bets"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>CLEAR</span>
        </button>

        {/* REBET Button */}
        <button
          onClick={onRebet}
          className="flex-1 h-7 sm:h-8 bg-amber-500 hover:bg-amber-400 text-amber-950 border border-amber-300 px-1.5 sm:px-3 rounded-md text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center justify-center space-x-1 active:scale-95 transition-all cursor-pointer"
          title="Repeat last bets"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>REBET</span>
        </button>

        {/* AUTO REBET Toggle */}
        <button
          onClick={onToggleAutoRebet}
          className={`flex-1 h-7 sm:h-8 px-1.5 sm:px-3 rounded-md text-[10px] sm:text-xs font-black tracking-tight border uppercase transition-all cursor-pointer flex items-center justify-center space-x-1 active:scale-95 whitespace-nowrap ${
            autoRebet
              ? 'bg-emerald-500 text-emerald-950 border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.4)]'
              : 'bg-[#122018] hover:bg-[#1a2d22] text-zinc-300 border-zinc-700/80'
          }`}
          title="Toggle Auto Rebet"
        >
          <Repeat className={`w-3.5 h-3.5 shrink-0 ${autoRebet ? 'animate-spin-slow' : ''}`} />
          <span>AUTO REBET</span>
        </button>

        {/* 2X Double Bets Button */}
        <button
          onClick={onDoubleBets}
          className="h-7 sm:h-8 bg-[#12281b] hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500/60 hover:border-emerald-400 px-2.5 sm:px-3 rounded-md text-xs font-black tracking-wider flex items-center justify-center active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
          title="Double all active box bets"
        >
          <span>2X</span>
        </button>
      </div>
    </div>
  );
};

