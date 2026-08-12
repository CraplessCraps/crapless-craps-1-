import React, { useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { Bet, DieValue } from '../types';
import { ChipGraphic } from './ChipGraphic';
import { HopsMatrix } from './HopsMatrix';
import { isBetWorking, formatMoney } from '../utils/crapsEngine';

interface HardsAndHornsProps {
  bets: Bet[];
  point?: number | null;
  placeWorkingOnComeOut?: boolean;
  hardsWorking: boolean;
  onToggleHardsWorking: () => void;
  onToggleBetWorking?: (betId: string) => void;
  onRemoveBet?: (bet: Bet) => void;
  onPlaceBet: (
    type: Bet['type'],
    targetNumber?: number,
    hopDice?: [DieValue, DieValue]
  ) => void;
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

// Red Die Face component for clean dice visuals matching craps felts
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
    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-700 rounded border border-red-400 shadow grid grid-cols-3 grid-rows-3 items-center justify-items-center p-0.5 select-none shrink-0">
      {(dotPositions[value] || []).map((posClass, idx) => (
        <div key={idx} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full shadow-inner ${posClass}`} />
      ))}
    </div>
  );
};

export const HardsAndHorns: React.FC<HardsAndHornsProps> = ({
  bets,
  point = null,
  placeWorkingOnComeOut = false,
  hardsWorking,
  onToggleHardsWorking,
  onToggleBetWorking,
  onRemoveBet,
  onPlaceBet,
  onDragStartBet,
  onPointerDownBet,
  onDropOnTarget,
  draggingBetId,
}) => {
  const [activeTab, setActiveTab] = useState<'HARDS_HORN' | 'HOPS'>('HARDS_HORN');

  const hard4Bet = bets.find((b) => b.type === 'HARD_4');
  const hard6Bet = bets.find((b) => b.type === 'HARD_6');
  const hard8Bet = bets.find((b) => b.type === 'HARD_8');
  const hard10Bet = bets.find((b) => b.type === 'HARD_10');

  const isSameHop = (hop1?: [DieValue, DieValue], d1?: DieValue, d2?: DieValue) => {
    if (!hop1 || d1 === undefined || d2 === undefined) return false;
    return (hop1[0] === d1 && hop1[1] === d2) || (hop1[0] === d2 && hop1[1] === d1);
  };

  const hop2Bet = bets.find((b) => b.type === 'HOP' && isSameHop(b.hopDice, 1, 1));
  const hop3Bet = bets.find((b) => b.type === 'HOP' && isSameHop(b.hopDice, 1, 2));
  const hop11Bet = bets.find((b) => b.type === 'HOP' && isSameHop(b.hopDice, 5, 6));
  const hop12Bet = bets.find((b) => b.type === 'HOP' && isSameHop(b.hopDice, 6, 6));

  const hornBet = bets.find((b) => b.type === 'HORN');
  const any7Bet = bets.find((b) => b.type === 'ANY_7');
  const anyCrapsBet = bets.find((b) => b.type === 'ANY_CRAPS');

  const renderHardCard = (type: Bet['type'], ratio: string, d1: DieValue, d2: DieValue, bet?: Bet) => {
    const isWorking = bet ? isBetWorking(bet, point, placeWorkingOnComeOut, hardsWorking) : false;

    return (
      <div
        data-bet-target={type}
        onClick={() => onPlaceBet(type)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => onDropOnTarget?.(e, type)}
        className={`relative bg-[#101f17] border rounded-xl p-2.5 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer min-h-[80px] ${
          bet ? 'border-yellow-400 bg-amber-500/10' : 'border-[#1e3928] hover:border-amber-500/50'
        }`}
        title={
          bet
            ? `Hard ${d1 + d2} $${formatMoney(bet.amount)} (${isWorking ? 'WORKING/ON' : 'OFF'}). Right-click to pull down.`
            : `Place Hard ${d1 + d2}`
        }
      >
        <div className="flex items-center space-x-1.5">
          <RedDieFace value={d1} />
          <RedDieFace value={d2} />
        </div>
        <span className="text-xs font-black text-amber-300 tracking-wide">{ratio}</span>

        {bet && bet.id !== draggingBetId && (
          <div className="relative flex items-center justify-center mt-0.5">
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
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (bet && onRemoveBet) onRemoveBet(bet);
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
                className="absolute -top-2.5 -right-3 bg-red-950 border border-red-500 text-red-200 text-[8px] font-black px-1 py-0.2 rounded shadow uppercase tracking-tighter cursor-pointer hover:scale-110 active:scale-95 transition-transform z-30"
                title="Click to turn bet ON"
              >
                OFF
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (bet && onToggleBetWorking) {
                    onToggleBetWorking(bet.id);
                  }
                }}
                className="absolute -top-2.5 -right-3 bg-emerald-500 text-emerald-950 text-[8px] font-black px-1 py-0.2 rounded shadow uppercase tracking-tighter cursor-pointer hover:scale-110 active:scale-95 transition-transform z-30"
                title="Click to turn bet OFF"
              >
                ON
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHornDiceCard = (
    d1: DieValue,
    d2: DieValue,
    ratio: string,
    bet?: Bet
  ) => {
    const isWorking = bet ? isBetWorking(bet, point, placeWorkingOnComeOut, hardsWorking) : false;

    return (
      <div
        data-bet-target="HOP"
        onClick={() => onPlaceBet('HOP', undefined, [d1, d2])}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => onDropOnTarget?.(e, 'HOP', undefined, [d1, d2])}
        className={`relative bg-[#101f17] border rounded-xl p-2.5 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer min-h-[80px] h-full ${
          bet ? 'border-yellow-400 bg-amber-500/10' : 'border-[#1e3928] hover:border-amber-500/50'
        }`}
        title={
          bet
            ? `Hop ${d1}-${d2} $${formatMoney(bet.amount)} (${isWorking ? 'WORKING/ON' : 'OFF'})`
            : `Place Hop (${d1}-${d2})`
        }
      >
        <div className="flex items-center space-x-1.5">
          <RedDieFace value={d1} />
          <RedDieFace value={d2} />
        </div>
        <span className="text-xs font-black text-amber-300 tracking-wide">{ratio}</span>

        {bet && bet.id !== draggingBetId && (
          <div className="relative flex items-center justify-center mt-0.5">
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
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (bet && onRemoveBet) onRemoveBet(bet);
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
                className="absolute -top-2.5 -right-3 bg-red-950 border border-red-500 text-red-200 text-[8px] font-black px-1 py-0.2 rounded shadow uppercase tracking-tighter cursor-pointer hover:scale-110 active:scale-95 transition-transform z-30"
                title="Click to turn bet ON"
              >
                OFF
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (bet && onToggleBetWorking) {
                    onToggleBetWorking(bet.id);
                  }
                }}
                className="absolute -top-2.5 -right-3 bg-emerald-500 text-emerald-950 text-[8px] font-black px-1 py-0.2 rounded shadow uppercase tracking-tighter cursor-pointer hover:scale-110 active:scale-95 transition-transform z-30"
                title="Click to turn bet OFF"
              >
                ON
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHornCenterCard = () => {
    return (
      <div
        data-bet-target="HORN"
        onClick={() => onPlaceBet('HORN')}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => onDropOnTarget?.(e, 'HORN')}
        className={`relative bg-[#162a1f] border rounded-xl p-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-full min-h-[110px] ${
          hornBet ? 'border-yellow-400 bg-amber-500/20' : 'border-[#274733] hover:border-amber-400/70 hover:bg-[#1c3628]'
        }`}
        title="HORN BET: Min $1"
      >
        <span className="text-sm sm:text-base font-black text-amber-300 tracking-wider uppercase">HORN</span>
        <span className="text-[10px] sm:text-xs text-amber-200 font-bold mt-1 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded">MIN $1</span>

        {hornBet && hornBet.id !== draggingBetId && (
          <div className="relative flex items-center justify-center mt-2">
            <div
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStartBet?.(e, hornBet);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDownBet?.(e, hornBet);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (hornBet && onRemoveBet) onRemoveBet(hornBet);
              }}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <ChipGraphic amount={hornBet.amount} size="sm" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPropCard = (type: Bet['type'], label: string, sublabel: string, bet?: Bet) => {
    const isWorking = bet ? isBetWorking(bet, point, placeWorkingOnComeOut, hardsWorking) : false;

    return (
      <div
        data-bet-target={type}
        onClick={() => onPlaceBet(type)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => onDropOnTarget?.(e, type)}
        className={`relative bg-[#101f17] border rounded-2xl p-3 flex flex-col items-center justify-between transition-all cursor-pointer min-h-[80px] ${
          bet ? 'border-yellow-400 bg-amber-500/10' : 'border-[#1e3928] hover:border-amber-500/50'
        }`}
        title={
          bet
            ? `${label} $${formatMoney(bet.amount)} (${isWorking ? 'WORKING/ON' : 'OFF'}). Click pill to toggle.`
            : `Place ${label}`
        }
      >
        <span className="text-xs font-black text-amber-300 uppercase tracking-tight text-center">
          {label}
        </span>
        <span className="text-[10px] text-zinc-400 font-semibold">{sublabel}</span>
        {bet && bet.id !== draggingBetId ? (
          <div className="relative flex items-center justify-center mt-0.5">
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
                className="absolute -top-2.5 -right-3 bg-red-950 border border-red-500 text-red-200 text-[8px] font-black px-1 py-0.2 rounded shadow uppercase tracking-tighter cursor-pointer hover:scale-110 active:scale-95 transition-transform z-30"
                title="Click to turn bet ON"
              >
                OFF
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (bet && onToggleBetWorking) {
                    onToggleBetWorking(bet.id);
                  }
                }}
                className="absolute -top-2.5 -right-3 bg-emerald-500 text-emerald-950 text-[8px] font-black px-1 py-0.2 rounded shadow uppercase tracking-tighter cursor-pointer hover:scale-110 active:scale-95 transition-transform z-30"
                title="Click to turn bet OFF"
              >
                ON
              </button>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-zinc-600">Tap / Drag Chip</span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#0d1712] border border-[#1b3224] rounded-2xl p-3 shadow-xl select-none my-3">
      {/* Top Main Tabs */}
      <div className="flex items-center justify-between mb-3 gap-1.5 flex-wrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('HARDS_HORN')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'HARDS_HORN'
                ? 'bg-amber-400 text-amber-950 border border-yellow-300 shadow-md'
                : 'bg-[#14241b] text-zinc-400 hover:text-white border border-[#213a2b]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>HARDS & HORN</span>
          </button>

          <button
            onClick={() => setActiveTab('HOPS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'HOPS'
                ? 'bg-amber-400 text-amber-950 border border-yellow-300 shadow-md'
                : 'bg-[#14241b] text-zinc-400 hover:text-white border border-[#213a2b]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>HOPS</span>
          </button>
        </div>
      </div>

      {activeTab === 'HARDS_HORN' ? (
        <div className="space-y-3">
          {/* SIDE BY SIDE: HARDS & HORNS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* HARDS AREA */}
            <div className="bg-[#0f1b14] border border-[#1d3527] rounded-xl p-2.5 flex flex-col">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#1b3224]">
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    HARDWAYS
                  </span>
                </div>
                {/* HARDS (ON/OFF) Toggle Button inside Hards area */}
                <button
                  onClick={onToggleHardsWorking}
                  title={hardsWorking ? 'Turn Hards OFF' : 'Turn Hards ON (Working)'}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-black tracking-wider flex items-center space-x-1 transition-all cursor-pointer ${
                    hardsWorking
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30'
                      : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:bg-zinc-700/80'
                  }`}
                >
                  <span className="uppercase font-extrabold">HARDS</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[8px] font-black uppercase ${
                      hardsWorking ? 'bg-emerald-400 text-emerald-950' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {hardsWorking ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 flex-1">
                {renderHardCard('HARD_4', '7 to 1', 2, 2, hard4Bet)}
                {renderHardCard('HARD_10', '7 to 1', 5, 5, hard10Bet)}
                {renderHardCard('HARD_6', '9 to 1', 3, 3, hard6Bet)}
                {renderHardCard('HARD_8', '9 to 1', 4, 4, hard8Bet)}
              </div>
            </div>

            {/* HORN AREA */}
            <div className="bg-[#0f1b14] border border-[#1d3527] rounded-xl p-2.5 flex flex-col">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#1b3224]">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    HORN
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 flex-1 items-stretch">
                {/* Col 1: Top-Left (1-1) & Bottom-Left (1-2) */}
                <div className="flex flex-col gap-2 h-full justify-between">
                  {renderHornDiceCard(1, 1, '30 to 1', hop2Bet)}
                  {renderHornDiceCard(1, 2, '15 to 1', hop3Bet)}
                </div>

                {/* Col 2: Center HORN Box */}
                {renderHornCenterCard()}

                {/* Col 3: Top-Right (6-6) & Bottom-Right (5-6) */}
                <div className="flex flex-col gap-2 h-full justify-between">
                  {renderHornDiceCard(6, 6, '30 to 1', hop12Bet)}
                  {renderHornDiceCard(5, 6, '15 to 1', hop11Bet)}
                </div>
              </div>
            </div>
          </div>

          {/* ANY 7 & ANY CRAPS BELOW */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {renderPropCard('ANY_7', 'ANY 7', '4:1', any7Bet)}
            {renderPropCard('ANY_CRAPS', 'ANY CRAPS', '7:1', anyCrapsBet)}
          </div>
        </div>
      ) : (
        /* HOPS TAB MATRIX */
        <HopsMatrix
          bets={bets}
          point={point}
          placeWorkingOnComeOut={placeWorkingOnComeOut}
          hardsWorking={hardsWorking}
          onToggleBetWorking={onToggleBetWorking}
          onPlaceHopBet={(d1, d2) => onPlaceBet('HOP', undefined, [d1, d2])}
          onDragStartBet={onDragStartBet}
          onPointerDownBet={onPointerDownBet}
          onDropOnTarget={onDropOnTarget}
          draggingBetId={draggingBetId}
        />
      )}
    </div>
  );
};
