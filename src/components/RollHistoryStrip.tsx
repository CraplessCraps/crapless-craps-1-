import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DiceRoll, DieValue } from '../types';

interface RollHistoryStripProps {
  rollHistory: DiceRoll[];
}

// 3x3 Grid positions for dice values 1..6
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

const MiniDieFace: React.FC<{ value?: DieValue }> = ({ value = 1 }) => {
  const safeVal = Math.min(6, Math.max(1, Math.floor(value || 1)));
  const dots = DIE_DOT_POSITIONS[safeVal] || DIE_DOT_POSITIONS[1];

  return (
    <div className="w-3.5 h-3.5 bg-gradient-to-br from-red-500 via-red-600 to-red-800 rounded-[3px] p-[1px] shadow border border-red-300/40 flex items-center justify-center relative select-none shrink-0">
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px]">
        {dots.map((pos, idx) => (
          <div key={idx} className={`${pos} w-0.5 h-0.5 bg-white rounded-full place-self-center shadow-inner`} />
        ))}
      </div>
    </div>
  );
};

const RollPill: React.FC<{ roll: DiceRoll; isLatest: boolean }> = ({ roll, isLatest }) => {
  if (!roll || typeof roll.die1 !== 'number' || typeof roll.die2 !== 'number') {
    return null;
  }

  const total = roll.die1 + roll.die2;

  let pillBorderClass = 'bg-[#122218] border-[#223f2b] hover:border-emerald-500/60';
  if (total === 7) {
    pillBorderClass = 'bg-[#2b1114] border-red-500/70 shadow-[0_0_6px_rgba(239,68,68,0.25)] hover:border-red-400';
  } else if (total === 2 || total === 3 || total === 11 || total === 12) {
    pillBorderClass = 'bg-[#281c11] border-amber-500/70 hover:border-amber-400';
  }

  return (
    <motion.div
      initial={isLatest ? { scale: 0.5, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      title={`Roll: ${roll.die1} + ${roll.die2} = ${total}`}
      className={`h-6 px-1.5 rounded-md border flex items-center space-x-1 shrink-0 select-none shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-pointer ${pillBorderClass} ${
        isLatest ? 'ring-1 ring-yellow-400/80 shadow-[0_0_8px_rgba(250,204,21,0.4)]' : ''
      }`}
    >
      <MiniDieFace value={roll.die1} />
      <MiniDieFace value={roll.die2} />
    </motion.div>
  );
};

export const RollHistoryStrip: React.FC<RollHistoryStripProps> = ({ rollHistory = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Take up to 200 rolls from history (newest first: index 0 is newest)
  const limitedHistory = (rollHistory || []).slice(0, 200);

  // Auto-scroll to the far left (scrollLeft = 0) whenever a new roll arrives if user is near left
  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      if (el.scrollLeft < 120) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [limitedHistory.length]);

  // Wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (containerRef.current) {
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      containerRef.current.scrollLeft += delta * 0.8;
    }
  };

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsMouseDown(true);
    setStartX(e.clientX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !containerRef.current) return;
    e.preventDefault();
    const x = e.clientX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="w-full bg-[#0a140f] border-b border-[#1b3023] h-8 px-2 flex items-center relative overflow-hidden select-none">
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        className={`w-full h-full flex items-center overflow-x-auto scrollbar-none space-x-1.5 ${
          isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="min-w-full flex items-center justify-start space-x-1.5 px-1">
          {limitedHistory.length === 0 ? (
            <div className="text-[10px] font-bold italic text-emerald-500/40 tracking-wider">
              NO ROLLS YET
            </div>
          ) : (
            limitedHistory.map((roll, idx) => (
              <RollPill
                key={roll.timestamp ? `${roll.timestamp}-${idx}` : idx}
                roll={roll}
                isLatest={idx === 0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
