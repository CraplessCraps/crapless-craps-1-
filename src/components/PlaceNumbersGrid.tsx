import React from 'react';
import { Bet } from '../types';
import { ChipGraphic } from './ChipGraphic';
import { isBetWorking, formatMoney } from '../utils/crapsEngine';

interface PlaceNumbersGridProps {
  point: number | null;
  bets: Bet[];
  placeWorkingOnComeOut?: boolean;
  hardsWorking?: boolean;
  onPlaceBet: (type: Bet['type'], targetNumber?: number) => void;
  onToggleComeOddsWorking?: (num: number) => void;
  onToggleBetWorking?: (betId: string) => void;
  onRemoveBet?: (bet: Bet) => void;
  onDragStartBet?: (e: React.DragEvent, bet: Bet) => void;
  onPointerDownBet?: (e: React.PointerEvent, bet: Bet) => void;
  onDropOnTarget?: (e: React.DragEvent, targetType: Bet['type'], targetNumber?: number) => void;
  draggingBetId?: string;
}

const ODDS_LABEL: Record<number, string> = {
  2: '11:2',
  3: '11:4',
  4: '9:5',
  5: '7:5',
  6: '7:6',
  8: '7:6',
  9: '7:5',
  10: '9:5',
  11: '11:4',
  12: '11:2',
};

export const PlaceNumbersGrid: React.FC<PlaceNumbersGridProps> = ({
  point,
  bets,
  placeWorkingOnComeOut = false,
  hardsWorking = false,
  onPlaceBet,
  onToggleComeOddsWorking,
  onToggleBetWorking,
  onRemoveBet,
  onDragStartBet,
  onPointerDownBet,
  onDropOnTarget,
  draggingBetId,
}) => {
  const topRow = [2, 3, 4, 5, 6];
  const bottomRow = [8, 9, 10, 11, 12];

  const renderCard = (num: number) => {
    const isPoint = point === num;
    const placeBet = bets.find((b) => b.type === 'PLACE' && b.targetNumber === num);
    const comeTravelBet = bets.find((b) => b.type === 'COME_BET_TRAVEL' && b.targetNumber === num);
    const comeOddsBet = bets.find((b) => b.type === 'COME_ODDS' && b.targetNumber === num);

    const isPlaceWorking = placeBet
      ? isBetWorking(placeBet, point, placeWorkingOnComeOut, hardsWorking)
      : false;

    return (
      <div
        key={num}
        data-bet-target="PLACE"
        data-target-number={num}
        onClick={() => onPlaceBet('PLACE', num)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => onDropOnTarget?.(e, 'PLACE', num)}
        className={`relative bg-[#101f17] border rounded-xl p-1 sm:p-2 flex flex-col justify-between items-center transition-all cursor-pointer select-none min-h-[68px] sm:min-h-[76px] ${
          isPoint
            ? 'border-yellow-400 ring-2 ring-yellow-400/60 bg-amber-500/10 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
            : 'border-[#1e3928] hover:border-amber-500/50 hover:bg-[#14261c]'
        }`}
        title={
          placeBet
            ? `Place Bet $${formatMoney(placeBet.amount)} on ${num} (${isPlaceWorking ? 'WORKING/ON' : 'OFF'}). Click pill to toggle.`
            : `Place Bet on ${num}`
        }
      >
        {/* ON Badge if Point matches */}
        {isPoint && (
          <div className="absolute top-1 left-1 bg-yellow-400 text-amber-950 text-[8px] sm:text-[9px] font-black px-1 py-0.2 rounded shadow uppercase tracking-wider z-10">
            ON
          </div>
        )}

        {/* Come Bet Traveled in UPPER RIGHT Corner with attached tiny ODDS Box */}
        {comeTravelBet && comeTravelBet.id !== draggingBetId && (
          <div className="absolute top-1 right-1 flex flex-col items-center space-y-0.5 z-20">
            {/* Traveled Come Flat Bet Badge (Locked) */}
            <div
              className="bg-emerald-950/95 border border-emerald-400/90 rounded p-0.5 flex flex-col items-center shadow-md select-none cursor-not-allowed"
              title="Traveled Come Bet (Locked)"
            >
              <div className="flex items-center space-x-0.5">
                <span className="text-[6px] sm:text-[7px] font-black text-emerald-300 uppercase leading-none">COME</span>
                <span className="text-[7px]" title="Locked">🔒</span>
              </div>
              <ChipGraphic amount={comeTravelBet.amount} size="sm" />
            </div>

            {/* Tiny ODDS box below the traveled Come chip */}
            {(() => {
              const isOddsWorking = comeOddsBet
                ? isBetWorking(comeOddsBet, point, placeWorkingOnComeOut, hardsWorking)
                : false;

              return (
                <div
                  data-bet-target="COME_ODDS"
                  data-target-number={num}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaceBet('COME_ODDS', num);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    onDropOnTarget?.(e, 'COME_ODDS', num);
                  }}
                  className={`px-1 py-0.5 border rounded flex flex-col items-center justify-center cursor-pointer transition-all ${
                    comeOddsBet
                      ? isOddsWorking
                        ? 'bg-amber-500/35 border-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.5)]'
                        : 'bg-zinc-900/90 border-zinc-600 opacity-80'
                      : 'bg-[#0f2418] border-amber-400/80 hover:bg-amber-500/20'
                  }`}
                  title={
                    comeOddsBet
                      ? `Come Odds on ${num} (${isOddsWorking ? 'WORKING/ON' : 'OFF'}). Click pill to toggle.`
                      : `Place Come Odds on ${num}`
                  }
                >
                  <div className="flex items-center space-x-0.5">
                    <span className="text-[6px] sm:text-[7px] font-black text-amber-300 uppercase leading-none">
                      ODDS
                    </span>
                    {comeOddsBet && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (comeOddsBet && onToggleBetWorking) {
                            onToggleBetWorking(comeOddsBet.id);
                          } else {
                            onToggleComeOddsWorking?.(num);
                          }
                        }}
                        className={`text-[6px] font-black leading-none px-0.5 rounded cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
                          isOddsWorking ? 'bg-emerald-500 text-black' : 'bg-red-900 text-red-200'
                        }`}
                        title="Click to toggle ON/OFF"
                      >
                        {isOddsWorking ? 'ON' : 'OFF'}
                      </button>
                    )}
                  </div>
                  {comeOddsBet && comeOddsBet.id !== draggingBetId ? (
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        onDragStartBet?.(e, comeOddsBet);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onPointerDownBet?.(e, comeOddsBet);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (comeOddsBet && onRemoveBet) onRemoveBet(comeOddsBet);
                      }}
                      className="mt-0.5 cursor-grab active:cursor-grabbing touch-none"
                    >
                      <ChipGraphic amount={comeOddsBet.amount} size="sm" />
                    </div>
                  ) : (
                    <span className="text-[6px] text-amber-400/80 font-black leading-none mt-0.5">+</span>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Large Number Header */}
        <span className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">{num}</span>

        {/* Place Bet Chip Stack & OFF/ON Badge */}
        <div className="my-0.5 h-5 flex items-center justify-center relative">
          {placeBet && placeBet.id !== draggingBetId && (
            <div className="relative flex items-center justify-center">
              <div
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStartBet?.(e, placeBet);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPointerDownBet?.(e, placeBet);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (placeBet && onRemoveBet) onRemoveBet(placeBet);
                }}
                className="cursor-grab active:cursor-grabbing touch-none"
              >
                <ChipGraphic amount={placeBet.amount} size="sm" />
              </div>

              {!isPlaceWorking ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (placeBet && onToggleBetWorking) {
                      onToggleBetWorking(placeBet.id);
                    }
                  }}
                  className="absolute -top-2.5 -right-3 bg-red-950 border border-red-500 text-red-200 text-[8px] font-black px-1 py-0.2 rounded shadow-[0_0_6px_rgba(239,68,68,0.7)] z-30 uppercase tracking-tighter cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                  title="Click to turn bet ON"
                >
                  OFF
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (placeBet && onToggleBetWorking) {
                      onToggleBetWorking(placeBet.id);
                    }
                  }}
                  className="absolute -top-2.5 -right-3 bg-emerald-500 text-emerald-950 text-[8px] font-black px-1 py-0.2 rounded shadow-[0_0_6px_rgba(52,211,153,0.8)] z-30 uppercase tracking-tighter cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                  title="Click to turn bet OFF"
                >
                  ON
                </button>
              )}
            </div>
          )}
        </div>

        {/* Odds Pay Ratio */}
        <span className="text-[9px] sm:text-[10px] font-bold text-amber-400/90 tracking-wide">
          {ODDS_LABEL[num]}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full my-2 space-y-2 select-none">
      {/* Top Row: 2, 3, 4, 5, 6 */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">{topRow.map(renderCard)}</div>

      {/* Bottom Row: 8, 9, 10, 11, 12 */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">{bottomRow.map(renderCard)}</div>
    </div>
  );
};
