export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface DiceRoll {
  die1: DieValue;
  die2: DieValue;
  total: number;
  timestamp: number;
  isHardway?: boolean;
}

export type CraplessPoint = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12;

export interface Bet {
  id: string;
  type: BetType;
  targetNumber?: number; // For Place, Come, Hardways, etc.
  hopDice?: [DieValue, DieValue]; // For Hop bets (e.g., [2, 3], [4, 4])
  amount: number;
  isLocked?: boolean; // Locked after come out (e.g., Pass Line, ATS)
  working?: boolean; // Is bet working on come out?
}

export type BetType =
  | 'PASS_LINE'
  | 'PASS_ODDS'
  | 'COME'
  | 'COME_BET_TRAVEL' // Come bet sitting on a number
  | 'COME_ODDS'
  | 'FIELD'
  | 'PLACE'
  | 'ATS_SMALL'
  | 'ATS_ALL'
  | 'ATS_TALL'
  | 'HARD_4'
  | 'HARD_6'
  | 'HARD_8'
  | 'HARD_10'
  | 'HORN'
  | 'ANY_7'
  | 'ANY_CRAPS'
  | 'HOP';

export interface AtsState {
  smallHits: Set<number>; // 2, 3, 4, 5, 6
  tallHits: Set<number>;  // 8, 9, 10, 11, 12
  allHits: Set<number>;   // 2, 3, 4, 5, 6, 8, 9, 10, 11, 12
  smallWon: boolean;
  tallWon: boolean;
  allWon: boolean;
}

export interface RollResultOutcome {
  roll: DiceRoll;
  payouts: PayoutDetail[];
  totalPayout: number;
  totalLoss: number;
  netChange: number;
  pointChanged: {
    prevPoint: number | null;
    newPoint: number | null;
  };
  messages: string[];
}

export interface PayoutDetail {
  betType: BetType;
  targetNumber?: number;
  betAmount: number;
  payoutAmount: number; // Profit
  message: string;
}

export interface GameStats {
  totalRolls: number;
  totalWins: number;
  totalLosses: number;
  biggestWin: number;
  rollDistribution: Record<number, number>;
  sevenOutCount: number;
  atsSmallHitsCount: number;
  atsTallHitsCount: number;
  atsAllHitsCount: number;
}
