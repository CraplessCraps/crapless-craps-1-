import React from 'react';
import { X, Dices, Award, TrendingUp } from 'lucide-react';
import { DiceRoll, GameStats } from '../types';

interface RollHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DiceRoll[];
  stats: GameStats;
}

export const RollHistoryModal: React.FC<RollHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  stats,
}) => {
  if (!isOpen) return null;

  const values = Object.values(stats.rollDistribution) as number[];
  const maxFreq = values.length > 0 ? Math.max(...values, 1) : 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1913] border border-[#1e3928] w-full max-w-2xl rounded-3xl p-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1c3626]">
          <div className="flex items-center space-x-2">
            <Dices className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-amber-300 tracking-wider">ROLL ANALYTICS & STATS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-[#122319] border border-[#203f2c] rounded-2xl p-3 flex flex-col">
            <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Rolls</span>
            <span className="text-xl font-extrabold text-white mt-1">{stats.totalRolls}</span>
          </div>

          <div className="bg-[#122319] border border-[#203f2c] rounded-2xl p-3 flex flex-col">
            <span className="text-[11px] text-zinc-400 uppercase font-semibold">Biggest Win</span>
            <span className="text-xl font-extrabold text-emerald-400 mt-1">${stats.biggestWin.toLocaleString()}</span>
          </div>

          <div className="bg-[#122319] border border-[#203f2c] rounded-2xl p-3 flex flex-col">
            <span className="text-[11px] text-zinc-400 uppercase font-semibold">Seven Outs</span>
            <span className="text-xl font-extrabold text-red-400 mt-1">{stats.sevenOutCount}</span>
          </div>

          <div className="bg-[#122319] border border-[#203f2c] rounded-2xl p-3 flex flex-col">
            <span className="text-[11px] text-zinc-400 uppercase font-semibold">ATS Completed</span>
            <span className="text-xl font-extrabold text-amber-300 mt-1">
              {stats.atsSmallHitsCount + stats.atsTallHitsCount + stats.atsAllHitsCount}
            </span>
          </div>
        </div>

        {/* Dice Sum Distribution Chart (2 to 12) */}
        <div className="bg-[#122218] border border-[#203f2b] rounded-2xl p-4 my-2">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
              DICE ROLL FREQUENCY DISTRIBUTION
            </span>
          </div>

          <div className="flex items-end justify-between h-36 gap-1 pt-4 px-2">
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
              const count = stats.rollDistribution[num] || 0;
              const heightPct = Math.round((count / maxFreq) * 100);

              return (
                <div key={num} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded transition-opacity pointer-events-none">
                    {count}x
                  </div>

                  <div className="w-full bg-[#1b3425] rounded-t-lg h-28 flex items-end justify-center p-0.5">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        num === 7
                          ? 'bg-red-500'
                          : [2, 12].includes(num)
                          ? 'bg-purple-500'
                          : 'bg-amber-400'
                      }`}
                      style={{ height: `${Math.max(heightPct, 5)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-300 mt-1">{num}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Roll Log */}
        <div className="mt-3">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
              RECENT ROLLS ({history.length})
            </span>
          </div>

          <div className="bg-[#122218] border border-[#203f2b] rounded-2xl p-3 max-h-40 overflow-y-auto space-y-1.5">
            {history.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center py-4">No rolls recorded yet.</p>
            ) : (
              history.slice(0, 20).map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[#172d20] border border-[#22422f]"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-zinc-400">#{history.length - i}</span>
                    <span className="font-mono text-white">
                      [{r.die1}] + [{r.die2}]
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-black px-2 py-0.5 rounded ${
                        r.total === 7
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      Total: {r.total}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
