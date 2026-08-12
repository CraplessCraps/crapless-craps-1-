// Voice Audio playback helper (Gemini TTS base64 + Web Speech API fallback)

let activeAudio: HTMLAudioElement | null = null;

export async function playVoiceAudio(base64Audio: string | null, textToSpeak: string): Promise<void> {
  // Stop any ongoing speech or audio
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }

  if (base64Audio) {
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Gemini TTS outputs PCM or WAV. We wrap in a blob
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeAudio = audio;

      await audio.play();
      return;
    } catch (err) {
      console.warn('Primary audio playback error, falling back to Web Speech API:', err);
    }
  }

  // Fallback to Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && textToSpeak) {
    const cleanText = textToSpeak.replace(/[*_#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.15;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('male') ||
         v.name.toLowerCase().includes('david') ||
         v.name.toLowerCase().includes('george') ||
         v.name.toLowerCase().includes('natural') ||
         v.name.toLowerCase().includes('google'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (maleVoice) utterance.voice = maleVoice;
    window.speechSynthesis.speak(utterance);


  }
}

// Browser Speech Recognition Helper
export function createSpeechRecognition(
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (err: any) => void,
  options?: { continuous?: boolean }
) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = options?.continuous ?? true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let transcript = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }
    onResult(transcript, isFinal);
  };

  if (onError) {
    recognition.onerror = onError;
  }

  return recognition;
}
