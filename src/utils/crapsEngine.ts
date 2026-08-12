import { AtsState, Bet, CraplessPoint, DiceRoll, PayoutDetail, RollResultOutcome } from '../types';

export function formatMoney(val: number): string {
  const rounded = Math.round(val * 100) / 100;
  if (rounded % 1 !== 0) {
    return rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return rounded.toLocaleString();
}

export const PASS_ODDS_PAYOUT_RATIO: Record<CraplessPoint, number> = {
  2: 6.0,  // 6 to 1
  12: 6.0, // 6 to 1
  3: 3.0,  // 3 to 1
  11: 3.0, // 3 to 1
  4: 2.0,  // 2 to 1
  10: 2.0, // 2 to 1
  5: 1.5,  // 3 to 2
  9: 1.5,  // 3 to 2
  6: 1.2,  // 6 to 5 (1.2)
  8: 1.2,  // 6 to 5 (1.2)
};

export const PLACE_PAYOUT_RATIO: Record<CraplessPoint, { num: number; den: number }> = {
  2: { num: 11, den: 2 },  // 11 to 2 (5.5)
  12: { num: 11, den: 2 }, // 11 to 2
  3: { num: 11, den: 4 },  // 11 to 4 (2.75)
  11: { num: 11, den: 4 }, // 11 to 4
  4: { num: 9, den: 5 },   // 9 to 5 (1.8)
  10: { num: 9, den: 5 },  // 9 to 5
  5: { num: 7, den: 5 },   // 7 to 5 (1.4)
  9: { num: 7, den: 5 },   // 7 to 5
  6: { num: 7, den: 6 },   // 7 to 6 (1.1666)
  8: { num: 7, den: 6 },   // 7 to 6
};

export function isBetWorking(
  bet: Bet,
  point: number | null,
  placeWorkingOnComeOut: boolean = false,
  hardwaysWorkingOnComeOut: boolean = false
): boolean {
  if (bet.isLocked) return true;
  if (bet.type === 'PASS_LINE' || bet.type === 'COME' || bet.type === 'COME_BET_TRAVEL') return true;
  if (bet.working !== undefined) return bet.working;

  const isComeOut = point === null;
  if (isComeOut) {
    if (bet.type === 'PLACE') return placeWorkingOnComeOut;
    if (bet.type.startsWith('HARD_')) return hardwaysWorkingOnComeOut;
    if (bet.type === 'COME_ODDS') return false;
    return true; // PASS_LINE, COME, FIELD, HORN, ANY_7, ANY_CRAPS, HOP
  } else {
    if (bet.type.startsWith('HARD_')) return hardwaysWorkingOnComeOut;
    return true; // Point phase: unlocked bets default to working
  }
}

export function initialAtsState(): AtsState {
  return {
    smallHits: new Set<number>(),
    tallHits: new Set<number>(),
    allHits: new Set<number>(),
    smallWon: false,
    tallWon: false,
    allWon: false,
  };
}

export function processRoll(
  roll: DiceRoll,
  currentPoint: number | null,
  activeBets: Bet[],
  atsState: AtsState,
  placeWorkingOnComeOut: boolean = false,
  autoRebet: boolean = false,
  hardwaysWorkingOnComeOut: boolean = false
): {
  nextPoint: number | null;
  updatedBets: Bet[];
  updatedAts: AtsState;
  outcome: RollResultOutcome;
} {
  const rollTotal = roll.total;
  const isComeOut = currentPoint === null;
  let nextPoint = currentPoint;

  const payouts: PayoutDetail[] = [];
  let totalPayout = 0;
  let totalLoss = 0;
  const messages: string[] = [];

  const updatedAts: AtsState = {
    smallHits: new Set(
      atsState?.smallHits instanceof Set
        ? atsState.smallHits
        : Array.isArray(atsState?.smallHits)
        ? atsState.smallHits
        : []
    ),
    tallHits: new Set(
      atsState?.tallHits instanceof Set
        ? atsState.tallHits
        : Array.isArray(atsState?.tallHits)
        ? atsState.tallHits
        : []
    ),
    allHits: new Set(
      atsState?.allHits instanceof Set
        ? atsState.allHits
        : Array.isArray(atsState?.allHits)
        ? atsState.allHits
        : []
    ),
    smallWon: !!atsState?.smallWon,
    tallWon: !!atsState?.tallWon,
    allWon: !!atsState?.allWon,
  };

  // Remaining active bets after roll
  const remainingBets: Bet[] = [];

  // --- 1. ATS Tracker Update ---
  let justHitSmall = false;
  let justHitTall = false;
  let justHitAll = false;

  if (rollTotal !== 7) {
    if ([2, 3, 4, 5, 6].includes(rollTotal)) {
      updatedAts.smallHits.add(rollTotal);
      updatedAts.allHits.add(rollTotal);
    }
    if ([8, 9, 10, 11, 12].includes(rollTotal)) {
      updatedAts.tallHits.add(rollTotal);
      updatedAts.allHits.add(rollTotal);
    }

    // Check Small Win on this roll
    if (updatedAts.smallHits.size === 5 && !atsState.smallWon) {
      justHitSmall = true;
      updatedAts.smallWon = true;
      messages.push('✨ ALL SMALL HIT! (30 to 1 Payout)');
    }
    // Check Tall Win on this roll
    if (updatedAts.tallHits.size === 5 && !atsState.tallWon) {
      justHitTall = true;
      updatedAts.tallWon = true;
      messages.push('✨ ALL TALL HIT! (30 to 1 Payout)');
    }
    // Check All Win on this roll
    if (updatedAts.allHits.size === 10 && !atsState.allWon) {
      justHitAll = true;
      updatedAts.allWon = true;
      messages.push('🎉 MAKE \'EM ALL HIT! (155 to 1 Payout / 156 FOR 1)');
    }
  }

  // --- 2. Process Point Changes ---
  if (isComeOut) {
    if (rollTotal === 7) {
      messages.push('Come Out 7! Pass Line wins!');
    } else {
      nextPoint = rollTotal;
      messages.push(`Point established: ${rollTotal}`);
    }
  } else {
    // Point is established
    if (rollTotal === currentPoint) {
      messages.push(`HIT THE POINT (${currentPoint})! Pass Line & Odds win!`);
      nextPoint = null; // Turns point off
    } else if (rollTotal === 7) {
      messages.push('SEVEN OUT! Board resets.');
      nextPoint = null; // Turns point off
    }
  }

  // --- 3. Evaluate Bets ---
  for (const bet of activeBets) {
    switch (bet.type) {
      case 'PASS_LINE': {
        if (isComeOut) {
          if (rollTotal === 7) {
            // Wins even money
            const profit = bet.amount;
            if (autoRebet) {
              totalPayout += profit;
              remainingBets.push({ ...bet, isLocked: false });
            } else {
              totalPayout += bet.amount + profit;
            }
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: profit,
              message: `Pass Line win on Come-Out 7 (+$${profit})`,
            });
          } else {
            // Lock bet for Point phase
            remainingBets.push({ ...bet, isLocked: true });
          }
        } else {
          // On Point roll
          if (rollTotal === currentPoint) {
            const profit = bet.amount;
            if (autoRebet) {
              totalPayout += profit;
              remainingBets.push({ ...bet, isLocked: false });
            } else {
              totalPayout += bet.amount + profit;
            }
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: profit,
              message: `Pass Line win on Point ${currentPoint} (+$${profit})`,
            });
          } else if (rollTotal === 7) {
            // Lose
            totalLoss += bet.amount;
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: 0,
              message: `Pass Line lost on 7 (-$${bet.amount})`,
            });
          } else {
            // Stays active
            remainingBets.push(bet);
          }
        }
        break;
      }

      case 'PASS_ODDS': {
        if (!isComeOut && currentPoint) {
          if (rollTotal === currentPoint) {
            const ratio = PASS_ODDS_PAYOUT_RATIO[currentPoint as CraplessPoint] || 1;
            const profit = Math.round(bet.amount * ratio * 100) / 100;
            totalPayout += bet.amount + profit;
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: profit,
              message: `Pass Odds (${ratio}:1) win (+$${formatMoney(profit)})`,
            });
          } else if (rollTotal === 7) {
            totalLoss += bet.amount;
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: 0,
              message: `Pass Odds lost (-$${formatMoney(bet.amount)})`,
            });
          } else {
            remainingBets.push(bet);
          }
        } else {
          remainingBets.push(bet);
        }
        break;
      }

      case 'COME': {
        // Come bet on current roll
        if (rollTotal === 7) {
          const profit = bet.amount;
          totalPayout += bet.amount + profit;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Come Bet win on 7 (+$${profit})`,
          });
        } else {
          // Come bet travels to rollTotal!
          messages.push(`Come bet travels to ${rollTotal}`);
          remainingBets.push({
            ...bet,
            type: 'COME_BET_TRAVEL',
            targetNumber: rollTotal,
            isLocked: true,
          });
        }
        break;
      }

      case 'COME_BET_TRAVEL': {
        if (bet.targetNumber) {
          if (rollTotal === bet.targetNumber) {
            const profit = bet.amount;
            totalPayout += bet.amount + profit;
            payouts.push({
              betType: bet.type,
              targetNumber: bet.targetNumber,
              betAmount: bet.amount,
              payoutAmount: profit,
              message: `Come Bet on ${bet.targetNumber} hit! (+$${profit})`,
            });
          } else if (rollTotal === 7) {
            totalLoss += bet.amount;
            payouts.push({
              betType: bet.type,
              targetNumber: bet.targetNumber,
              betAmount: bet.amount,
              payoutAmount: 0,
              message: `Come Bet on ${bet.targetNumber} lost on 7 (-$${bet.amount})`,
            });
          } else {
            remainingBets.push(bet);
          }
        }
        break;
      }

      case 'COME_ODDS': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (bet.targetNumber) {
          if (rollTotal === bet.targetNumber) {
            if (isWorking) {
              const ratio = PASS_ODDS_PAYOUT_RATIO[bet.targetNumber as CraplessPoint] || 1;
              const profit = Math.round(bet.amount * ratio * 100) / 100;
              totalPayout += bet.amount + profit;
              payouts.push({
                betType: bet.type,
                targetNumber: bet.targetNumber,
                betAmount: bet.amount,
                payoutAmount: profit,
                message: `Come Odds on ${bet.targetNumber} hit! (+$${formatMoney(profit)})`,
              });
            } else {
              remainingBets.push(bet);
            }
          } else if (rollTotal === 7) {
            if (isWorking) {
              totalLoss += bet.amount;
              payouts.push({
                betType: bet.type,
                targetNumber: bet.targetNumber,
                betAmount: bet.amount,
                payoutAmount: 0,
                message: `Come Odds on ${bet.targetNumber} lost on 7 (-$${formatMoney(bet.amount)})`,
              });
            } else {
              // Off on comeout, 7 rolled: returned to player (since flat come bet lost)
              totalPayout += bet.amount;
              payouts.push({
                betType: bet.type,
                targetNumber: bet.targetNumber,
                betAmount: bet.amount,
                payoutAmount: 0,
                message: `Come Odds on ${bet.targetNumber} returned (OFF on Comeout)`,
              });
            }
          } else {
            remainingBets.push(bet);
          }
        }
        break;
      }

      case 'PLACE': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (bet.targetNumber) {
          if (rollTotal === bet.targetNumber && isWorking) {
            const payout = PLACE_PAYOUT_RATIO[bet.targetNumber as CraplessPoint];
            const profit = payout
              ? Math.round(((bet.amount * payout.num) / payout.den) * 100) / 100
              : Math.round(bet.amount * 100) / 100;

            if (autoRebet) {
              // Auto Rebet ON: Profit added to bank, bet stays on number
              totalPayout += profit;
              remainingBets.push(bet);
              payouts.push({
                betType: bet.type,
                targetNumber: bet.targetNumber,
                betAmount: bet.amount,
                payoutAmount: profit,
                message: `Place Bet ${bet.targetNumber} hit! (+$${formatMoney(profit)}, rebet $${formatMoney(bet.amount)})`,
              });
            } else {
              // Auto Rebet OFF: Profit AND flat bet come down into rack
              totalPayout += profit + bet.amount;
              payouts.push({
                betType: bet.type,
                targetNumber: bet.targetNumber,
                betAmount: bet.amount,
                payoutAmount: profit,
                message: `Place Bet ${bet.targetNumber} hit! (+$${formatMoney(profit)} + $${formatMoney(bet.amount)} returned)`,
              });
            }
          } else if (rollTotal === 7 && isWorking) {
            totalLoss += bet.amount;
            payouts.push({
              betType: bet.type,
              targetNumber: bet.targetNumber,
              betAmount: bet.amount,
              payoutAmount: 0,
              message: `Place Bet ${bet.targetNumber} lost on 7 (-$${formatMoney(bet.amount)})`,
            });
          } else {
            // Bet stays active
            remainingBets.push(bet);
          }
        }
        break;
      }

      case 'ATS_SMALL': {
        if (rollTotal === 7) {
          if (!atsState.smallWon) {
            totalLoss += bet.amount;
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: 0,
              message: `ATS Small bet wiped out on 7 (-$${bet.amount})`,
            });
          }
        } else if (justHitSmall) {
          // Small completed on this roll -> pay 30:1 + return bet (31 for 1), and remove chip
          const profit = bet.amount * 30;
          totalPayout += bet.amount + profit;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `ATS Small Win! 30:1 (+$${profit} + $${bet.amount} returned)`,
          });
          // Bet is NOT pushed to remainingBets -> chip comes down!
        } else if (!updatedAts.smallWon) {
          remainingBets.push({ ...bet, isLocked: true });
        }
        break;
      }

      case 'ATS_TALL': {
        if (rollTotal === 7) {
          if (!atsState.tallWon) {
            totalLoss += bet.amount;
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: 0,
              message: `ATS Tall bet wiped out on 7 (-$${bet.amount})`,
            });
          }
        } else if (justHitTall) {
          // Tall completed on this roll -> pay 30:1 + return bet (31 for 1), and remove chip
          const profit = bet.amount * 30;
          totalPayout += bet.amount + profit;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `ATS Tall Win! 30:1 (+$${profit} + $${bet.amount} returned)`,
          });
          // Bet is NOT pushed to remainingBets -> chip comes down!
        } else if (!updatedAts.tallWon) {
          remainingBets.push({ ...bet, isLocked: true });
        }
        break;
      }

      case 'ATS_ALL': {
        if (rollTotal === 7) {
          if (!atsState.allWon) {
            totalLoss += bet.amount;
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: 0,
              message: `ATS Make 'Em All bet wiped out on 7 (-$${bet.amount})`,
            });
          }
        } else if (justHitAll) {
          // All completed on this roll -> pay 155:1 + return bet (156 for 1), and remove chip
          const profit = bet.amount * 155;
          totalPayout += bet.amount + profit;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `ATS MAKE 'EM ALL WIN! 155:1 (+$${profit} + $${bet.amount} returned)`,
          });
          // Bet is NOT pushed to remainingBets -> chip comes down!
        } else if (!updatedAts.allWon) {
          remainingBets.push({ ...bet, isLocked: true });
        }
        break;
      }

      case 'FIELD': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (!isWorking) {
          remainingBets.push(bet);
          break;
        }
        if ([2, 3, 4, 9, 10, 11, 12].includes(rollTotal)) {
          let multiplier = 1;
          if (rollTotal === 2 || rollTotal === 12) multiplier = 2; // 2 and 12 pay 2:1
          const profit = bet.amount * multiplier;
          if (autoRebet) {
            totalPayout += profit;
            remainingBets.push(bet);
          } else {
            totalPayout += bet.amount + profit;
          }
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Field bet win on ${rollTotal} (${multiplier}:1) (+$${formatMoney(profit)})`,
          });
        } else {
          totalLoss += bet.amount;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: 0,
            message: `Field bet lost on ${rollTotal} (-$${formatMoney(bet.amount)})`,
          });
        }
        break;
      }

      case 'HARD_4': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (isWorking && rollTotal === 4 && roll.die1 === 2 && roll.die2 === 2) {
          const profit = bet.amount * 7; // 7 to 1
          if (autoRebet) {
            totalPayout += profit;
            remainingBets.push(bet);
          } else {
            totalPayout += bet.amount + profit;
          }
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Hard 4 Hit! 7:1 (+$${profit})`,
          });
        } else if (isWorking && (rollTotal === 7 || (rollTotal === 4 && (roll.die1 !== 2 || roll.die2 !== 2)))) {
          totalLoss += bet.amount;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: 0,
            message: `Hard 4 lost (-$${bet.amount})`,
          });
        } else {
          remainingBets.push(bet);
        }
        break;
      }

      case 'HARD_6': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (isWorking && rollTotal === 6 && roll.die1 === 3 && roll.die2 === 3) {
          const profit = bet.amount * 9; // 9 to 1
          if (autoRebet) {
            totalPayout += profit;
            remainingBets.push(bet);
          } else {
            totalPayout += bet.amount + profit;
          }
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Hard 6 Hit! 9:1 (+$${profit})`,
          });
        } else if (isWorking && (rollTotal === 7 || (rollTotal === 6 && (roll.die1 !== 3 || roll.die2 !== 3)))) {
          totalLoss += bet.amount;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: 0,
            message: `Hard 6 lost (-$${bet.amount})`,
          });
        } else {
          remainingBets.push(bet);
        }
        break;
      }

      case 'HARD_8': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (isWorking && rollTotal === 8 && roll.die1 === 4 && roll.die2 === 4) {
          const profit = bet.amount * 9; // 9 to 1
          if (autoRebet) {
            totalPayout += profit;
            remainingBets.push(bet);
          } else {
            totalPayout += bet.amount + profit;
          }
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Hard 8 Hit! 9:1 (+$${profit})`,
          });
        } else if (isWorking && (rollTotal === 7 || (rollTotal === 8 && (roll.die1 !== 4 || roll.die2 !== 4)))) {
          totalLoss += bet.amount;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: 0,
            message: `Hard 8 lost (-$${bet.amount})`,
          });
        } else {
          remainingBets.push(bet);
        }
        break;
      }

      case 'HARD_10': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (isWorking && rollTotal === 10 && roll.die1 === 5 && roll.die2 === 5) {
          const profit = bet.amount * 7; // 7 to 1
          if (autoRebet) {
            totalPayout += profit;
            remainingBets.push(bet);
          } else {
            totalPayout += bet.amount + profit;
          }
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Hard 10 Hit! 7:1 (+$${profit})`,
          });
        } else if (isWorking && (rollTotal === 7 || (rollTotal === 10 && (roll.die1 !== 5 || roll.die2 !== 5)))) {
          totalLoss += bet.amount;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: 0,
            message: `Hard 10 lost (-$${bet.amount})`,
          });
        } else {
          remainingBets.push(bet);
        }
        break;
      }

      case 'HORN': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (!isWorking) {
          remainingBets.push(bet);
          break;
        }
        // One roll bet on 2, 3, 11, 12
        if ([2, 12].includes(rollTotal)) {
          const profit = Math.round(((bet.amount / 4) * 30 - (bet.amount * 3) / 4) * 100) / 100; // 30:1 on 1/4 bet
          if (autoRebet) {
            totalPayout += profit;
            remainingBets.push(bet);
          } else {
            totalPayout += bet.amount + profit;
          }
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Horn Bet hit ${rollTotal}! (+$${formatMoney(profit)})`,
          });
        } else if ([3, 11].includes(rollTotal)) {
          const profit = Math.round(((bet.amount / 4) * 15 - (bet.amount * 3) / 4) * 100) / 100; // 15:1 on 1/4 bet
          if (autoRebet) {
            totalPayout += profit;
            remainingBets.push(bet);
          } else {
            totalPayout += bet.amount + profit;
          }
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Horn Bet hit ${rollTotal}! (+$${formatMoney(profit)})`,
          });
        } else {
          totalLoss += bet.amount;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: 0,
            message: `Horn Bet lost (-$${formatMoney(bet.amount)})`,
          });
        }
        break;
      }

      case 'ANY_7': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (!isWorking) {
          remainingBets.push(bet);
          break;
        }
        if (rollTotal === 7) {
          const profit = bet.amount * 4; // 4 to 1
          if (autoRebet) {
            totalPayout += profit;
            remainingBets.push(bet);
          } else {
            totalPayout += bet.amount + profit;
          }
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Any 7 Win! 4:1 (+$${profit})`,
          });
        } else {
          totalLoss += bet.amount;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: 0,
            message: `Any 7 lost (-$${bet.amount})`,
          });
        }
        break;
      }

      case 'ANY_CRAPS': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (!isWorking) {
          remainingBets.push(bet);
          break;
        }
        if ([2, 3, 12].includes(rollTotal)) {
          const profit = bet.amount * 7; // 7 to 1
          if (autoRebet) {
            totalPayout += profit;
            remainingBets.push(bet);
          } else {
            totalPayout += bet.amount + profit;
          }
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: profit,
            message: `Any Craps Win! 7:1 (+$${profit})`,
          });
        } else {
          totalLoss += bet.amount;
          payouts.push({
            betType: bet.type,
            betAmount: bet.amount,
            payoutAmount: 0,
            message: `Any Craps lost (-$${bet.amount})`,
          });
        }
        break;
      }

      case 'HOP': {
        const isWorking = isBetWorking(bet, currentPoint, placeWorkingOnComeOut, hardwaysWorkingOnComeOut);
        if (!isWorking) {
          remainingBets.push(bet);
          break;
        }
        if (bet.hopDice) {
          const [d1, d2] = bet.hopDice;
          const isHit =
            (roll.die1 === d1 && roll.die2 === d2) ||
            (roll.die1 === d2 && roll.die2 === d1);

          if (isHit) {
            const isHardHop = d1 === d2;
            const ratio = isHardHop ? 30 : 15;
            const profit = bet.amount * ratio;
            if (autoRebet) {
              totalPayout += profit;
              remainingBets.push(bet);
            } else {
              totalPayout += bet.amount + profit;
            }
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: profit,
              message: `Hop [${d1}-${d2}] Hit! ${ratio}:1 (+$${profit})`,
            });
          } else {
            totalLoss += bet.amount;
            payouts.push({
              betType: bet.type,
              betAmount: bet.amount,
              payoutAmount: 0,
              message: `Hop [${d1}-${d2}] lost (-$${bet.amount})`,
            });
          }
        }
        break;
      }

      default:
        remainingBets.push(bet);
        break;
    }
  }

  // --- 4. Wipe ATS tracking on 7 ---
  if (rollTotal === 7) {
    updatedAts.smallHits.clear();
    updatedAts.tallHits.clear();
    updatedAts.allHits.clear();
    updatedAts.smallWon = false;
    updatedAts.tallWon = false;
    updatedAts.allWon = false;
  }

  // --- 5. Phase Transitions: Update default working states ---
  const isTransitionToPoint = isComeOut && nextPoint !== null;
  const isTransitionToComeOut = !isComeOut && nextPoint === null;

  const finalUpdatedBets = remainingBets.map((bet) => {
    if (bet.type === 'PLACE' || bet.type.startsWith('HARD_') || bet.type === 'COME_ODDS') {
      if (isTransitionToPoint) {
        // Point is established: bets turn ON by default for the point round
        return { ...bet, working: true };
      } else if (rollTotal === 7 || isTransitionToComeOut) {
        // Any 7 roll or transition to come out: bets turn OFF by default for Come Out
        return { ...bet, working: false };
      }
    }
    return bet;
  });

  const roundedPayout = Math.round(totalPayout * 100) / 100;
  const roundedLoss = Math.round(totalLoss * 100) / 100;
  const netChange = Math.round((roundedPayout - roundedLoss) * 100) / 100;

  return {
    nextPoint,
    updatedBets: finalUpdatedBets,
    updatedAts,
    outcome: {
      roll,
      payouts,
      totalPayout: roundedPayout,
      totalLoss: roundedLoss,
      netChange,
      pointChanged: {
        prevPoint: currentPoint,
        newPoint: nextPoint,
      },
      messages,
    },
  };
}
