import React from 'react';
import { Sparkles, Volume2 } from 'lucide-react';
import { AtsState, Bet } from '../types';
import { ChipGraphic } from './ChipGraphic';

interface AtsBonusBoardProps {
  atsState: AtsState;
  point: number | null;
  bets: Bet[];
  selectedChip: number;
  areBoxBetsWorking?: boolean;
  onToggleAllBoxBetsWorking?: () => void;
  onPlaceBet: (type: 'ATS_SMALL' | 'ATS_ALL' | 'ATS_TALL') => void;
  onDragStartBet?: (e: React.DragEvent, bet: Bet) => void;
  onPointerDownBet?: (e: React.PointerEvent, bet: Bet) => void;
  onDropOnTarget?: (e: React.DragEvent, targetType: Bet['type']) => void;
  draggingBetId?: string;
  isStickmanCalloutsOn?: boolean;
  onToggleStickmanCallouts?: () => void;
}

export const AtsBonusBoard: React.FC<AtsBonusBoardProps> = ({
  atsState,
  point,
  bets,
  areBoxBetsWorking = true,
  onToggleAllBoxBetsWorking,
  onPlaceBet,
  onDragStartBet,
  onPointerDownBet,
  onDropOnTarget,
  draggingBetId,
  isStickmanCalloutsOn = true,
  onToggleStickmanCallouts,
}) => {
  const smallBet = bets.find((b) => b.type === 'ATS_SMALL');
  const allBet = bets.find((b) => b.type === 'ATS_ALL');
  const tallBet = bets.find((b) => b.type === 'ATS_TALL');

  const smallHitsSet = atsState?.smallHits instanceof Set ? atsState.smallHits : new Set<number>(Array.isArray(atsState?.smallHits) ? atsState.smallHits : []);
  const tallHitsSet = atsState?.tallHits instanceof Set ? atsState.tallHits : new Set<number>(Array.isArray(atsState?.tallHits) ? atsState.tallHits : []);
  const allHitsSet = atsState?.allHits instanceof Set ? atsState.allHits : new Set<number>(Array.isArray(atsState?.allHits) ? atsState.allHits : []);

  const smallNumbers = [2, 3, 4, 5, 6];
  const tallNumbers = [8, 9, 10, 11, 12];

  const isAtsLocked = point !== null || allHitsSet.size > 0;

  return (
    <div className="w-full bg-[#0d1712] border border-[#1b3324] rounded-2xl p-1.5 sm:p-2.5 shadow-2xl select-none mb-1.5 sm:mb-2">
      {/* Crapless Craps Header & Control Toggles */}
      <div className="flex items-center justify-between mb-1.5 sm:mb-2 flex-wrap gap-1.5">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span className="text-xs sm:text-base font-black text-amber-400 tracking-wider">CRAPLESS</span>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded text-[9px] sm:text-xs font-bold uppercase">
            CRAPS
          </span>
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
          {/* CALLOUTS Button */}
          <button
            onClick={onToggleStickmanCallouts}
            title={isStickmanCalloutsOn ? 'Disable roll voice callouts' : 'Enable roll voice callouts'}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl border text-[10px] sm:text-xs font-black tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
              isStickmanCalloutsOn
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700/80'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 shrink-0" />
            <span>CALLOUTS</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-black uppercase ${
                isStickmanCalloutsOn ? 'bg-emerald-400 text-emerald-950' : 'bg-zinc-700 text-zinc-300'
              }`}
            >
              {isStickmanCalloutsOn ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* BETS (ON/OFF) Toggle Button */}
          <button
            onClick={onToggleAllBoxBetsWorking}
            title={areBoxBetsWorking ? 'Turn ALL box number bets OFF' : 'Turn ALL box number bets ON (Working)'}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl border text-[10px] sm:text-xs font-black tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
              areBoxBetsWorking
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700/80'
            }`}
          >
            <span className="uppercase font-extrabold">BETS</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-black uppercase ${
                areBoxBetsWorking
                  ? 'bg-emerald-400 text-emerald-950'
                  : 'bg-zinc-700 text-zinc-300'
              }`}
            >
              {areBoxBetsWorking ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Point display for board */}
          <div className="flex items-center space-x-1 bg-[#14261c] border border-amber-500/30 px-2 py-0.5 rounded-xl">
            <span className="text-[9px] sm:text-xs text-amber-400/80 font-bold uppercase">POINT:</span>
            {point !== null ? (
              <span className="text-xs font-extrabold text-yellow-300 bg-amber-500/30 px-2 py-0.2 rounded border border-yellow-400/50">
                {point}
              </span>
            ) : (
              <span className="text-[9px] sm:text-xs font-bold text-zinc-400">OFF</span>
            )}
          </div>
        </div>
      </div>

      {/* ATS BONUS Container */}
      <div className="bg-[#0b130e] border border-[#1d3827] rounded-xl p-1.5 sm:p-2 shadow-inner">
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-black italic text-amber-300 mb-1.5 tracking-wide uppercase flex-wrap gap-1">
          <div className="flex items-center space-x-2">
            <span>ATS BONUS</span>
          </div>

          {isAtsLocked && (
            <span className="text-[9px] font-normal text-amber-400/90 flex items-center space-x-0.5">
              <span>🔒</span>
              <span>Locked</span>
            </span>
          )}
        </div>

        {/* 3 Wager Boxes Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
          {/* SMALL Box */}
          <div
            data-bet-target="ATS_SMALL"
            onClick={() => onPlaceBet('ATS_SMALL')}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => onDropOnTarget?.(e, 'ATS_SMALL')}
            className={`relative border rounded-xl p-1 sm:p-2 flex flex-col justify-between transition-all cursor-pointer ${
              atsState.smallWon
                ? 'bg-amber-500/20 border-yellow-400 ring-1 ring-yellow-400/50'
                : 'bg-[#101e16] border-[#1d3728] hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] sm:text-xs font-black text-zinc-300 tracking-tight uppercase">SMALL</span>
              <span className="text-[7px] sm:text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1 py-0.2 rounded">
                31 FOR 1
              </span>
            </div>

            {/* Small Numbers row (2,3,4,5,6) */}
            <div className="flex items-center justify-between my-0.5 px-0.5">
              {smallNumbers.map((num) => {
                const isHit = smallHitsSet.has(num);
                return (
                  <div
                    key={num}
                    className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black text-[8px] sm:text-xs transition-all ${
                      isHit
                        ? 'text-yellow-300 border-2 border-yellow-400 bg-yellow-400/30 shadow-[0_0_8px_rgba(234,179,8,0.7)] scale-110'
                        : 'text-zinc-500 border border-zinc-700/50 bg-zinc-900/40'
                    }`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>

            {/* Chip Stack Placement */}
            <div className="h-5 sm:h-6 flex items-center justify-center mt-0.5">
              {smallBet && smallBet.id !== draggingBetId ? (
                <div
                  draggable={!isAtsLocked}
                  onDragStart={(e) => {
                    if (isAtsLocked) return;
                    e.stopPropagation();
                    onDragStartBet?.(e, smallBet);
                  }}
                  onPointerDown={(e) => {
                    if (isAtsLocked) return;
                    e.stopPropagation();
                    onPointerDownBet?.(e, smallBet);
                  }}
                  className={`relative ${!isAtsLocked ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'} touch-none`}
                >
                  <ChipGraphic amount={smallBet.amount} size="sm" />
                  {isAtsLocked && (
                    <span className="absolute -top-1 -right-1 text-[9px]">🔒</span>
                  )}
                </div>
              ) : (
                <span className="text-[8px] sm:text-[9px] text-zinc-500 italic">Tap Bet</span>
              )}
            </div>
          </div>

          {/* ALL Box */}
          <div
            data-bet-target="ATS_ALL"
            onClick={() => onPlaceBet('ATS_ALL')}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => onDropOnTarget?.(e, 'ATS_ALL')}
            className={`relative border rounded-xl p-1 sm:p-2 flex flex-col justify-between transition-all cursor-pointer ${
              atsState.allWon
                ? 'bg-amber-500/20 border-yellow-400 ring-1 ring-yellow-400/50'
                : 'bg-[#101e16] border-[#1d3728] hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] sm:text-xs font-black text-zinc-300 tracking-tight uppercase">ALL</span>
              <span className="text-[7px] sm:text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1 py-0.2 rounded">
                156 FOR 1
              </span>
            </div>

            {/* Progress Count */}
            <div className="flex items-center justify-center my-0.5">
              <span className="text-[9px] sm:text-xs font-black text-yellow-300 bg-yellow-400/10 px-1.5 py-0.2 rounded border border-yellow-400/30">
                {allHitsSet.size} / 10 Hits
              </span>
            </div>

            {/* Chip Stack Placement */}
            <div className="h-5 sm:h-6 flex items-center justify-center mt-0.5">
              {allBet && allBet.id !== draggingBetId ? (
                <div
                  draggable={!isAtsLocked}
                  onDragStart={(e) => {
                    if (isAtsLocked) return;
                    e.stopPropagation();
                    onDragStartBet?.(e, allBet);
                  }}
                  onPointerDown={(e) => {
                    if (isAtsLocked) return;
                    e.stopPropagation();
                    onPointerDownBet?.(e, allBet);
                  }}
                  className={`relative ${!isAtsLocked ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'} touch-none`}
                >
                  <ChipGraphic amount={allBet.amount} size="sm" />
                  {isAtsLocked && (
                    <span className="absolute -top-1 -right-1 text-[9px]">🔒</span>
                  )}
                </div>
              ) : (
                <span className="text-[8px] sm:text-[9px] text-zinc-500 italic">Tap Bet</span>
              )}
            </div>
          </div>

          {/* TALL Box */}
          <div
            data-bet-target="ATS_TALL"
            onClick={() => onPlaceBet('ATS_TALL')}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => onDropOnTarget?.(e, 'ATS_TALL')}
            className={`relative border rounded-xl p-1 sm:p-2 flex flex-col justify-between transition-all cursor-pointer ${
              atsState.tallWon
                ? 'bg-amber-500/20 border-yellow-400 ring-1 ring-yellow-400/50'
                : 'bg-[#101e16] border-[#1d3728] hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] sm:text-xs font-black text-zinc-300 tracking-tight uppercase">TALL</span>
              <span className="text-[7px] sm:text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1 py-0.2 rounded">
                31 FOR 1
              </span>
            </div>

            {/* Tall Numbers row (8,9,10,11,12) */}
            <div className="flex items-center justify-between my-0.5 px-0.5">
              {tallNumbers.map((num) => {
                const isHit = tallHitsSet.has(num);
                return (
                  <div
                    key={num}
                    className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black text-[8px] sm:text-xs transition-all ${
                      isHit
                        ? 'text-yellow-300 border-2 border-yellow-400 bg-yellow-400/30 shadow-[0_0_8px_rgba(234,179,8,0.7)] scale-110'
                        : 'text-zinc-500 border border-zinc-700/50 bg-zinc-900/40'
                    }`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>

            {/* Chip Stack Placement */}
            <div className="h-5 sm:h-6 flex items-center justify-center mt-0.5">
              {tallBet && tallBet.id !== draggingBetId ? (
                <div
                  draggable={!isAtsLocked}
                  onDragStart={(e) => {
                    if (isAtsLocked) return;
                    e.stopPropagation();
                    onDragStartBet?.(e, tallBet);
                  }}
                  onPointerDown={(e) => {
                    if (isAtsLocked) return;
                    e.stopPropagation();
                    onPointerDownBet?.(e, tallBet);
                  }}
                  className={`relative ${!isAtsLocked ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'} touch-none`}
                >
                  <ChipGraphic amount={tallBet.amount} size="sm" />
                  {isAtsLocked && (
                    <span className="absolute -top-1 -right-1 text-[9px]">🔒</span>
                  )}
                </div>
              ) : (
                <span className="text-[8px] sm:text-[9px] text-zinc-500 italic">Tap Bet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
