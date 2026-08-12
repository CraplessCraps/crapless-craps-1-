import React from 'react';
import { ChipGraphic } from './ChipGraphic';

interface ChipSelectorProps {
  selectedChip: number;
  onSelectChip: (amount: number) => void;
  onDragStartChip?: (e: React.DragEvent, amount: number) => void;
  onPointerDownChip?: (e: React.PointerEvent, amount: number) => void;
}

const CHIP_DENOMINATIONS = [1, 5, 25, 100, 500, 1000, 5000];

export const ChipSelector: React.FC<ChipSelectorProps> = ({
  selectedChip,
  onSelectChip,
  onDragStartChip,
  onPointerDownChip,
}) => {
  return (
    <div
      data-rack="true"
      className="w-full py-2 px-3 flex items-center justify-center space-x-2 sm:space-x-3 overflow-x-auto no-scrollbar select-none"
    >
      {CHIP_DENOMINATIONS.map((amount) => (
        <div
          key={amount}
          draggable
          onDragStart={(e) => onDragStartChip?.(e, amount)}
          onPointerDown={(e) => onPointerDownChip?.(e, amount)}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <ChipGraphic
            amount={amount}
            size="md"
            selected={selectedChip === amount}
            onClick={() => onSelectChip(amount)}
          />
        </div>
      ))}
    </div>
  );
};
