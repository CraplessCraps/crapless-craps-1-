import React from 'react';
import { Dices } from 'lucide-react';
import { Bet, DieValue, DiceRoll } from '../types';
import { ChipGraphic } from './ChipGraphic';

interface DiceBarProps {
  lastRoll: DiceRoll | null;
  point: number | null;
  isRolling: boolean;
  onRoll: () => void;
  autoRoll: boolean;
  onToggleAutoRoll: () => void;
  bets?: Bet[];
  onPlaceHop7sBet?: () => void;
  onPointerDownHop7sBet?: (e: React.PointerEvent) => void;
  onDropOnTarget?: (e: React.DragEvent, targetType: Bet['type'] | 'HOP_7S') => void;
}

// SVG Dots for 1 to 6
const DIE_DOT_POSITIONS: Record<number, string[]> = {
  1: ['col-start-2 row-start-2'],
  2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
  3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
  4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
  5: [
    'col-start-1 row-start-1',
    'col-start-3 row-start-1',
    'col-start-2 row-start-2',
    'col-start-1 row-start-3',
    'col-start-3 row-start-3',
  ],
  6: [
    'col-start-1 row-start-1',
    'col-start-3 row-start-1',
    'col-start-1 row-start-2',
    'col-start-3 row-start-2',
    'col-start-1 row-start-3',
    'col-start-3 row-start-3',
  ],
};

const RedDieFace: React.FC<{ value: number; isRolling: boolean }> = ({ value, isRolling }) => {
  const dots = DIE_DOT_POSITIONS[value] || DIE_DOT_POSITIONS[1];

  return (
    <div
      className={`w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 via-red-600 to-red-800 rounded-lg p-1 shadow-md border border-red-400/40 flex items-center justify-center relative select-none transition-transform duration-100 ${
        isRolling ? 'animate-[spin_0.04s_linear_infinite] scale-90' : 'hover:scale-105'
      }`}
      style={{
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.6)',
      }}
    >
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
        {dots.map((pos, idx) => (
          <div
            key={idx}
            className={`${pos} w-1.5 h-1.5 sm:w-1.5 sm:h-1.5 bg-white rounded-full place-self-center shadow-inner`}
            style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}
          />
        ))}
      </div>
    </div>
  );
};

export const DiceBar: React.FC<DiceBarProps> = ({
  lastRoll,
  point,
  isRolling,
  onRoll,
  autoRoll,
  onToggleAutoRoll,
  bets = [],
  onPlaceHop7sBet,
  onPointerDownHop7sBet,
  onDropOnTarget,
}) => {
  const die1 = lastRoll ? lastRoll.die1 : 1;
  const die2 = lastRoll ? lastRoll.die2 : 3;
  const total = lastRoll ? lastRoll.total : 4;

  const hop7Pairs: Array<[DieValue, DieValue]> = [[1, 6], [2, 5], [3, 4]];
  const hop7Bets = (bets || []).filter(
    (b) =>
      b.type === 'HOP' &&
      b.hopDice &&
      hop7Pairs.some(([d1, d2]) => (b.hopDice![0] === d1 && b.hopDice![1] === d2) || (b.hopDice![0] === d2 && b.hopDice![1] === d1))
  );
  const hop7Total = Math.round(hop7Bets.reduce((acc, b) => acc + b.amount, 0) * 100) / 100;

  return (
    <div className="w-full bg-[#0a120e] border-b border-[#1b2f24] px-2 sm:px-6 py-1.5 flex items-center justify-between select-none">
      {/* Grouped controls: Dice Box, AUTO-PLAY, ROLL Button & HOP 7s Box */}
      <div className="flex items-center">
        {/* Dice & Total Display Box */}
        <div className="flex items-center space-x-2 bg-[#111e17] border border-[#223b2e] px-2 py-1 rounded-xl shadow-inner shrink-0">
          <div className="flex items-center space-x-1.5 shrink-0">
            <RedDieFace value={die1} isRolling={isRolling} />
            <RedDieFace value={die2} isRolling={isRolling} />
          </div>
          <div className="w-11 text-base sm:text-lg font-black text-amber-300 font-mono tracking-wider pl-0.5 shrink-0">
            ={total}
          </div>
        </div>

        {/* Buttons group slightly offset from dice box */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 ml-3 sm:ml-4 shrink-0">
          {/* Auto-roll toggle button */}
          <button
            onClick={onToggleAutoRoll}
            title={autoRoll ? 'Pause Auto-Roll' : 'Auto-Roll Mode'}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border font-black text-xs tracking-wider flex items-center justify-center transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              autoRoll
                ? 'bg-amber-500/20 border-yellow-400 text-yellow-300 ring-2 ring-yellow-400/50'
                : 'bg-[#18281f] border-[#263e30] text-zinc-300 hover:text-white'
            }`}
          >
            <span className="uppercase">AUTO-PLAY</span>
          </button>

          {/* Main ROLL Button */}
          <button
            onClick={onRoll}
            disabled={isRolling}
            className="relative group bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-amber-950 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl font-black text-xs sm:text-xs tracking-wider flex items-center space-x-1.5 shadow-md border border-yellow-200 active:scale-95 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap shrink-0"
            style={{
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.4), inset 0 1px 2px rgba(255,255,255,0.6)',
            }}
          >
            <Dices className={`w-3.5 h-3.5 text-amber-950 shrink-0 ${isRolling ? 'animate-[spin_0.04s_linear_infinite]' : 'group-hover:rotate-12 transition-transform'}`} />
            <span className="italic uppercase">ROLL</span>
          </button>

          {/* Hop 7s Insurance Box */}
          <div
            data-bet-target="HOP_7S"
            onClick={() => {
              if (onPlaceHop7sBet) onPlaceHop7sBet();
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onDropOnTarget?.(e, 'HOP_7S' as any);
            }}
            title="Hop 7s Shortcut ($3: $1 each on 1-6, 2-5, 3-4 paying 15:1 each)"
            className={`w-9 h-8 sm:w-10 sm:h-8.5 rounded-xl border flex flex-col items-center justify-center relative cursor-pointer select-none shrink-0 transition-all ${
              hop7Total > 0
                ? 'bg-[#2a1215] border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                : 'bg-[#181113] border-red-900/60 hover:border-red-500/80 hover:bg-[#231416]'
            }`}
          >
            <span className="text-[8px] sm:text-[9px] font-black text-red-300 uppercase leading-none tracking-tight">Hop 7s</span>
            <span className="text-[10px] sm:text-[11px] font-black text-yellow-300 uppercase leading-none tracking-tight mt-0.5">$3</span>

            {/* Active Chip Stack on Hop 7s */}
            {hop7Total > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center z-10 touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPointerDownHop7sBet?.(e);
                }}
              >
                <ChipGraphic amount={hop7Total} size="sm" isClear={true} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reserved area to the right after ROLL button for future additions */}
      <div className="flex items-center"></div>
    </div>
  );
};
