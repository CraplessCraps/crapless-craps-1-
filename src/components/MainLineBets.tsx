import React from 'react';
import { Bet } from '../types';
import { ChipGraphic } from './ChipGraphic';
import { isBetWorking, formatMoney } from '../utils/crapsEngine';

interface MainLineBetsProps {
  point: number | null;
  bets: Bet[];
  placeWorkingOnComeOut?: boolean;
  hardsWorking?: boolean;
  onPlaceBet: (type: 'PASS_LINE' | 'PASS_ODDS' | 'FIELD' | 'COME') => void;
  onToggleBetWorking?: (betId: string) => void;
  onRemoveBet?: (bet: Bet) => void;
  onDragStartBet?: (e: React.DragEvent, bet: Bet) => void;
  onPointerDownBet?: (e: React.PointerEvent, bet: Bet) => void;
  onDropOnTarget?: (e: React.DragEvent, targetType: Bet['type']) => void;
  draggingBetId?: string;
}

export const MainLineBets: React.FC<MainLineBetsProps> = ({
  point,
  bets,
  placeWorkingOnComeOut = false,
  hardsWorking = false,
  onPlaceBet,
  onToggleBetWorking,
  onRemoveBet,
  onDragStartBet,
  onPointerDownBet,
  onDropOnTarget,
  draggingBetId,
}) => {
  const passBet = bets.find((b) => b.type === 'PASS_LINE');
  const oddsBet = bets.find((b) => b.type === 'PASS_ODDS');
  const fieldBet = bets.find((b) => b.type === 'FIELD');
  const comeBet = bets.find((b) => b.type === 'COME');

  const isFieldWorking = fieldBet ? isBetWorking(fieldBet, point, placeWorkingOnComeOut, hardsWorking) : false;

  return (
    <div className="w-full my-1.5 flex flex-row items-stretch gap-1.5 select-none">
      {/* 1. PASS LINE & ODDS (Combined Compact Group) */}
      <div className="flex-1 flex flex-row gap-1 bg-[#0d1812] border border-[#1b3425] rounded-xl p-1.5 items-stretch min-h-[62px]">
        {/* Pass Line Half-sized Box */}
        <div
          data-bet-target="PASS_LINE"
          onClick={() => onPlaceBet('PASS_LINE')}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => onDropOnTarget?.(e, 'PASS_LINE')}
          className={`flex-1 rounded-lg p-1 flex flex-col items-center justify-between cursor-pointer transition-all ${
            passBet
              ? 'bg-emerald-950/40 border border-emerald-400/80'
              : 'hover:bg-[#13241b]'
          }`}
        >
          <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider leading-none">
            PASS LINE
          </span>
          <div className="h-5 flex items-center justify-center my-0.5">
            {passBet && passBet.id !== draggingBetId ? (
              <div
                draggable={point === null}
                onDragStart={(e) => {
                  if (point !== null) return;
                  e.stopPropagation();
                  onDragStartBet?.(e, passBet);
                }}
                onPointerDown={(e) => {
                  if (point !== null) return;
                  e.stopPropagation();
                  onPointerDownBet?.(e, passBet);
                }}
                className={`relative ${
                  point === null ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'
                } touch-none`}
              >
                <ChipGraphic amount={passBet.amount} size="sm" />
                {point !== null && (
                  <span className="absolute -top-1 -right-1 text-[9px]" title="Pass Line Locked during Point">
                    🔒
                  </span>
                )}
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-dashed border-zinc-600/60" />
            )}
          </div>
          <span className="text-[8px] font-bold text-zinc-400 leading-none">1:1</span>
        </div>

        {/* Dedicated Little Odds Square */}
        <div
          data-bet-target="PASS_ODDS"
          onClick={() => onPlaceBet('PASS_ODDS')}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => onDropOnTarget?.(e, 'PASS_ODDS')}
          className={`w-12 sm:w-16 rounded-lg p-1 border flex flex-col items-center justify-between cursor-pointer transition-all ${
            point === null
              ? 'opacity-40 pointer-events-none border-zinc-800 bg-[#08100c]'
              : oddsBet
              ? 'bg-amber-500/20 border-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.3)]'
              : 'border-amber-400/60 bg-[#0a140e] hover:bg-[#13241b]'
          }`}
          title="Pass Odds"
        >
          <span className="text-[9px] sm:text-[10px] font-black text-amber-300 uppercase leading-none">
            ODDS
          </span>
          <div className="h-5 flex items-center justify-center my-0.5">
            {oddsBet && oddsBet.id !== draggingBetId ? (
              <div
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStartBet?.(e, oddsBet);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPointerDownBet?.(e, oddsBet);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (oddsBet && onRemoveBet) onRemoveBet(oddsBet);
                }}
                className="cursor-grab active:cursor-grabbing touch-none"
              >
                <ChipGraphic amount={oddsBet.amount} size="sm" />
              </div>
            ) : (
              <span className="text-[9px] font-black text-amber-400/80 leading-none">+</span>
            )}
          </div>
          <span className="text-[7px] text-zinc-400 leading-none">Up to 10X</span>
        </div>
      </div>

      {/* 2. THE FIELD BOX */}
      <div
        data-bet-target="FIELD"
        onClick={() => onPlaceBet('FIELD')}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => onDropOnTarget?.(e, 'FIELD')}
        className={`relative flex-1 bg-[#0d1812] border rounded-xl p-1.5 flex flex-col items-center justify-between cursor-pointer transition-all min-h-[62px] ${
          fieldBet
            ? 'border-yellow-400/80 bg-amber-500/10'
            : 'border-[#1b3425] hover:border-amber-500/50 hover:bg-[#13241b]'
        }`}
        title={
          fieldBet
            ? `Field Bet $${formatMoney(fieldBet.amount)}`
            : `Place Field Bet`
        }
      >
        <span className="text-[10px] sm:text-xs font-black text-yellow-300 uppercase tracking-wider leading-none">
          FIELD
        </span>
        <div className="text-[8px] font-extrabold text-amber-200/90 text-center leading-tight my-0.5">
          2<span className="text-[7px] text-zinc-400">(2:1)</span> <span className="text-white font-black">3·4·9·10·11</span> 12<span className="text-[7px] text-zinc-400">(2:1)</span>
        </div>
        <div className="h-5 flex items-center justify-center relative">
          {fieldBet && fieldBet.id !== draggingBetId ? (
            <div className="relative flex items-center justify-center">
              <div
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStartBet?.(e, fieldBet);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPointerDownBet?.(e, fieldBet);
                }}
                className="cursor-grab active:cursor-grabbing touch-none"
              >
                <ChipGraphic amount={fieldBet.amount} size="sm" />
              </div>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed border-zinc-600/60" />
          )}
        </div>
      </div>

      {/* 3. COME BOX */}
      <div
        data-bet-target="COME"
        onClick={() => onPlaceBet('COME')}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => onDropOnTarget?.(e, 'COME')}
        className={`w-20 sm:w-28 bg-[#0d1812] border rounded-xl p-1.5 flex flex-col items-center justify-between cursor-pointer transition-all min-h-[62px] ${
          comeBet
            ? 'border-emerald-500/80 bg-emerald-950/20'
            : 'border-[#1b3425] hover:border-amber-500/50 hover:bg-[#13241b]'
        }`}
      >
        <span className="text-[10px] sm:text-xs font-black text-emerald-300 uppercase tracking-wider leading-none">
          COME
        </span>
        <span className="text-[8px] font-bold text-zinc-400 leading-none my-0.5">7 Wins</span>
        <div className="h-5 flex items-center justify-center">
          {comeBet && comeBet.id !== draggingBetId ? (
            <div
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStartBet?.(e, comeBet);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDownBet?.(e, comeBet);
              }}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <ChipGraphic amount={comeBet.amount} size="sm" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed border-zinc-600/60" />
          )}
        </div>
      </div>
    </div>
  );
};
