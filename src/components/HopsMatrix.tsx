import React from 'react';
import { Bet, DieValue } from '../types';
import { ChipGraphic } from './ChipGraphic';
import { isBetWorking, formatMoney } from '../utils/crapsEngine';

interface HopsMatrixProps {
  bets: Bet[];
  point?: number | null;
  placeWorkingOnComeOut?: boolean;
  hardsWorking?: boolean;
  onToggleBetWorking?: (betId: string) => void;
  onPlaceHopBet: (d1: DieValue, d2: DieValue) => void;
  onDragStartBet?: (e: React.DragEvent, bet: Bet) => void;
  onPointerDownBet?: (e: React.PointerEvent, bet: Bet) => void;
  onDropOnTarget?: (
    e: React.DragEvent,
    targetType: Bet['type'],
    targetNumber?: number,
    hopDice?: [DieValue, DieValue]
  ) => void;
  draggingBetId?: string;
}

// Mini Die Face component rendering realistic red dice with white dots
const RedDieFace: React.FC<{ value: DieValue }> = ({ value }) => {
  const dotPositions: Record<number, string[]> = {
    1: ['col-start-2 row-start-2'],
    2: ['col-start-3 row-start-1', 'col-start-1 row-start-3'],
    3: ['col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3'],
    4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
  };

  return (
    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-700 rounded border border-red-400/90 shadow grid grid-cols-3 grid-rows-3 items-center justify-items-center p-0.5 select-none shrink-0">
      {(dotPositions[value] || []).map((posClass, idx) => (
        <div key={idx} className={`w-1 h-1 bg-white rounded-full shadow-inner ${posClass}`} />
      ))}
    </div>
  );
};

// 1. HARD HOPS (All 6 hard pairs - 30 to 1)
const HARD_HOPS: Array<{ dice: [DieValue, DieValue]; label: string }> = [
  { dice: [1, 1], label: 'HARD 2' },
  { dice: [2, 2], label: 'HARD 4' },
  { dice: [3, 3], label: 'HARD 6' },
  { dice: [4, 4], label: 'HARD 8' },
  { dice: [5, 5], label: 'HARD 10' },
  { dice: [6, 6], label: 'HARD 12' },
];

// 2. SEVENS HOPS (All 3 combinations for 7 - 15 to 1)
const SEVENS_HOPS: Array<{ dice: [DieValue, DieValue]; label: string }> = [
  { dice: [1, 6], label: '1-6 (7)' },
  { dice: [2, 5], label: '2-5 (7)' },
  { dice: [3, 4], label: '3-4 (7)' },
];

// 3. OTHER SOFT HOPS (Grouped by target number - 15 to 1)
const SOFT_HOPS_GROUPED: Array<{ title: string; items: Array<{ dice: [DieValue, DieValue]; label: string }> }> = [
  {
    title: 'CRAPS SOFTS (3 & 11)',
    items: [
      { dice: [1, 2], label: '1-2 (3)' },
      { dice: [5, 6], label: '5-6 (11)' },
    ],
  },
  {
    title: 'SOFT 4 & 10',
    items: [
      { dice: [1, 3], label: '1-3 (4)' },
      { dice: [4, 6], label: '4-6 (10)' },
    ],
  },
  {
    title: 'SOFT 5 & 9',
    items: [
      { dice: [1, 4], label: '1-4 (5)' },
      { dice: [2, 3], label: '2-3 (5)' },
      { dice: [3, 6], label: '3-6 (9)' },
      { dice: [4, 5], label: '4-5 (9)' },
    ],
  },
  {
    title: 'SOFT 6 & 8',
    items: [
      { dice: [1, 5], label: '1-5 (6)' },
      { dice: [2, 4], label: '2-4 (6)' },
      { dice: [2, 6], label: '2-6 (8)' },
      { dice: [3, 5], label: '3-5 (8)' },
    ],
  },
];

export const HopsMatrix: React.FC<HopsMatrixProps> = ({
  bets,
  point = null,
  placeWorkingOnComeOut = false,
  hardsWorking = false,
  onToggleBetWorking,
  onPlaceHopBet,
  onDragStartBet,
  onPointerDownBet,
  onDropOnTarget,
  draggingBetId,
}) => {
  const findHopBet = (d1: DieValue, d2: DieValue) => {
    return bets.find(
      (b) =>
        b.type === 'HOP' &&
        b.hopDice &&
        ((b.hopDice[0] === d1 && b.hopDice[1] === d2) ||
          (b.hopDice[0] === d2 && b.hopDice[1] === d1))
    );
  };

  const renderHopCell = (
    cell: { dice: [DieValue, DieValue]; label: string },
    payout: string,
    isHard: boolean
  ) => {
    const [d1, d2] = cell.dice;
    const bet = findHopBet(d1, d2);
    const isWorking = bet
      ? isBetWorking(bet, point, placeWorkingOnComeOut, hardsWorking)
      : false;

    return (
      <div
        key={`${d1}-${d2}`}
        data-bet-target="HOP"
        data-hop-d1={d1}
        data-hop-d2={d2}
        onClick={() => onPlaceHopBet(d1, d2)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => onDropOnTarget?.(e, 'HOP', undefined, [d1, d2])}
        className={`relative bg-[#0d2217] border rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-between cursor-pointer transition-all min-h-[52px] sm:min-h-[60px] ${
          bet && bet.id !== draggingBetId
            ? 'border-yellow-400 bg-amber-500/20 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
            : 'border-[#1b422d] hover:border-amber-400/60 hover:bg-[#132c1e]'
        }`}
        title={
          bet
            ? `Hop Bet ${cell.label} $${formatMoney(bet.amount)} (${isWorking ? 'WORKING/ON' : 'OFF'}). Click pill to toggle.`
            : `Place Hop Bet ${cell.label}`
        }
      >
        {/* Dice Pair */}
        <div className="flex items-center space-x-0.5 sm:space-x-1">
          <RedDieFace value={d1} />
          <RedDieFace value={d2} />
        </div>

        {/* Label & Payout */}
        <div className="flex flex-col items-center leading-tight">
          <span className="text-[8px] sm:text-[9px] font-bold text-zinc-300">
            {cell.label}
          </span>
          <span
            className={`text-[7px] sm:text-[8px] font-extrabold uppercase ${
              isHard ? 'text-amber-300 font-black' : 'text-emerald-400'
            }`}
          >
            {payout}
          </span>
        </div>

        {/* Bet Chip Stack if active */}
        {bet && bet.id !== draggingBetId && (
          <div className="absolute -top-1 -right-1 z-10 flex items-center">
            <div
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStartBet?.(e, bet);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDownBet?.(e, bet);
              }}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <ChipGraphic amount={bet.amount} size="sm" />
            </div>

            {!isWorking ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (bet && onToggleBetWorking) {
                    onToggleBetWorking(bet.id);
                  }
                }}
                className="absolute -top-2 -right-2 bg-red-950 border border-red-500 text-red-200 text-[7px] font-black px-0.5 py-0 rounded shadow uppercase cursor-pointer hover:scale-110 active:scale-95 transition-transform z-30"
                title="Click to turn bet ON"
              >
                OFF
              </button>
            ) : (
              (point === null || bet.working === true) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (bet && onToggleBetWorking) {
                      onToggleBetWorking(bet.id);
                    }
                  }}
                  className="absolute -top-2 -right-2 bg-emerald-500 text-emerald-950 text-[7px] font-black px-0.5 py-0 rounded shadow uppercase cursor-pointer hover:scale-110 active:scale-95 transition-transform z-30"
                  title="Click to turn bet OFF"
                >
                  ON
                </button>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#0a1e14] border border-[#1e4a33] rounded-2xl p-2 sm:p-2.5 shadow-2xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#1b402c] px-1">
        <span className="text-xs sm:text-sm font-black text-amber-400 tracking-wider uppercase italic">
          🎲 HOPS MATRIX
        </span>
        <span className="text-[9px] sm:text-xs text-zinc-400 font-bold">
          One-Roll Hop Bets
        </span>
      </div>

      <div className="space-y-2">
        {/* SECTION 1: HARD HOPS AT TOP (30 TO 1) */}
        <div>
          <div className="text-[9px] sm:text-[10px] font-black text-amber-300 uppercase tracking-widest mb-1 flex items-center justify-between px-1">
            <span>HARD HOPS</span>
            <span className="text-amber-400 font-extrabold">30 TO 1</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-1.5">
            {HARD_HOPS.map((cell) => renderHopCell(cell, '30:1', true))}
          </div>
        </div>

        {/* SECTION 2: HOP ALL SEVENS (15 TO 1) */}
        <div>
          <div className="text-[9px] sm:text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 flex items-center justify-between px-1">
            <span>HOP SEVENS (ALL 3 COMBINATIONS)</span>
            <span className="text-emerald-400 font-extrabold">15 TO 1</span>
          </div>
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {SEVENS_HOPS.map((cell) => renderHopCell(cell, '15:1', false))}
          </div>
        </div>

        {/* SECTION 3: GROUPED SOFT HOPS (15 TO 1) */}
        <div className="space-y-1.5">
          <div className="text-[9px] sm:text-[10px] font-black text-zinc-300 uppercase tracking-widest px-1">
            SOFT HOPS (15 TO 1)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SOFT_HOPS_GROUPED.map((group, idx) => (
              <div key={idx} className="bg-[#0b1710] border border-[#173323] rounded-xl p-1">
                <div className="text-[8px] sm:text-[9px] font-bold text-emerald-400/90 mb-0.5 px-0.5 uppercase">
                  {group.title}
                </div>
                <div className={`grid gap-1 ${group.items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                  {group.items.map((cell) => renderHopCell(cell, '15:1', false))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
