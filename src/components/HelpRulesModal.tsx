import React from 'react';
import { X, HelpCircle, ShieldAlert, Sparkles, Zap, Award, ShieldCheck, ExternalLink, Scale } from 'lucide-react';

interface HelpRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenUmpConsent?: () => void;
}

export const HelpRulesModal: React.FC<HelpRulesModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacyPolicy,
  onOpenUmpConsent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1812] border border-[#1d3928] w-full max-w-2xl rounded-3xl p-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1c3626]">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-amber-300 tracking-wider">CRAPLESS CRAPS GUIDE & RULES</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Core Crapless Craps Rules */}
        <div className="bg-[#122218] border border-[#203e2b] rounded-2xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>HOW CRAPLESS CRAPS WORKS</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            In Crapless Craps, <strong className="text-yellow-300">you cannot crap out on the Come Out roll</strong>.
            If a <strong>7</strong> rolls on the Come Out roll, Pass Line bets win 1:1.
            If ANY other total rolls (<strong>2, 3, 4, 5, 6, 8, 9, 10, 11, or 12</strong>), that number becomes the <strong className="text-yellow-300">Point</strong>!
          </p>
          <ul className="text-xs text-zinc-300 list-disc list-inside space-y-1 pt-1">
            <li>Once a Point is set, roll that Point again before a <strong>7</strong> to win!</li>
            <li>Rolling a 7 after a Point is set results in a <strong>Seven Out</strong> (Pass Line & Place bets lose).</li>
          </ul>
        </div>

        {/* 2. ATS Bonus (All, Tall, Small) */}
        <div className="bg-[#122218] border border-[#203e2b] rounded-2xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ATS BONUS (ALL, TALL, SMALL)</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            The ATS Bonus is a popular side wager split into three options:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
            <div className="bg-[#182a1f] p-2.5 rounded-xl border border-[#274533]">
              <div className="font-extrabold text-emerald-300">ALL SMALL (2, 3, 4, 5, 6)</div>
              <div className="text-zinc-400 text-[11px] mt-1">Roll all 5 small numbers before a 7. Pays <strong className="text-amber-300">30 to 1</strong>.</div>
            </div>

            <div className="bg-[#182a1f] p-2.5 rounded-xl border border-[#274533]">
              <div className="font-extrabold text-yellow-300">MAKE 'EM ALL (2 through 12)</div>
              <div className="text-zinc-400 text-[11px] mt-1">Roll all 10 target numbers before a 7. Pays <strong className="text-amber-300">155 to 1 (156 FOR 1)</strong>.</div>
            </div>

            <div className="bg-[#182a1f] p-2.5 rounded-xl border border-[#274533]">
              <div className="font-extrabold text-emerald-300">ALL TALL (8, 9, 10, 11, 12)</div>
              <div className="text-zinc-400 text-[11px] mt-1">Roll all 5 tall numbers before a 7. Pays <strong className="text-amber-300">30 to 1</strong>.</div>
            </div>
          </div>
          <p className="text-[11px] text-amber-300/80 italic pt-1">
            Note: Any 7 rolled resets progress and wipes out un-won ATS bets!
          </p>
        </div>

        {/* 3. Place Bet Payouts */}
        <div className="bg-[#122218] border border-[#203e2b] rounded-2xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-sm">
            <Award className="w-4 h-4 text-amber-400" />
            <span>PLACE BET PAYOUTS</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-center font-bold">
            <div className="bg-[#182a1f] p-2 rounded-xl border border-[#274533]">
              <span className="text-white block text-sm">2 & 12</span>
              <span className="text-amber-400">11 : 2</span>
            </div>
            <div className="bg-[#182a1f] p-2 rounded-xl border border-[#274533]">
              <span className="text-white block text-sm">3 & 11</span>
              <span className="text-amber-400">11 : 4</span>
            </div>
            <div className="bg-[#182a1f] p-2 rounded-xl border border-[#274533]">
              <span className="text-white block text-sm">4 & 10</span>
              <span className="text-amber-400">9 : 5</span>
            </div>
            <div className="bg-[#182a1f] p-2 rounded-xl border border-[#274533]">
              <span className="text-white block text-sm">5 & 9</span>
              <span className="text-amber-400">7 : 5</span>
            </div>
            <div className="bg-[#182a1f] p-2 rounded-xl border border-[#274533]">
              <span className="text-white block text-sm">6 & 8</span>
              <span className="text-amber-400">7 : 6</span>
            </div>
          </div>
        </div>

        {/* 4. Quick Press Controls */}
        <div className="bg-[#122218] border border-[#203e2b] rounded-2xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-sm">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>QUICK PRESS BUTTONS</span>
          </div>
          <p className="text-xs text-zinc-300">
            Use the Press bar above the numbers to quickly place or increase bets on groups of numbers using your selected chip denomination:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div><strong className="text-yellow-300">ACROSS:</strong> Places bets on all 10 numbers (2-12).</div>
            <div><strong className="text-yellow-300">EXTREMES:</strong> Places bets on 2, 3, 11, 12.</div>
            <div><strong className="text-yellow-300">OUTSIDE:</strong> Places bets on 2, 3, 4, 10, 11, 12.</div>
            <div><strong className="text-yellow-300">INSIDE:</strong> Places bets on 5, 6, 8, 9.</div>
          </div>
        </div>

        {/* 5. Privacy Policy & Ad Preferences */}
        <div className="bg-[#122218] border border-[#203e2b] rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-300 font-extrabold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PRIVACY & AD PREFERENCES</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Manage your in-app privacy policy options, review local data storage policies, or update your Google UMP ad personalization choices.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {onOpenPrivacyPolicy && (
              <button
                onClick={onOpenPrivacyPolicy}
                className="flex-1 py-2 px-3 bg-[#1c3826] hover:bg-[#254a33] text-emerald-300 font-bold text-xs rounded-xl border border-[#2e593d] flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>View Privacy Policy</span>
              </button>
            )}
            {onOpenUmpConsent && (
              <button
                onClick={onOpenUmpConsent}
                className="flex-1 py-2 px-3 bg-[#1c3826] hover:bg-[#254a33] text-amber-300 font-bold text-xs rounded-xl border border-[#2e593d] flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Ad Consent Choices (UMP)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
