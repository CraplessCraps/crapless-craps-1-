import { Bet } from '../types';

export const BASE_BET_MAX_LIMITS: Record<Bet['type'], number> = {
  PASS_LINE: 10000,
  PASS_ODDS: 100000,
  COME: 10000,
  COME_BET_TRAVEL: 10000,
  COME_ODDS: 100000,
  PLACE: 50000,
  FIELD: 100000,
  ATS_SMALL: 10000,
  ATS_TALL: 10000,
  ATS_ALL: 50000,
  HARD_4: 20000,
  HARD_6: 20000,
  HARD_8: 20000,
  HARD_10: 20000,
  HORN: 10000,
  ANY_7: 10000,
  ANY_CRAPS: 10000,
  HOP: 10000,
};

export function getBetMaxLimit(
  type: Bet['type'],
  targetNumber?: number,
  activeBets: Bet[] = []
): number {
  if (type === 'PASS_ODDS') {
    const passBet = activeBets.find((b) => b.type === 'PASS_LINE');
    const passAmt = passBet ? passBet.amount : 0;
    // Up to 10x Pass Line bet
    return Math.min(passAmt * 10, 100000);
  }

  if (type === 'COME_ODDS') {
    const comeTravel = activeBets.find(
      (b) => b.type === 'COME_BET_TRAVEL' && b.targetNumber === targetNumber
    );
    const comeAmt = comeTravel ? comeTravel.amount : 0;
    // Up to 10x Come bet on that number
    return Math.min(comeAmt * 10, 100000);
  }

  return BASE_BET_MAX_LIMITS[type] || 50000;
}

export const BET_NAME_DISPLAY: Record<string, string> = {
  PASS_LINE: 'Pass Line',
  PASS_ODDS: 'Pass Odds',
  COME: 'Come',
  COME_BET_TRAVEL: 'Come Travel',
  COME_ODDS: 'Come Odds',
  PLACE: 'Place Bet',
  FIELD: 'Field',
  ATS_SMALL: 'ATS Small',
  ATS_TALL: 'ATS Tall',
  ATS_ALL: 'ATS Make \'Em All',
  HARD_4: 'Hard 4',
  HARD_6: 'Hard 6',
  HARD_8: 'Hard 8',
  HARD_10: 'Hard 10',
  HORN: 'Horn',
  ANY_7: 'Any 7',
  ANY_CRAPS: 'Any Craps',
  HOP: 'Hop Bet',
  HOP_7S: 'Hop 7s',
};
