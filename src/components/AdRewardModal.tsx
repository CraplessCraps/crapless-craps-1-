import React, { useState } from 'react';
import { Sparkles, Tv, X } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { ADMOB_CONFIG, showRewardedAd } from '../utils/admob';

interface AdRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (amount: number) => void;
}

export const AdRewardModal: React.FC<AdRewardModalProps> = ({
  isOpen,
  onClose,
  onReward,
}) => {
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  if (!isOpen) return null;

  const handleWatchAd = async () => {
    setIsWatching(true);
    setProgress(0);

    await showRewardedAd(
      (amount) => {
        setIsWatching(false);
        soundManager.playWin();
        onReward(amount);
        onClose();
      },
      (prog) => setProgress(prog)
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0e1b14] border-2 border-amber-500/60 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative text-center">
        {/* Close button */}
        {!isWatching && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 bg-amber-500/20 border border-amber-400/50 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner">
            <Tv className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-black text-amber-300 tracking-wider uppercase mb-1">
          {isWatching ? 'Watching Ad...' : 'REFRESH CHIPS'}
        </h3>

        {!isWatching ? (
          <>
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              Watch a quick video ad to reload your bankroll and get back in the action!
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleWatchAd}
                className="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:brightness-110 text-amber-950 font-black py-3.5 px-4 rounded-xl text-xs sm:text-sm tracking-wider uppercase shadow-lg border border-yellow-200 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-950 animate-bounce" />
                  <span>WATCH VIDEO AD</span>
                </div>
                <span className="text-amber-950 font-black text-sm bg-yellow-200/60 px-2 py-0.5 rounded-md">
                  + ${ADMOB_CONFIG.REWARD_CHIP_AMOUNT.toLocaleString()}
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-4 text-xs font-bold text-zinc-400 hover:text-zinc-200 uppercase tracking-wide"
            >
              Maybe Later
            </button>
          </>
        ) : (
          <div className="py-4 space-y-3">
            <p className="text-xs text-amber-200 font-bold">
              Playing Ad... (+${ADMOB_CONFIG.REWARD_CHIP_AMOUNT.toLocaleString()} Chips)
            </p>

            <div className="w-full bg-zinc-800 rounded-full h-3 p-0.5 border border-zinc-700">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-100 shadow"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="text-[10px] text-zinc-400 font-mono">
              {progress}% Completed
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

