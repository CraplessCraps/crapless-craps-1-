import React from 'react';

interface PressControlsProps {
  onPress: (group: 'ACROSS' | 'EXTREMES' | 'OUTSIDE' | 'INSIDE') => void;
}

export const PressControls: React.FC<PressControlsProps> = ({ onPress }) => {
  return (
    <div className="w-full bg-[#0e1912] border border-[#1c3525] rounded-xl px-2.5 py-1 flex items-center justify-between my-1 shadow-md select-none">
      <span className="text-[11px] font-black text-amber-300 tracking-wider mr-2 uppercase">PRESS:</span>

      <div className="grid grid-cols-4 gap-1 flex-1 max-w-xl">
        <button
          onClick={() => onPress('ACROSS')}
          title="Place/Press bets on ALL numbers (2,3,4,5,6,8,9,10,11,12)"
          className="bg-[#182a1f] border border-[#2b4836] text-amber-300 hover:border-amber-400 px-1.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wide active:scale-95 transition-all cursor-pointer"
        >
          ACROSS
        </button>

        <button
          onClick={() => onPress('EXTREMES')}
          title="Place/Press bets on Extreme numbers (2, 3, 11, 12)"
          className="bg-[#182a1f] border border-[#2b4836] text-amber-300 hover:border-amber-400 px-1.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wide active:scale-95 transition-all cursor-pointer"
        >
          EXTREMES
        </button>

        <button
          onClick={() => onPress('OUTSIDE')}
          title="Place/Press bets on Outside numbers (2, 3, 4, 10, 11, 12)"
          className="bg-[#182a1f] border border-[#2b4836] text-amber-300 hover:border-amber-400 px-1.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wide active:scale-95 transition-all cursor-pointer"
        >
          OUTSIDE
        </button>

        <button
          onClick={() => onPress('INSIDE')}
          title="Place/Press bets on Inside numbers (5, 6, 8, 9)"
          className="bg-[#182a1f] border border-[#2b4836] text-amber-300 hover:border-amber-400 px-1.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wide active:scale-95 transition-all cursor-pointer"
        >
          INSIDE
        </button>
      </div>
    </div>
  );
};
