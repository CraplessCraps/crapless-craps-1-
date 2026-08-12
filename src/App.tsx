import React, { useState, useRef, useEffect } from 'react';
import { AtsState, Bet, DiceRoll, GameStats, DieValue } from './types';
import { initialAtsState, processRoll, isBetWorking, formatMoney } from './utils/crapsEngine';
import { soundManager } from './utils/audio';
import { getBetMaxLimit, BET_NAME_DISPLAY } from './utils/betLimits';

import { HeaderBar } from './components/HeaderBar';
import { DiceBar } from './components/DiceBar';
import { RollHistoryStrip } from './components/RollHistoryStrip';
import { AtsBonusBoard } from './components/AtsBonusBoard';
import { PressControls } from './components/PressControls';
import { PlaceNumbersGrid } from './components/PlaceNumbersGrid';
import { MainLineBets } from './components/MainLineBets';
import { HardsAndHorns } from './components/HardsAndHorns';
import { ChipSelector } from './components/ChipSelector';
import { ChipGraphic } from './components/ChipGraphic';
import { BottomActionBar } from './components/BottomActionBar';

import { RollHistoryModal } from './components/RollHistoryModal';
import { HelpRulesModal } from './components/HelpRulesModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AdRewardModal } from './components/AdRewardModal';
import { playVoiceAudio } from './utils/speechUtils';
import { speakStickmanCallout } from './utils/stickmanCalloutEngine';
import { showUmpPrivacyOptions } from './utils/admob';

const getHop7sTotalAmount = (bets: Bet[]) => {
  const hop7Pairs: Array<[DieValue, DieValue]> = [[1, 6], [2, 5], [3, 4]];
  const hop7Bets = (bets || []).filter(
    (b) =>
      b.type === 'HOP' &&
      b.hopDice &&
      hop7Pairs.some(
        ([d1, d2]) => (b.hopDice![0] === d1 && b.hopDice![1] === d2) || (b.hopDice![0] === d2 && b.hopDice![1] === d1)
      )
  );
  const total = Math.round(hop7Bets.reduce((acc, b) => acc + b.amount, 0) * 100) / 100;
  return { hop7Bets, total };
};

export default function App() {
  // --- Game State (Persisted via localStorage) ---
  const [bank, setBank] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('CRAPLESS_BANK');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load bank from localStorage', e);
    }
    return 10000;
  });

  const [point, setPoint] = useState<number | null>(null);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [lastBets, setLastBets] = useState<Bet[]>([]);
  const [isAdModalOpen, setIsAdModalOpen] = useState<boolean>(false);

  const [atsState, setAtsState] = useState<AtsState>(() => {
    try {
      const saved = localStorage.getItem('CRAPLESS_ATS_STATE');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          smallHits: new Set<number>(Array.isArray(parsed.smallHits) ? parsed.smallHits : []),
          tallHits: new Set<number>(Array.isArray(parsed.tallHits) ? parsed.tallHits : []),
          allHits: new Set<number>(Array.isArray(parsed.allHits) ? parsed.allHits : []),
          smallWon: !!parsed.smallWon,
          tallWon: !!parsed.tallWon,
          allWon: !!parsed.allWon,
        };
      }
    } catch (e) {
      console.error('Failed to load ATS state', e);
    }
    return initialAtsState();
  });

  const [selectedChip, setSelectedChip] = useState<number>(5);
  const [placeWorkingOnComeOut, setPlaceWorkingOnComeOut] = useState<boolean>(false);
  const [boxBetsOffInPoint, setBoxBetsOffInPoint] = useState<boolean>(false);
  const [hardsWorking, setHardsWorking] = useState<boolean>(false);

  const [autoRebet, setAutoRebet] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('CRAPLESS_AUTO_REBET');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load autoRebet', e);
    }
    return true;
  });

  const [autoRoll, setAutoRoll] = useState<boolean>(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('CRAPLESS_SOUND_ENABLED');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load soundEnabled', e);
    }
    return true;
  });

  const [isStickmanCalloutsOn, setIsStickmanCalloutsOn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('CRAPLESS_STICKMAN_ENABLED');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load stickmanEnabled', e);
    }
    return true;
  });

  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);

  const [rollHistory, setRollHistory] = useState<DiceRoll[]>(() => {
    try {
      const saved = localStorage.getItem('CRAPLESS_ROLL_HISTORY');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load rollHistory', e);
    }
    return [];
  });

  const [gameStats, setGameStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem('CRAPLESS_STATS');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load gameStats', e);
    }
    return {
      totalRolls: 0,
      totalWins: 0,
      totalLosses: 0,
      biggestWin: 0,
      rollDistribution: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
      sevenOutCount: 0,
      atsSmallHitsCount: 0,
      atsTallHitsCount: 0,
      atsAllHitsCount: 0,
    };
  });

  const [recentMessage, setRecentMessage] = useState<string | null>(
    'Welcome to Crapless Craps! Place your bets and roll.'
  );

    // Unlock audio context on first mobile touch/click for Android WebView/APK
  useEffect(() => {
    const unlockAudio = () => {
      const globalObj = window as unknown as Record<string, unknown>;
      const audioCtx = globalObj.__CRAPS_AUDIO_CONTEXT__ as AudioContext | undefined;
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Active Drag Item State (React State Failsafe for HTML5 Drag and Drop)
  const [draggedItem, setDraggedItem] = useState<{
    source: 'CHIP_SELECTOR' | 'EXISTING_BET';
    amount: number;
    betId?: string;
    betType?: Bet['type'];
    targetNumber?: number;
    hopDice?: [DieValue, DieValue];
  } | null>(null);

  // Pointer Drag State for Universal Drag & Drop (Mouse + Touch + iFrame)
  const [dragPointerState, setDragPointerState] = useState<{
    isDragging: boolean;
    x: number;
    y: number;
    payload: {
      source: 'CHIP_SELECTOR' | 'EXISTING_BET';
      amount: number;
      betId?: string;
      betType?: Bet['type'];
      targetNumber?: number;
      hopDice?: [DieValue, DieValue];
    };
  } | null>(null);

  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  // Refs for current game state to prevent stale closures in executeRoll & timers
  const bankRef = useRef(bank);
  bankRef.current = bank;

  const pointRef = useRef(point);
  pointRef.current = point;

  const activeBetsRef = useRef(activeBets);
  activeBetsRef.current = activeBets;

  const atsStateRef = useRef(atsState);
  atsStateRef.current = atsState;

  const atsHadBetsThisRunRef = useRef<boolean>(false);
  // Mark true if player currently has active ATS bets
  if (activeBets.some((b) => (b.type === 'ATS_SMALL' || b.type === 'ATS_TALL' || b.type === 'ATS_ALL') && b.amount > 0)) {
    atsHadBetsThisRunRef.current = true;
  }

  const placeWorkingOnComeOutRef = useRef(placeWorkingOnComeOut);
  placeWorkingOnComeOutRef.current = placeWorkingOnComeOut;

  const autoRebetRef = useRef(autoRebet);
  autoRebetRef.current = autoRebet;

  const hardsWorkingRef = useRef(hardsWorking);
  hardsWorkingRef.current = hardsWorking;

  const isStickmanCalloutsOnRef = useRef(isStickmanCalloutsOn);
  isStickmanCalloutsOnRef.current = isStickmanCalloutsOn;

  const triggerStickmanCallout = (rollData: {
    die1: number;
    die2: number;
    total: number;
    point: number | null;
    isComeOut: boolean;
    isSevenOut: boolean;
    isPointHit: boolean;
  }) => {
    speakStickmanCallout(rollData);
  };

  // Modals
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);

  // Calculate Total Risk
  const totalRisk = activeBets.reduce((acc, b) => acc + b.amount, 0);

  const isRollingRef = useRef(isRolling);
  isRollingRef.current = isRolling;

  // Ref for auto-roll loop
  const autoRollRef = useRef(autoRoll);
  autoRollRef.current = autoRoll;

  // Touch & Auto Roll Timer Refs for 1.5s Pause On Touch
  const lastTouchTimeRef = useRef<number>(0);
  const autoRollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Persistent Storage Sync Effects ---
  useEffect(() => {
    try { localStorage.setItem('CRAPLESS_BANK', bank.toString()); } catch (_) {}
  }, [bank]);

  // --- Bankroll Milestone Audio Triggers ($1M and $10M) ---
  const prevBankRef = useRef<number>(bank);

  useEffect(() => {
    const prev = prevBankRef.current;
    const current = bank;

    if (prev < 10000000 && current >= 10000000) {
      soundManager.playMilestone10M();
      setRecentMessage("🎉 🌟 $10 MILLION BANKROLL MILESTONE ACHIEVED! 🌟 🎉");
    } else if (prev < 1000000 && current >= 1000000) {
      soundManager.playMilestone1M();
      setRecentMessage("🎉 💰 $1 MILLION BANKROLL MILESTONE ACHIEVED! 💰 🎉");
    }

    prevBankRef.current = current;
  }, [bank]);

  useEffect(() => {
    try { localStorage.setItem('CRAPLESS_STATS', JSON.stringify(gameStats)); } catch (_) {}
  }, [gameStats]);

  useEffect(() => {
    try { localStorage.setItem('CRAPLESS_ROLL_HISTORY', JSON.stringify(rollHistory)); } catch (_) {}
  }, [rollHistory]);

  useEffect(() => {
    try {
      const serialized = {
        ...atsState,
        smallHits: Array.from(atsState.smallHits instanceof Set ? atsState.smallHits : []),
        tallHits: Array.from(atsState.tallHits instanceof Set ? atsState.tallHits : []),
        allHits: Array.from(atsState.allHits instanceof Set ? atsState.allHits : []),
      };
      localStorage.setItem('CRAPLESS_ATS_STATE', JSON.stringify(serialized));
    } catch (_) {}
  }, [atsState]);

  useEffect(() => {
    try { localStorage.setItem('CRAPLESS_SOUND_ENABLED', JSON.stringify(soundEnabled)); } catch (_) {}
  }, [soundEnabled]);

  useEffect(() => {
    try { localStorage.setItem('CRAPLESS_STICKMAN_ENABLED', JSON.stringify(isStickmanCalloutsOn)); } catch (_) {}
  }, [isStickmanCalloutsOn]);

  useEffect(() => {
    try { localStorage.setItem('CRAPLESS_AUTO_REBET', JSON.stringify(autoRebet)); } catch (_) {}
  }, [autoRebet]);

  // Warm-boot Web Audio context on first user touch / pointer interaction
  useEffect(() => {
    const handleFirstTouch = () => {
      soundManager.warmBoot();
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
    window.addEventListener('pointerdown', handleFirstTouch);
    window.addEventListener('touchstart', handleFirstTouch);
    return () => {
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  const handleResetGame = () => {
    try {
      localStorage.removeItem('CRAPLESS_BANK');
      localStorage.removeItem('CRAPLESS_STATS');
      localStorage.removeItem('CRAPLESS_ROLL_HISTORY');
      localStorage.removeItem('CRAPLESS_ATS_STATE');
    } catch (_) {}
    setBank(10000);
    setPoint(null);
    setActiveBets([]);
    setLastBets([]);
    setAtsState(initialAtsState());
    setRollHistory([]);
    setGameStats({
      totalRolls: 0,
      totalWins: 0,
      totalLosses: 0,
      biggestWin: 0,
      rollDistribution: { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
      sevenOutCount: 0,
      atsSmallHitsCount: 0,
      atsTallHitsCount: 0,
      atsAllHitsCount: 0,
    });
    setRecentMessage('Game & Bankroll reset to $10,000!');
  };

  const scheduleAutoRoll = (defaultDelayMs = 1700) => {
    if (autoRollTimerRef.current) {
      clearTimeout(autoRollTimerRef.current);
      autoRollTimerRef.current = null;
    }

    if (!autoRollRef.current || isRollingRef.current) return;

    const now = Date.now();
    const timeSinceTouch = now - lastTouchTimeRef.current;
    const touchPauseRemaining = Math.max(0, 1700 - timeSinceTouch);
    const actualDelay = Math.max(defaultDelayMs, touchPauseRemaining);

    autoRollTimerRef.current = setTimeout(() => {
      autoRollTimerRef.current = null;
      if (autoRollRef.current && !isRollingRef.current) {
        const timeSinceLastTouch = Date.now() - lastTouchTimeRef.current;
        if (timeSinceLastTouch < 1700) {
          scheduleAutoRoll(1700 - timeSinceLastTouch);
        } else {
          executeRoll();
        }
      }
    }, actualDelay);
  };

  const recordUserTouch = () => {
    lastTouchTimeRef.current = Date.now();
    if (autoRollRef.current && !isRollingRef.current) {
      scheduleAutoRoll(1700);
    }
  };

  // Sound manager sync
  const handleToggleSound = () => {
    const enabled = soundManager.toggleSound();
    setSoundEnabled(enabled);
  };

  // Helper to determine if a bet is locked
  const isBetLocked = (type: Bet['type']): boolean => {
    if (type === 'COME_BET_TRAVEL') return true;
    if (type === 'PASS_LINE' && point !== null) return true;
    if (
      (type === 'ATS_SMALL' || type === 'ATS_ALL' || type === 'ATS_TALL') &&
      (point !== null || atsState.allHits.size > 0)
    ) {
      return true;
    }
    return false;
  };

  // --- Universal Pointer Drag Start Handler ---
  const handlePointerDownStart = (
    e: React.PointerEvent,
    payload: {
      source: 'CHIP_SELECTOR' | 'EXISTING_BET';
      amount: number;
      betId?: string;
      betType?: Bet['type'];
      targetNumber?: number;
      hopDice?: [DieValue, DieValue];
    }
  ) => {
    if (payload.source === 'EXISTING_BET' && payload.betType && isBetLocked(payload.betType)) {
      setRecentMessage('This bet is locked and cannot be moved or pulled!');
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    pointerDownPosRef.current = { x: startX, y: startY };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (Math.hypot(dx, dy) > 10) {
        setDragPointerState({
          isDragging: true,
          x: moveEvent.clientX,
          y: moveEvent.clientY,
          payload,
        });
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      const endX = upEvent.clientX;
      const endY = upEvent.clientY;
      const dx = endX - startX;
      const dy = endY - startY;

      if (Math.hypot(dx, dy) > 10) {
        const dropEl = document.elementFromPoint(endX, endY);
        const rackEl = dropEl ? dropEl.closest('[data-rack]') : null;
        const targetEl = dropEl ? dropEl.closest('[data-bet-target]') : null;

        if (payload.source === 'CHIP_SELECTOR') {
          if (targetEl) {
            const targetType = targetEl.getAttribute('data-bet-target') as Bet['type'] | 'HOP_7S';
            if (targetType === 'HOP_7S') {
              handlePlaceHop7sBetWithAmount(3);
            } else {
              const numAttr = targetEl.getAttribute('data-target-number');
              const targetNumber = numAttr ? parseInt(numAttr, 10) : undefined;
              const hopD1 = targetEl.getAttribute('data-hop-d1');
              const hopD2 = targetEl.getAttribute('data-hop-d2');
              const hopDice =
                hopD1 && hopD2
                  ? ([parseInt(hopD1, 10), parseInt(hopD2, 10)] as [DieValue, DieValue])
                  : undefined;
              handlePlaceBetWithAmount(targetType, targetNumber, payload.amount, hopDice);
            }
          }
        } else if (payload.source === 'EXISTING_BET' && payload.betId) {
          if (targetEl) {
            const targetType = targetEl.getAttribute('data-bet-target') as Bet['type'] | 'HOP_7S';
            const numAttr = targetEl.getAttribute('data-target-number');
            const targetNumber = numAttr ? parseInt(numAttr, 10) : undefined;
            const hopD1 = targetEl.getAttribute('data-hop-d1');
            const hopD2 = targetEl.getAttribute('data-hop-d2');
            const hopDice =
              hopD1 && hopD2
                ? ([parseInt(hopD1, 10), parseInt(hopD2, 10)] as [DieValue, DieValue])
                : undefined;

            if (targetType === 'HOP_7S') {
              if (payload.betType === ('HOP_7S' as any)) {
                // Same target, do nothing
              } else {
                const nextBets = activeBetsRef.current.filter((b) => b.id !== payload.betId);
                activeBetsRef.current = nextBets;
                setActiveBets(nextBets);

                const nextBank = bankRef.current + payload.amount;
                bankRef.current = nextBank;
                setBank(nextBank);

                handlePlaceHop7sBetWithAmount(3);
              }
            } else if (payload.betType === ('HOP_7S' as any)) {
              handleRemoveHop7sBets();
              handlePlaceBetWithAmount(targetType, targetNumber, payload.amount, hopDice);
              const destName = BET_NAME_DISPLAY[targetType] || targetType;
              const numStr = targetNumber ? ` ${targetNumber}` : '';
              const hopStr = hopDice ? ` [${hopDice[0]}-${hopDice[1]}]` : '';
              setRecentMessage(`Moved $${formatMoney(payload.amount)} Hop 7s bet to ${destName}${numStr}${hopStr}!`);
            } else {
              const isSame =
                payload.betType === targetType &&
                payload.targetNumber === targetNumber &&
                (!hopDice ||
                  (payload.hopDice?.[0] === hopDice[0] && payload.hopDice?.[1] === hopDice[1]));

              if (!isSame) {
                const nextBets = activeBetsRef.current.filter((b) => b.id !== payload.betId);
                activeBetsRef.current = nextBets;
                setActiveBets(nextBets);

                const nextBank = bankRef.current + payload.amount;
                bankRef.current = nextBank;
                setBank(nextBank);

                handlePlaceBetWithAmount(targetType, targetNumber, payload.amount, hopDice);
                const destName = BET_NAME_DISPLAY[targetType] || targetType;
                const numStr = targetNumber ? ` ${targetNumber}` : '';
                const hopStr = hopDice ? ` [${hopDice[0]}-${hopDice[1]}]` : '';
                setRecentMessage(`Moved $${formatMoney(payload.amount)} bet to ${destName}${numStr}${hopStr}!`);
              }
            }
          } else {
            // Dragged off bet target (onto felt, table, or rack) -> Pull down bet!
            if (payload.betType === ('HOP_7S' as any)) {
              handleRemoveHop7sBets();
            } else {
              setActiveBets((prev) => {
                const next = prev.filter((b) => b.id !== payload.betId);
                activeBetsRef.current = next;
                return next;
              });
              setBank((prev) => {
                const next = Math.round((prev + payload.amount) * 100) / 100;
                bankRef.current = next;
                return next;
              });
              soundManager.playChip();
              const betName = payload.betType ? (BET_NAME_DISPLAY[payload.betType] || payload.betType) : 'Bet';
              const numStr = payload.targetNumber ? ` ${payload.targetNumber}` : '';
              setRecentMessage(`Pulled down $${formatMoney(payload.amount)} ${betName}${numStr} bet to bank!`);
            }
          }
        }
      }

      setDragPointerState(null);
      pointerDownPosRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // --- Core Bet Placement with Max Limit Checking ---
  const handlePlaceBetWithAmount = (
    type: Bet['type'],
    targetNumber?: number,
    chipAmount: number = selectedChip,
    hopDice?: [DieValue, DieValue]
  ) => {
    recordUserTouch();
    // Check if adding to a locked bet type (e.g. Pass Line or ATS after come-out)
    if (type === 'PASS_LINE' && point !== null) {
      setRecentMessage('Pass Line is locked during Point phase! You cannot add to it.');
      return;
    }

    // Special validation for Come bet on Come-out roll
    if (type === 'COME' && point === null) {
      soundManager.playRejectComeVoice();
      setRecentMessage('Come bets cannot be placed on the Come-Out roll! Use the Pass Line.');
      return;
    }

    if ((type === 'ATS_SMALL' || type === 'ATS_ALL' || type === 'ATS_TALL') && isBetLocked(type)) {
      setRecentMessage('ATS Bonus bets are locked after Come-Out! You cannot add to them.');
      return;
    }

    if (type === 'ATS_SMALL' || type === 'ATS_ALL' || type === 'ATS_TALL') {
      atsHadBetsThisRunRef.current = true;
    }

    if (type === 'COME_BET_TRAVEL') {
      setRecentMessage('Traveled Come bets are locked!');
      return;
    }

    // Special handling for HORN distribution (minimum $0.04 total, e.g. $1 total = $0.25 each on 2, 3, 11, 12)
    if (type === 'HORN') {
      const perNum = Math.max(0.01, Math.round((chipAmount / 4) * 100) / 100);
      const totalHornAmount = Math.round(perNum * 4 * 100) / 100;

      if (bankRef.current < totalHornAmount) {
        if (bankRef.current <= 0) {
          setRecentMessage('Out of chips! Click REFRESH CHIPS to reload.');
          if (bankRef.current + totalRisk < 1) setIsAdModalOpen(true);
          return;
        }
        const availPerNum = Math.floor((bankRef.current / 4) * 100) / 100;
        if (availPerNum >= 0.01) {
          const availTotal = Math.round(availPerNum * 4 * 100) / 100;
          const hornHops: [DieValue, DieValue][] = [
            [1, 1],
            [1, 2],
            [5, 6],
            [6, 6],
          ];
          hornHops.forEach(([d1, d2]) => {
            handlePlaceBetWithAmount('HOP', undefined, availPerNum, [d1, d2]);
          });
          setRecentMessage(
            `Placed Horn Bet with remaining bankroll ($${formatMoney(availTotal)} total: $${formatMoney(availPerNum)} each on 2, 3, 11, 12)`
          );
          return;
        }
        setRecentMessage(`Insufficient bankroll to place a Horn bet!`);
        return;
      }

      const hornHops: [DieValue, DieValue][] = [
        [1, 1],
        [1, 2],
        [5, 6],
        [6, 6],
      ];

      hornHops.forEach(([d1, d2]) => {
        handlePlaceBetWithAmount('HOP', undefined, perNum, [d1, d2]);
      });

      setRecentMessage(
        `Placed Horn Bet ($${formatMoney(totalHornAmount)} total: $${formatMoney(perNum)} each on 2, 3, 11, 12)`
      );
      return;
    }

    // Special validation for Pass Odds
    if (type === 'PASS_ODDS') {
      const passBet = activeBetsRef.current.find((b) => b.type === 'PASS_LINE');
      if (!passBet || passBet.amount <= 0) {
        setRecentMessage('Must have a Pass Line bet to place Pass Odds!');
        return;
      }
      if (point === null) {
        setRecentMessage('Point must be established before placing Odds!');
        return;
      }
    }

    // Special validation for Come Odds
    if (type === 'COME_ODDS') {
      const comeTravel = activeBetsRef.current.find(
        (b) => b.type === 'COME_BET_TRAVEL' && b.targetNumber === targetNumber
      );
      const isPointNumber = point === targetNumber;
      if (!comeTravel && !isPointNumber) {
        setRecentMessage(`Must have a Come bet or Point on ${targetNumber} to place Odds!`);
        return;
      }
    }

    if (bankRef.current <= 0) {
      setRecentMessage('Out of chips! Click REFRESH CHIPS to reload.');
      if (bankRef.current + totalRisk < 1) setIsAdModalOpen(true);
      return;
    }

    const prevBets = activeBetsRef.current;
    const maxLimit = getBetMaxLimit(type, targetNumber, prevBets);

    const existingBet = prevBets.find((b) => {
      if (type === 'HOP') {
        return (
          b.type === 'HOP' &&
          b.hopDice &&
          hopDice &&
          ((b.hopDice[0] === hopDice[0] && b.hopDice[1] === hopDice[1]) ||
            (b.hopDice[0] === hopDice[1] && b.hopDice[1] === hopDice[0]))
        );
      }
      return b.type === type && b.targetNumber === targetNumber;
    });

    const currentAmount = existingBet ? existingBet.amount : 0;

    if (currentAmount >= maxLimit) {
      const nameStr = BET_NAME_DISPLAY[type] || type;
      setRecentMessage(`Max limit reached for ${nameStr} ($${formatMoney(maxLimit)})!`);
      return;
    }

    let addAmount = chipAmount;
    if (currentAmount + addAmount > maxLimit) {
      addAmount = maxLimit - currentAmount;
      setRecentMessage(`Capped bet at max limit of $${formatMoney(maxLimit)}!`);
    }

    if (bankRef.current < addAmount) {
      addAmount = Math.round(bankRef.current * 100) / 100;
      setRecentMessage(`Placed remaining bankroll of $${formatMoney(addAmount)} on bet!`);
    }

    if (addAmount <= 0) {
      setRecentMessage('Out of chips! Click REFRESH CHIPS to reload.');
      return;
    }

    // Deduct immediately from bankroll
    const nextBank = Math.round((bankRef.current - addAmount) * 100) / 100;
    bankRef.current = nextBank;
    setBank(nextBank);

    if (type === 'ATS_ALL' && point === null && atsState.allHits.size === 0) {
      soundManager.playAllPlacedVoice();
    } else if (type === 'HOP' && hopDice) {
      soundManager.playHopSlapSound(hopDice[0], hopDice[1]);
    } else if (type === 'HARD_4' || type === 'HARD_6' || type === 'HARD_8' || type === 'HARD_10') {
      soundManager.playHardwayDrumSound(type);
    } else if (type === 'ANY_7') {
      soundManager.playAny7Sound();
    } else if (type === 'ANY_CRAPS') {
      soundManager.playAnyCrapsSound();
    } else {
      soundManager.playChip();
    }

    let nextBets: Bet[];
    if (existingBet) {
      nextBets = prevBets.map((b) => {
        if (b.id === existingBet.id) {
          return { ...b, amount: Math.round((b.amount + addAmount) * 100) / 100 };
        }
        return b;
      });
    } else {
      const newBet: Bet = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        targetNumber,
        hopDice,
        amount: Math.round(addAmount * 100) / 100,
        working:
          point === null
            ? (type === 'PLACE'
                ? placeWorkingOnComeOut
                : type.startsWith('HARD_')
                ? hardsWorking
                : type === 'COME_ODDS'
                ? false
                : true)
            : true,
      };
      nextBets = [...prevBets, newBet];
    }

    activeBetsRef.current = nextBets;
    setActiveBets(nextBets);
  };

  const handlePlaceBet = (
    type: Bet['type'],
    targetNumber?: number,
    hopDice?: [DieValue, DieValue]
  ) => {
    handlePlaceBetWithAmount(type, targetNumber, selectedChip, hopDice);
  };

  const handlePlaceHop7sBetWithAmount = (addAmount: number = 3) => {
    const cost = 3;
    const currentBank = bankRef.current;
    if (currentBank < cost) {
      setRecentMessage('Not enough chips! $3 required for Hop 7s ($1 on each 7 pair).');
      if (currentBank + totalRisk < 1) setIsAdModalOpen(true);
      return;
    }

    // Deduct $3 immediately from bankroll
    const nextBank = Math.round((currentBank - cost) * 100) / 100;
    bankRef.current = nextBank;
    setBank(nextBank);

    soundManager.playHopSlapSound(1, 6);

    const eachAdd = 1;
    const hop7Pairs: Array<[DieValue, DieValue]> = [[1, 6], [2, 5], [3, 4]];

    setActiveBets((prevBets) => {
      let updated = [...prevBets];

      hop7Pairs.forEach(([d1, d2]) => {
        const idx = updated.findIndex(
          (b) =>
            b.type === 'HOP' &&
            b.hopDice &&
            ((b.hopDice[0] === d1 && b.hopDice[1] === d2) || (b.hopDice[0] === d2 && b.hopDice[1] === d1))
        );

        if (idx >= 0) {
          const oldAmt = updated[idx].amount;
          const newAmt = Math.round((oldAmt + eachAdd) * 100) / 100;
          updated[idx] = {
            ...updated[idx],
            amount: newAmt,
            working: true,
          };
        } else {
          updated.push({
            id: Math.random().toString(36).substring(2, 9),
            type: 'HOP',
            hopDice: [d1, d2],
            amount: eachAdd,
            working: true,
          });
        }
      });

      activeBetsRef.current = updated;
      return updated;
    });

    const { total } = getHop7sTotalAmount(activeBetsRef.current);

    setRecentMessage(
      `Placed $3 on Hop 7s ($${formatMoney(total)} total across 7 pairs).`
    );
  };

  const handleRemoveHop7sBets = () => {
    const { total } = getHop7sTotalAmount(activeBetsRef.current);
    if (total <= 0) return;

    const hop7Pairs: Array<[DieValue, DieValue]> = [[1, 6], [2, 5], [3, 4]];

    setActiveBets((prevBets) => {
      const next = prevBets.filter(
        (b) =>
          !(
            b.type === 'HOP' &&
            b.hopDice &&
            hop7Pairs.some(
              ([d1, d2]) => (b.hopDice![0] === d1 && b.hopDice![1] === d2) || (b.hopDice![0] === d2 && b.hopDice![1] === d1)
            )
          )
      );
      activeBetsRef.current = next;
      return next;
    });

    setBank((prev) => {
      const next = Math.round((prev + total) * 100) / 100;
      bankRef.current = next;
      return next;
    });

    soundManager.playChip();
    setRecentMessage(`Pulled down $${formatMoney(total)} Hop 7s bet back to bankroll!`);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStartChip = (e: React.DragEvent, amount: number) => {
    const payload = { source: 'CHIP_SELECTOR' as const, amount };
    setDraggedItem(payload);
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartBet = (e: React.DragEvent, bet: Bet) => {
    if (isBetLocked(bet.type)) {
      setRecentMessage('This bet is locked and cannot be moved or pulled!');
      e.preventDefault();
      return;
    }
    const payload = {
      source: 'EXISTING_BET' as const,
      betId: bet.id,
      betType: bet.type,
      targetNumber: bet.targetNumber,
      hopDice: bet.hopDice,
      amount: bet.amount,
    };
    setDraggedItem(payload);
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnTarget = (
    e: React.DragEvent,
    targetType: Bet['type'] | 'HOP_7S',
    targetNumber?: number,
    hopDice?: [DieValue, DieValue]
  ) => {
    e.preventDefault();
    e.stopPropagation();

    let data = draggedItem;
    if (!data) {
      try {
        const rawData = e.dataTransfer.getData('text/plain');
        if (rawData) data = JSON.parse(rawData);
      } catch (err) {
        console.error('Drag data parse error:', err);
      }
    }

    if (!data) return;

    if (targetType === 'HOP_7S') {
      if (data.source === 'CHIP_SELECTOR') {
        handlePlaceHop7sBetWithAmount(3);
      } else if (data.source === 'EXISTING_BET' && data.betId) {
        if (data.betType === ('HOP_7S' as any)) {
          setDraggedItem(null);
          return;
        }
        const nextBets = activeBetsRef.current.filter((b) => b.id !== data?.betId);
        activeBetsRef.current = nextBets;
        setActiveBets(nextBets);

        const nextBank = bankRef.current + data.amount;
        bankRef.current = nextBank;
        setBank(nextBank);

        handlePlaceHop7sBetWithAmount(3);
      }
      setDraggedItem(null);
      return;
    }

    if (data.source === 'CHIP_SELECTOR') {
      handlePlaceBetWithAmount(targetType as Bet['type'], targetNumber, data.amount, hopDice);
    } else if (data.source === 'EXISTING_BET' && data.betId) {
      if (data.betType === ('HOP_7S' as any)) {
        handleRemoveHop7sBets();
        handlePlaceBetWithAmount(targetType as Bet['type'], targetNumber, data.amount, hopDice);
        const destName = BET_NAME_DISPLAY[targetType] || targetType;
        const numStr = targetNumber ? ` ${targetNumber}` : '';
        const hopStr = hopDice ? ` [${hopDice[0]}-${hopDice[1]}]` : '';
        setRecentMessage(`Moved $${formatMoney(data.amount)} Hop 7s bet to ${destName}${numStr}${hopStr}!`);
        setDraggedItem(null);
        return;
      }

      // Check if dropped on same target
      const isSameTarget =
        data.betType === targetType &&
        data.targetNumber === targetNumber &&
        (!hopDice || (data.hopDice?.[0] === hopDice[0] && data.hopDice?.[1] === hopDice[1]));

      if (isSameTarget) {
        setDraggedItem(null);
        return;
      }

      // Remove old bet from source spot
      const nextBets = activeBetsRef.current.filter((b) => b.id !== data?.betId);
      activeBetsRef.current = nextBets;
      setActiveBets(nextBets);

      const nextBank = bankRef.current + data.amount;
      bankRef.current = nextBank;
      setBank(nextBank);

      // Place onto new target
      handlePlaceBetWithAmount(targetType as Bet['type'], targetNumber, data.amount, hopDice);

      const destName = BET_NAME_DISPLAY[targetType] || targetType;
      const numStr = targetNumber ? ` ${targetNumber}` : '';
      const hopStr = hopDice ? ` [${hopDice[0]}-${hopDice[1]}]` : '';
      setRecentMessage(`Moved $${formatMoney(data.amount)} bet to ${destName}${numStr}${hopStr}!`);
    }

    setDraggedItem(null);
  };

  const handleDropOnRack = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let data = draggedItem;
    if (!data) {
      try {
        const rawData = e.dataTransfer.getData('text/plain');
        if (rawData) data = JSON.parse(rawData);
      } catch (err) {
        console.error('Rack parse error:', err);
      }
    }

    if (data && data.source === 'EXISTING_BET' && data.betId) {
      setActiveBets((prev) => {
        const next = prev.filter((b) => b.id !== data?.betId);
        activeBetsRef.current = next;
        return next;
      });
      setBank((prev) => {
        const next = Math.round((prev + data.amount) * 100) / 100;
        bankRef.current = next;
        return next;
      });
      soundManager.playChip();
      setRecentMessage(`Returned $${formatMoney(data.amount)} bet to rack!`);
    }

    setDraggedItem(null);
  };

  // --- Quick Press Controls (Across, Extremes, Outside, Inside) ---
  const handlePressGroup = (group: 'ACROSS' | 'EXTREMES' | 'OUTSIDE' | 'INSIDE') => {
    const groups: Record<string, number[]> = {
      ACROSS: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12],
      EXTREMES: [2, 3, 11, 12],
      OUTSIDE: [2, 3, 4, 10, 11, 12],
      INSIDE: [5, 6, 8, 9],
    };

    const targetNumbers = groups[group] || [];
    if (targetNumbers.length === 0) return;

    const currentBank = bankRef.current;
    if (currentBank <= 0) {
      setRecentMessage('Out of chips! Click REFRESH CHIPS to reload.');
      if (currentBank + totalRisk < 1) setIsAdModalOpen(true);
      return;
    }

    const currentBets = activeBetsRef.current;
    const idealCost = selectedChip * targetNumbers.length;
    let targetPerNum = 0;
    let fallbackCount = 0;

    if (currentBank >= idealCost) {
      targetPerNum = selectedChip;
    } else {
      const perNum = Math.floor((currentBank / targetNumbers.length) * 100) / 100;
      if (perNum >= 0.01) {
        targetPerNum = perNum;
      } else {
        fallbackCount = Math.min(Math.floor(currentBank), targetNumbers.length);
        if (fallbackCount <= 0) {
          setRecentMessage('Not enough chips to distribute across these numbers!');
          return;
        }
      }
    }

    const numbersToProcess = fallbackCount > 0 ? targetNumbers.slice(0, fallbackCount) : targetNumbers;
    const addAmountPerNum = fallbackCount > 0 ? 1 : targetPerNum;

    const additions: { num: number; amount: number }[] = [];
    let totalSpent = 0;

    for (const num of numbersToProcess) {
      const maxLimit = getBetMaxLimit('PLACE', num, currentBets);
      const existingBet = currentBets.find((b) => b.type === 'PLACE' && b.targetNumber === num);
      const currentAmt = existingBet ? existingBet.amount : 0;
      const roomLeft = Math.max(0, maxLimit - currentAmt);
      const actualAdd = Math.min(addAmountPerNum, roomLeft);

      if (actualAdd > 0) {
        additions.push({ num, amount: actualAdd });
        totalSpent += actualAdd;
      }
    }

    totalSpent = Math.round(totalSpent * 100) / 100;

    if (totalSpent <= 0) {
      setRecentMessage(`Selected ${group} numbers are already at the $50,000 maximum limit!`);
      return;
    }

    setBank((prev) => {
      const next = Math.max(0, Math.round((prev - totalSpent) * 100) / 100);
      bankRef.current = next;
      return next;
    });

    setActiveBets((prevBets) => {
      const updated = [...prevBets];
      for (const { num, amount } of additions) {
        const idx = updated.findIndex((b) => b.type === 'PLACE' && b.targetNumber === num);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], amount: updated[idx].amount + amount };
        } else {
          updated.push({
            id: Math.random().toString(36).substring(2, 9),
            type: 'PLACE',
            targetNumber: num,
            amount,
            working: point === null ? placeWorkingOnComeOut : true,
          });
        }
      }
      activeBetsRef.current = updated;
      return updated;
    });

    soundManager.playChip();

    if (currentBank < idealCost) {
      if (fallbackCount > 0) {
        setRecentMessage(`Pressed $1 across ${fallbackCount} numbers with remaining bankroll!`);
      } else {
        setRecentMessage(`Pressed ${group} +$${formatMoney(targetPerNum)} on each with remaining bankroll!`);
      }
    } else {
      setRecentMessage(`Pressed ${group} +$${formatMoney(targetPerNum)} on each number!`);
    }
  };

  // --- Clear Bets ---
  const handleClearBets = () => {
    const locked = activeBetsRef.current.filter((b) => b.isLocked);
    const unlocked = activeBetsRef.current.filter((b) => !b.isLocked);
    const refund = unlocked.reduce((acc, b) => acc + b.amount, 0);

    setBank((prev) => {
      const next = prev + refund;
      bankRef.current = next;
      return next;
    });
    setActiveBets((prev) => {
      const next = prev.filter((b) => b.isLocked);
      activeBetsRef.current = next;
      return next;
    });
    setRecentMessage(
      refund > 0 ? `Cleared $${refund} in unlocked bets.` : 'No unlocked bets to clear.'
    );
  };

  // --- Rebet ---
  const handleRebet = () => {
    if (lastBets.length === 0) {
      setRecentMessage('No previous bet layout to rebet.');
      return;
    }

    // Refund unlocked bets currently on the table
    const unlockedCurrent = activeBetsRef.current.filter((b) => !b.isLocked);
    const refund = unlockedCurrent.reduce((acc, b) => acc + b.amount, 0);
    const lockedCurrent = activeBetsRef.current.filter((b) => b.isLocked);

    // Determine which bets from lastBets need to be placed
    const betsToRebet = lastBets.filter((lb) => {
      // If it's locked and already on the board, keep the board version
      if (lb.isLocked && lockedCurrent.some((cb) => cb.type === lb.type && cb.targetNumber === lb.targetNumber)) {
        return false;
      }
      return true;
    });

    const cost = betsToRebet.reduce((acc, b) => acc + b.amount, 0);
    const netCost = Math.round((cost - refund) * 100) / 100;

    if (bankRef.current < netCost) {
      setRecentMessage(`Insufficient bankroll ($${formatMoney(cost)} needed for REBET).`);
      return;
    }

    setBank((prev) => {
      const next = Math.round((prev - netCost) * 100) / 100;
      bankRef.current = next;
      return next;
    });
    const isComeOut = point === null;
    if (isComeOut) {
      setPlaceWorkingOnComeOut(false);
      placeWorkingOnComeOutRef.current = false;
      setHardsWorking(false);
      hardsWorkingRef.current = false;
      setBoxBetsOffInPoint(false);
    }

    const newBets = betsToRebet.map((b) => ({
      ...b,
      id: Math.random().toString(36).substring(2, 9),
      amount: Math.round(b.amount * 100) / 100,
      ...(isComeOut && (b.type === 'PLACE' || b.type.startsWith('HARD_') || b.type === 'COME_ODDS')
        ? { working: false }
        : {}),
    }));

    const finalRebetArray = [...lockedCurrent, ...newBets];
    activeBetsRef.current = finalRebetArray;
    setActiveBets(finalRebetArray);
    soundManager.playChip();
    setRecentMessage(`Rebet $${formatMoney(cost)} successfully!`);
  };

  // --- Double Bets (2X) ---
  const handleDoubleBets = () => {
    const unlocked = activeBetsRef.current.filter((b) => !b.isLocked);
    const cost = Math.round(unlocked.reduce((acc, b) => acc + b.amount, 0) * 100) / 100;

    if (cost === 0) {
      setRecentMessage('No unlocked bets to double.');
      return;
    }

    if (bankRef.current < cost) {
      setRecentMessage(`Insufficient funds ($${formatMoney(cost)} needed to 2X).`);
      return;
    }

    setBank((prev) => {
      const next = Math.round((prev - cost) * 100) / 100;
      bankRef.current = next;
      return next;
    });
    setActiveBets((prev) => {
      const next = prev.map((b) => {
        if (b.isLocked) return b;
        const maxLimit = getBetMaxLimit(b.type, b.targetNumber, prev);
        return { ...b, amount: Math.round(Math.min(b.amount * 2, maxLimit) * 100) / 100 };
      });
      activeBetsRef.current = next;
      return next;
    });
    soundManager.playChip();
    setRecentMessage(`Doubled unlocked bets (+$${formatMoney(cost)})!`);
  };

  // --- Toggle Come Odds Working on Comeout ---
  const handleToggleComeOddsWorking = (num: number) => {
    setActiveBets((prevBets) => {
      const targetBet = prevBets.find((b) => b.type === 'COME_ODDS' && b.targetNumber === num);
      if (!targetBet) return prevBets;

      const currentWorking = point === null ? (targetBet.working ?? false) : true;
      const nextWorking = !currentWorking;
      setRecentMessage(`Come Odds on ${num} set to ${nextWorking ? 'WORKING (ON)' : 'OFF'} for comeout roll.`);

      return prevBets.map((b) => {
        if (b.type === 'COME_ODDS' && b.targetNumber === num) {
          return { ...b, working: nextWorking };
        }
        return b;
      });
    });
  };

  // --- Remove / Pull Down Single Bet ---
  const handleRemoveBet = (bet: Bet) => {
    if (isBetLocked(bet.type)) {
      setRecentMessage('This bet is locked and cannot be pulled down!');
      return;
    }
    setActiveBets((prev) => {
      const next = prev.filter((b) => b.id !== bet.id);
      activeBetsRef.current = next;
      return next;
    });
    setBank((prev) => {
      const next = Math.round((prev + bet.amount) * 100) / 100;
      bankRef.current = next;
      return next;
    });
    soundManager.playChip();
    const betName = BET_NAME_DISPLAY[bet.type] || bet.type;
    const numStr = bet.targetNumber ? ` ${bet.targetNumber}` : '';
    setRecentMessage(`Pulled down $${formatMoney(bet.amount)} ${betName}${numStr} bet to bank!`);
  };

  // --- Toggle Any Bet Working Status ---
  const handleToggleBetWorking = (betId: string) => {
    setActiveBets((prevBets) => {
      const targetBet = prevBets.find((b) => b.id === betId);
      if (!targetBet) return prevBets;

      const currentWorking = isBetWorking(targetBet, point, placeWorkingOnComeOut, hardsWorking);
      const nextWorking = !currentWorking;
      const betName = BET_NAME_DISPLAY[targetBet.type] || targetBet.type;
      const numStr = targetBet.targetNumber ? ` ${targetBet.targetNumber}` : '';
      setRecentMessage(`${betName}${numStr} set to ${nextWorking ? 'WORKING (ON)' : 'OFF'}.`);

      return prevBets.map((b) => {
        if (b.id === betId) {
          return { ...b, working: nextWorking };
        }
        return b;
      });
    });
  };

  // --- Calculate if Box Number Bets are Working ---
  const areBoxBetsWorking = (() => {
    const placeBets = activeBets.filter((b) => b.type === 'PLACE');
    if (placeBets.length > 0) {
      return placeBets.some((b) => isBetWorking(b, point, placeWorkingOnComeOut, hardsWorking));
    }
    return point === null ? placeWorkingOnComeOut : !boxBetsOffInPoint;
  })();

  // --- Toggle All Box Number Bets Working Status ---
  const handleToggleAllBoxBetsWorking = () => {
    const nextWorking = !areBoxBetsWorking;

    setPlaceWorkingOnComeOut(nextWorking);
    setBoxBetsOffInPoint(!nextWorking);

    setActiveBets((prevBets) => {
      return prevBets.map((b) => {
        if (b.type === 'PLACE') {
          return { ...b, working: nextWorking };
        }
        return b;
      });
    });

    soundManager.playChip();
    setRecentMessage(`All box number bets set to ${nextWorking ? 'WORKING (ON)' : 'OFF'}.`);
  };

  // --- Calculate if Hardway Bets are Working ---
  const areHardsWorking = (() => {
    const hardBets = activeBets.filter((b) => b.type.startsWith('HARD_'));
    if (hardBets.length > 0) {
      return hardBets.some((b) => isBetWorking(b, point, placeWorkingOnComeOut, hardsWorking));
    }
    return point === null ? hardsWorking : true;
  })();

  // --- Toggle All Hardway Bets Working Status ---
  const handleToggleHardsWorking = () => {
    const nextWorking = !areHardsWorking;

    setHardsWorking(nextWorking);
    hardsWorkingRef.current = nextWorking;

    setActiveBets((prevBets) => {
      const updated = prevBets.map((b) => {
        if (b.type.startsWith('HARD_')) {
          return { ...b, working: nextWorking };
        }
        return b;
      });
      activeBetsRef.current = updated;
      return updated;
    });

    soundManager.playChip();
    setRecentMessage(`All Hardway bets set to ${nextWorking ? 'WORKING (ON)' : 'OFF'}.`);
  };

  // --- Reset Bankroll ---
  const handleResetBank = () => {
    bankRef.current = 10000;
    activeBetsRef.current = [];
    pointRef.current = null;
    atsStateRef.current = initialAtsState();

    setBank(10000);
    setActiveBets([]);
    setPoint(null);
    setAtsState(initialAtsState());
    setRecentMessage('Bankroll reset to $10,000!');
  };

  // --- Roll Dice Executer ---
  const executeRoll = () => {
    if (isRollingRef.current) return;
    isRollingRef.current = true;
    setIsRolling(true);

    soundManager.warmBoot();

    const currentBets = activeBetsRef.current;
    const currentPoint = pointRef.current;
    const currentAts = atsStateRef.current;
    const currentBank = bankRef.current;
    const currentPlaceWorking = placeWorkingOnComeOutRef.current;
    const currentAutoRebet = autoRebetRef.current;
    const currentHardsWorking = hardsWorkingRef.current;

    // Save current layout for rebet
    setLastBets(currentBets.map((b) => ({ ...b })));

    soundManager.playDiceRoll();

    let animCount = 0;
    const animInterval = setInterval(() => {
      animCount++;
      const rand1 = (Math.floor(Math.random() * 6) + 1) as DieValue;
      const rand2 = (Math.floor(Math.random() * 6) + 1) as DieValue;
      setLastRoll({
        die1: rand1,
        die2: rand2,
        total: rand1 + rand2,
        timestamp: Date.now(),
      });

      if (animCount >= 2) {
        clearInterval(animInterval);

        const finalDie1 = (Math.floor(Math.random() * 6) + 1) as DieValue;
        const finalDie2 = (Math.floor(Math.random() * 6) + 1) as DieValue;
        const finalTotal = finalDie1 + finalDie2;

        const newRoll: DiceRoll = {
          die1: finalDie1,
          die2: finalDie2,
          total: finalTotal,
          timestamp: Date.now(),
        };

        setLastRoll(newRoll);
        setRollHistory((prev) => [newRoll, ...prev]);

        // Engine Processing with fresh state from refs
        const prevAts = currentAts;
        const hadAtsBetsBeforeRoll = currentBets.some(
          (b) => (b.type === 'ATS_SMALL' || b.type === 'ATS_TALL' || b.type === 'ATS_ALL') && b.amount > 0
        );
        if (hadAtsBetsBeforeRoll) {
          atsHadBetsThisRunRef.current = true;
        }

        const result = processRoll(
          newRoll,
          currentPoint,
          currentBets,
          currentAts,
          currentPlaceWorking,
          currentAutoRebet,
          currentHardsWorking
        );

        // Synchronously update state refs before React async re-render completes
        pointRef.current = result.nextPoint;
        activeBetsRef.current = result.updatedBets;
        atsStateRef.current = result.updatedAts;

        setPoint(result.nextPoint);
        setActiveBets(result.updatedBets);
        setAtsState(result.updatedAts);

        // Check ATS Milestones
        const justHitAll = result.updatedAts.allWon && !prevAts.allWon;
        const justHitSmall = result.updatedAts.smallWon && !prevAts.smallWon;
        const justHitTall = result.updatedAts.tallWon && !prevAts.tallWon;

        // Financial Updates
        const { totalPayout, totalLoss, netChange, messages } = result.outcome;
        const updatedBank = currentBank + totalPayout;
        bankRef.current = updatedBank;
        setBank(updatedBank);

        // Check if player had active or historical ATS bets for this ATS run
        const hadAtsPayout = result.outcome.payouts.some(
          (p) => p.betType === 'ATS_SMALL' || p.betType === 'ATS_TALL' || p.betType === 'ATS_ALL'
        );
        const hasAnyAtsBets =
          hadAtsBetsBeforeRoll ||
          atsHadBetsThisRunRef.current ||
          hadAtsPayout ||
          currentBets.some((b) => b.type.startsWith('ATS_')) ||
          activeBetsRef.current.some((b) => b.type.startsWith('ATS_'));

        // Reset working toggles and stop auto-roll on any 7 roll (7-out or comeout 7)
        if (finalTotal === 7) {
          atsHadBetsThisRunRef.current = false;
          setAutoRoll(false);
          autoRollRef.current = false;
          if (autoRollTimerRef.current) {
            clearTimeout(autoRollTimerRef.current);
            autoRollTimerRef.current = null;
          }

          setPlaceWorkingOnComeOut(false);
          placeWorkingOnComeOutRef.current = false;

          setHardsWorking(false);
          hardsWorkingRef.current = false;

          setBoxBetsOffInPoint(false);
        } else if (currentPoint === null && result.nextPoint !== null) {
          // Point is established: reset come-out working state flags so default ON applies during point
          setPlaceWorkingOnComeOut(false);
          placeWorkingOnComeOutRef.current = false;

          setHardsWorking(false);
          hardsWorkingRef.current = false;

          setBoxBetsOffInPoint(false);
        }

        // Audio & Celebration Trigger Logic
        if (justHitAll) {
          if (hasAnyAtsBets) {
            soundManager.playAllFunkJam();
          } else {
            soundManager.playAllDisappointedJam();
          }
        } else if (justHitSmall || justHitTall) {
          if (hasAnyAtsBets) {
            soundManager.playSmallTallWin();
          } else {
            soundManager.playCrowdSigh();
          }
        } else if (finalTotal === 7) {
          // Soothing 808 Double Bass Kick on 7
          soundManager.playSevenOut();
        } else if (totalPayout > 0) {
          // Soothing warm win chord
          soundManager.playWin();
        }

        // Trigger AI Stickman Roll Callout if turned ON
        if (isStickmanCalloutsOnRef.current) {
          triggerStickmanCallout({
            die1: finalDie1,
            die2: finalDie2,
            total: finalTotal,
            point: currentPoint,
            isComeOut: currentPoint === null,
            isSevenOut: currentPoint !== null && finalTotal === 7,
            isPointHit: currentPoint !== null && finalTotal === currentPoint,
          });
        }

        // Low Chips check (bank + active risk < 1)
        const updatedRisk = result.updatedBets.reduce((acc, b) => acc + b.amount, 0);
        if (updatedBank + updatedRisk < 1) {
          setAutoRoll(false);
          autoRollRef.current = false;
          if (autoRollTimerRef.current) {
            clearTimeout(autoRollTimerRef.current);
            autoRollTimerRef.current = null;
          }
          setTimeout(() => {
            setIsAdModalOpen(true);
          }, 800);
        }

        // Stats Update
        setGameStats((prev) => {
          const dist = { ...prev.rollDistribution };
          dist[finalTotal] = (dist[finalTotal] || 0) + 1;

          return {
            totalRolls: prev.totalRolls + 1,
            totalWins: totalPayout > 0 ? prev.totalWins + 1 : prev.totalWins,
            totalLosses: totalLoss > 0 ? prev.totalLosses + 1 : prev.totalLosses,
            biggestWin: Math.max(prev.biggestWin, totalPayout),
            rollDistribution: dist,
            sevenOutCount: finalTotal === 7 && currentPoint !== null ? prev.sevenOutCount + 1 : prev.sevenOutCount,
            atsSmallHitsCount: result.updatedAts.smallWon ? prev.atsSmallHitsCount + 1 : prev.atsSmallHitsCount,
            atsTallHitsCount: result.updatedAts.tallWon ? prev.atsTallHitsCount + 1 : prev.atsTallHitsCount,
            atsAllHitsCount: result.updatedAts.allWon ? prev.atsAllHitsCount + 1 : prev.atsAllHitsCount,
          };
        });

        const mainMsg = messages.length > 0 ? messages.join(' | ') : `Rolled ${finalTotal}`;
        const netMsg = netChange > 0 ? ` (+ $${formatMoney(netChange)})` : netChange < 0 ? ` (- $${formatMoney(Math.abs(netChange))})` : '';
        setRecentMessage(`${mainMsg}${netMsg}`);

        isRollingRef.current = false;
        setIsRolling(false);

        if (autoRollRef.current) {
          scheduleAutoRoll(1700);
        }
      }
    }, 20);
  };

  const handleToggleAutoRoll = () => {
    setAutoRoll((prev) => {
      const next = !prev;
      autoRollRef.current = next;
      if (next && !isRollingRef.current) {
        scheduleAutoRoll(1700);
      } else if (!next) {
        if (autoRollTimerRef.current) {
          clearTimeout(autoRollTimerRef.current);
          autoRollTimerRef.current = null;
        }
      }
      return next;
    });
  };

  return (
    <div
      onPointerDownCapture={recordUserTouch}
      onTouchStartCapture={recordUserTouch}
      className="w-full min-h-screen bg-[#070d0a] text-white flex flex-col font-sans justify-between overflow-x-hidden selection:bg-amber-400 selection:text-black"
      style={{ paddingBottom: 'calc(13rem + max(0px, env(safe-area-inset-bottom)))' }}
    >
      {/* 1. Top Header Navigation */}
      <HeaderBar
        bank={bank}
        risk={totalRisk}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenRefreshModal={() => {
          if (bank + totalRisk < 1) {
            setIsAdModalOpen(true);
          } else {
            setRecentMessage('REFRESH CHIPS is available when your balance is under $1.');
          }
        }}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Dice Roller & Point Indicator Bar */}
      <DiceBar
        lastRoll={lastRoll}
        point={point}
        isRolling={isRolling}
        onRoll={executeRoll}
        autoRoll={autoRoll}
        onToggleAutoRoll={handleToggleAutoRoll}
        bets={activeBets}
        onPlaceHop7sBet={() => handlePlaceHop7sBetWithAmount(3)}
        onPointerDownHop7sBet={(e) => {
          const { total } = getHop7sTotalAmount(activeBets);
          if (total > 0) {
            handlePointerDownStart(e, {
              source: 'EXISTING_BET',
              amount: total,
              betType: 'HOP_7S' as any,
              betId: 'HOP_7S',
            });
          }
        }}
        onDropOnTarget={(e, targetType) => handleDropOnTarget(e, targetType as any)}
      />

      {/* Interactive Roll History Strip */}
      <RollHistoryStrip rollHistory={rollHistory} />

      {/* 3. Main Crapless Craps Table Felt Canvas */}
      {(() => {
        const activeDraggingBetId =
          (dragPointerState?.isDragging && dragPointerState.payload.source === 'EXISTING_BET'
            ? dragPointerState.payload.betId
            : undefined) ||
          (draggedItem?.source === 'EXISTING_BET' ? draggedItem.betId : undefined);

        return (
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-2 flex-1 flex flex-col justify-start">
            {/* ATS BONUS Card Section */}
            <AtsBonusBoard
              atsState={atsState}
              point={point}
              bets={activeBets}
              selectedChip={selectedChip}
              areBoxBetsWorking={areBoxBetsWorking}
              onToggleAllBoxBetsWorking={handleToggleAllBoxBetsWorking}
              onPlaceBet={(type) => handlePlaceBet(type)}
              onDragStartBet={handleDragStartBet}
              onPointerDownBet={(e, bet) =>
                handlePointerDownStart(e, {
                  source: 'EXISTING_BET',
                  amount: bet.amount,
                  betId: bet.id,
                  betType: bet.type,
                  targetNumber: bet.targetNumber,
                  hopDice: bet.hopDice,
                })
              }
              onDropOnTarget={handleDropOnTarget}
              draggingBetId={activeDraggingBetId}
              isStickmanCalloutsOn={isStickmanCalloutsOn}
              onToggleStickmanCallouts={() => setIsStickmanCalloutsOn((prev) => !prev)}
            />

            {/* Quick Press Controls */}
            <PressControls onPress={handlePressGroup} />

            {/* Place Numbers 10-Card Grid (2,3,4,5,6 / 8,9,10,11,12) with Come Travel & Odds box */}
            <PlaceNumbersGrid
              point={point}
              bets={activeBets}
              placeWorkingOnComeOut={placeWorkingOnComeOut}
              hardsWorking={areHardsWorking}
              onPlaceBet={(type, num) => handlePlaceBet(type, num)}
              onToggleComeOddsWorking={handleToggleComeOddsWorking}
              onToggleBetWorking={handleToggleBetWorking}
              onRemoveBet={handleRemoveBet}
              onDragStartBet={handleDragStartBet}
              onPointerDownBet={(e, bet) =>
                handlePointerDownStart(e, {
                  source: 'EXISTING_BET',
                  amount: bet.amount,
                  betId: bet.id,
                  betType: bet.type,
                  targetNumber: bet.targetNumber,
                  hopDice: bet.hopDice,
                })
              }
              onDropOnTarget={handleDropOnTarget}
              draggingBetId={activeDraggingBetId}
            />

            {/* Main Line Wagers: PASS LINE, ODDS, FIELD, COME */}
            <MainLineBets
              point={point}
              bets={activeBets}
              placeWorkingOnComeOut={placeWorkingOnComeOut}
              hardsWorking={areHardsWorking}
              onPlaceBet={(type) => handlePlaceBet(type)}
              onToggleBetWorking={handleToggleBetWorking}
              onRemoveBet={handleRemoveBet}
              onDragStartBet={handleDragStartBet}
              onPointerDownBet={(e, bet) =>
                handlePointerDownStart(e, {
                  source: 'EXISTING_BET',
                  amount: bet.amount,
                  betId: bet.id,
                  betType: bet.type,
                  targetNumber: bet.targetNumber,
                  hopDice: bet.hopDice,
                })
              }
              onDropOnTarget={handleDropOnTarget}
              draggingBetId={activeDraggingBetId}
            />

            {/* Hards, Horns & Hops Panel */}
            <HardsAndHorns
              bets={activeBets}
              point={point}
              placeWorkingOnComeOut={placeWorkingOnComeOut}
              hardsWorking={areHardsWorking}
              onToggleHardsWorking={handleToggleHardsWorking}
              onToggleBetWorking={handleToggleBetWorking}
              onRemoveBet={handleRemoveBet}
              onPlaceBet={(type, targetNum, hopDice) => handlePlaceBet(type, targetNum, hopDice)}
              onDragStartBet={handleDragStartBet}
              onPointerDownBet={(e, bet) =>
                handlePointerDownStart(e, {
                  source: 'EXISTING_BET',
                  amount: bet.amount,
                  betId: bet.id,
                  betType: bet.type,
                  targetNumber: bet.targetNumber,
                  hopDice: bet.hopDice,
                })
              }
              onDropOnTarget={handleDropOnTarget}
              draggingBetId={activeDraggingBetId}
            />
          </main>
        );
      })()}

      {/* 4. FLOATING BOTTOM CHIP RACK & ACTION BAR */}
      <footer
        data-rack="true"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleDropOnRack}
        className="w-full bg-[#09110d] fixed bottom-0 left-0 right-0 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] border-t border-[#1a3123]"
        style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
      >
        <div className="w-full max-w-5xl mx-auto flex flex-col">
          <ChipSelector
            selectedChip={selectedChip}
            onSelectChip={(amt) => {
              setSelectedChip(amt);
              soundManager.playChip();
            }}
            onDragStartChip={handleDragStartChip}
            onPointerDownChip={(e, amt) =>
              handlePointerDownStart(e, {
                source: 'CHIP_SELECTOR',
                amount: amt,
              })
            }
          />

          <BottomActionBar
            onClear={handleClearBets}
            onRebet={handleRebet}
            autoRebet={autoRebet}
            onToggleAutoRebet={() => setAutoRebet((prev) => !prev)}
            onDoubleBets={handleDoubleBets}
          />
        </div>
      </footer>

      {/* Floating Dragged Chip Visual Follower */}
      {dragPointerState && dragPointerState.isDragging && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl scale-125 transition-transform"
          style={{ left: `${dragPointerState.x}px`, top: `${dragPointerState.y}px` }}
        >
          <ChipGraphic
            amount={dragPointerState.payload.amount}
            size="md"
            isClear={dragPointerState.payload.betType === ('HOP_7S' as any)}
          />
        </div>
      )}

      {/* 5. Analytics & History Modal */}
      <RollHistoryModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        history={rollHistory}
        stats={gameStats}
      />

      {/* 6. Crapless Craps Rules & Guide Modal */}
      <HelpRulesModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)}
        onOpenUmpConsent={() => showUmpPrivacyOptions()}
      />

      {/* 6b. In-App Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onOpenUmpConsent={() => showUmpPrivacyOptions()}
      />

      {/* 7. Ad Reward Refresh Chips Modal */}
      <AdRewardModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onReward={(amt) => {
          setBank((prev) => prev + amt);
          setRecentMessage(`Added +$${amt.toLocaleString()} chips to your bankroll!`);
        }}
      />
    </div>
  );
}
