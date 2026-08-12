import React from 'react';

interface ChipGraphicProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  count?: number;
  isClear?: boolean;
}

export const CHIP_COLORS: Record<number, { bg: string; text: string; border: string; accent: string }> = {
  1: { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-300', accent: '#cbd5e1' },
  5: { bg: 'bg-red-700', text: 'text-white', border: 'border-red-400', accent: '#f87171' },
  25: { bg: 'bg-emerald-700', text: 'text-white', border: 'border-emerald-400', accent: '#34d399' },
  100: { bg: 'bg-zinc-900', text: 'text-white', border: 'border-amber-400', accent: '#fbbf24' },
  500: { bg: 'bg-purple-800', text: 'text-white', border: 'border-purple-400', accent: '#c084fc' },
  1000: { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-300', accent: '#fef08a' },
  5000: { bg: 'bg-pink-700', text: 'text-white', border: 'border-pink-300', accent: '#f472b6' },
};

export const getChipStyle = (amount: number) => {
  if (CHIP_COLORS[amount]) return CHIP_COLORS[amount];
  if (amount >= 5000) return CHIP_COLORS[5000];
  if (amount >= 1000) return CHIP_COLORS[1000];
  if (amount >= 500) return CHIP_COLORS[500];
  if (amount >= 100) return CHIP_COLORS[100];
  if (amount >= 25) return CHIP_COLORS[25];
  if (amount >= 5) return CHIP_COLORS[5];
  return CHIP_COLORS[1];
};

export const ChipGraphic: React.FC<ChipGraphicProps> = ({
  amount,
  size = 'md',
  selected = false,
  onClick,
  count,
  isClear = false,
}) => {
  const chipStyle = isClear
    ? {
        bg: 'bg-cyan-950/40 backdrop-blur-md',
        text: 'text-amber-300 font-black',
        border: 'border-amber-300/90',
        accent: '#fde047',
      }
    : getChipStyle(amount);

  const sizeClasses = {
    sm: 'w-5 h-5 text-[8px] border-[1.5px]',
    md: 'w-7.5 h-7.5 sm:w-8 sm:h-8 text-[10px] sm:text-xs border-2',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm border-[3px]',
  }[size];

  // Format numbers (e.g. $1k, $5k, or $1.25, $12.33)
  const formatAmount = (val: number) => {
    const rounded = Math.round(val * 100) / 100;
    if (rounded >= 1000) {
      const inK = rounded / 1000;
      const roundedK = Math.round(inK * 100) / 100;
      return `$${roundedK}k`;
    }
    if (rounded % 1 !== 0) {
      return `$${rounded.toFixed(2)}`;
    }
    return `$${rounded}`;
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center font-bold rounded-full select-none transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${sizeClasses} ${chipStyle.bg} ${chipStyle.text} ${chipStyle.border} ${
        selected ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''
      }`}
      style={{
        boxShadow: isClear
          ? '0 0 12px rgba(245, 158, 11, 0.6), inset 0 2px 4px rgba(255,255,255,0.4)'
          : selected
          ? '0 0 15px rgba(234, 179, 8, 0.7), inset 0 2px 4px rgba(255,255,255,0.4)'
          : '0 4px 6px -1px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
      }}
    >
      {/* Striped Edge Accents */}
      <div
        className={`absolute inset-0 rounded-full border border-dashed pointer-events-none ${
          isClear ? 'border-amber-300/70' : 'border-white/40'
        }`}
      />

      {/* Inner Ring */}
      <div
        className={`w-[78%] h-[78%] rounded-full border flex items-center justify-center ${
          isClear
            ? 'border-amber-300/60 bg-black/40 backdrop-blur-sm'
            : 'border-white/30 bg-black/20 backdrop-blur-[1px]'
        }`}
      >
        <span
          className={`font-extrabold ${
            isClear
              ? 'text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]'
              : 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'
          }`}
        >
          {formatAmount(amount)}
        </span>
      </div>

      {/* Stack Count Badge */}
      {count && count > 1 && (
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border border-black shadow-md z-20">
          x{count}
        </span>
      )}
    </div>
  );
};
