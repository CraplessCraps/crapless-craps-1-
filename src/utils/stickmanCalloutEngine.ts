// Instant Local Crapless Craps Stickman Callout Engine (Zero Latency)
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export interface RollCalloutData {
  die1: number;
  die2: number;
  total: number;
  point: number | null;
  isComeOut: boolean;
  isSevenOut: boolean;
  isPointHit: boolean;
}

// Very short, authentic Vegas Crapless Craps stickman callouts (1-4 words max)
const CALLOUT_LIBRARY: Record<number, { hard?: string[]; easy?: string[]; default: string[] }> = {
  2: {
    default: [
      'Snake eyes, 2!',
      'Aces!',
      'Snake eyes!',
      'Dot dot!',
    ],
  },
  3: {
    default: [
      'Ace deuce!',
      'Ace deuce, 3!',
      'Tre!',
    ],
  },
  4: {
    hard: ['Hard 4!', 'Deuce deuce, hard four!', '4 the hard way!'],
    easy: ['Easy 4!', '4 easy!', 'Little Joe, 4!'],
    default: ['Little Joe, 4!'],
  },
  5: {
    default: [
      'Fever 5!',
      'Fever five, 5!',
      'Cinco!',
      'Five alive!',
    ],
  },
  6: {
    hard: ['Hard 6!', '6 the hard way!'],
    easy: ['Easy 6!', '6 and 8 are running mates!', '6 easy!'],
    default: ['6 and 8 are running mates!', "6 of-'em!"],
  },
  7: {
    default: ['7 on the line!'],
  },
  8: {
    hard: ['Hard 8!', 'Square pair, 8!', '8 hard way!'],
    easy: ['Easy 8!', '8 easy!', '8 the easy way!'],
    default: ['Easy 8!', '8 on the board!'],
  },
  9: {
    default: [
      'Centerfield 9!',
      'Nina from Pasadena, 9!',
      'Nine, centerfield!',
      'Nina, 9!',
    ],
  },
  10: {
    hard: ['Hard 10!', 'Pair of 5s, 10!', '10 hard way!'],
    easy: ['Easy 10!', '10 easy!', 'Big 10!'],
    default: ['Big 10!', '10 on the felt!'],
  },
  11: {
    default: [
      'Yo 11!',
      'Yo-leven!',
      'Six-five yo!',
      'Yo eleven!',
    ],
  },
  12: {
    default: [
      'Boxcars!',
      'Boxcars, 12!',
      'Midnight 12!',
      'Twelve, boxcars!',
    ],
  },
};

const COME_OUT_7_CALLOUTS = [
  'Winner 7!',
  'Winner 7 come out!',
  'Front line winner 7!',
  'Seven winner!',
];

const SEVEN_OUT_CALLOUTS = [
  'Seven out, line away!',
  '7 out!',
  'Seven out, pay the line!',
  'Big red 7 out!',
];

const POINT_HIT_CALLOUTS = [
  'Winner, point hit!',
  'Winner!',
  'Point hit, pay the line!',
  'Winner, winner!',
];

function speakWebSpeech(cleanText: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    // Cancel any ongoing speech immediately for instant response
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Fast rate so it finishes well within 1.5 - 2 seconds during Auto-Roll
    utterance.rate = 1.35;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('george') ||
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('google'))
      ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Web SpeechSynthesis error:', e);
  }
}

export async function speakStickmanCallout(data: RollCalloutData): Promise<void> {
  const { die1, die2, total, isComeOut, isSevenOut, isPointHit } = data;
  const isHard = die1 === die2 && [4, 6, 8, 10].includes(total);

  let phraseOptions: string[] = [];

  if (isComeOut && total === 7) {
    phraseOptions = COME_OUT_7_CALLOUTS;
  } else if (isSevenOut) {
    phraseOptions = SEVEN_OUT_CALLOUTS;
  } else if (isPointHit) {
    phraseOptions = POINT_HIT_CALLOUTS;
  } else {
    const entry = CALLOUT_LIBRARY[total];
    if (entry) {
      if (isHard && entry.hard) {
        phraseOptions = entry.hard;
      } else if (!isHard && entry.easy) {
        phraseOptions = entry.easy;
      } else {
        phraseOptions = entry.default;
      }
    } else {
      phraseOptions = [`Roll is ${total}!`];
    }
  }

  const selectedPhrase = phraseOptions[Math.floor(Math.random() * phraseOptions.length)];
  const cleanText = selectedPhrase.replace(/[*_#]/g, '');

  const isNative = Capacitor.isNativePlatform() || (typeof window !== 'undefined' && Capacitor.getPlatform() !== 'web');

  if (isNative) {
    try {
      await TextToSpeech.stop();
      await TextToSpeech.speak({
        text: cleanText,
        lang: 'en-US',
        rate: 1.2,
        pitch: 0.95,
        volume: 1.0,
        category: 'ambient',
      });
      return;
    } catch (e) {
      console.warn('Native Capacitor TextToSpeech failed, falling back to Web Speech API:', e);
    }
  }

  // Fallback or Web platform
  speakWebSpeech(cleanText);
}
