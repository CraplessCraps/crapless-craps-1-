import { AdMob, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export const ADMOB_CONFIG = {
  // Your Google AdMob App ID
  APP_ID: 'ca-app-pub-6597311189645426~7681439610',

  // Your Rewarded Video Ad Unit ID
  REWARDED_AD_UNIT_ID: 'ca-app-pub-6597311189645426/7277127858',

  // Rewarded Chip payout amount
  REWARD_CHIP_AMOUNT: 50000,

  // Set to true when testing locally or on test devices
  IS_TESTING: false,
};

let isAdMobInitialized = false;

/**
 * Executes Google User Messaging Platform (UMP) consent SDK flow
 * before AdMob initialization on native platforms.
 */
async function handleUmpConsent(): Promise<void> {
  try {
    const consentInfo = await AdMob.requestConsentInfo();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
      await AdMob.showConsentForm();
    }
  } catch (err) {
    console.warn('Google UMP Consent request note:', err);
  }
}

async function initNativeAdMob(): Promise<boolean> {
  if (isAdMobInitialized) return true;
  try {
    await handleUmpConsent();
    await AdMob.initialize({
      initializeForTesting: ADMOB_CONFIG.IS_TESTING,
    });
    isAdMobInitialized = true;
    return true;
  } catch (e) {
    console.warn('AdMob initialize failed or not on native platform:', e);
    return false;
  }
}

/**
 * Triggers Google UMP Privacy Options form so users can view or revoke consent.
 */
export async function showUmpPrivacyOptions(): Promise<boolean> {
  const isNative = Capacitor.isNativePlatform() || (typeof window !== 'undefined' && Capacitor.getPlatform() !== 'web');
  if (isNative) {
    try {
      await AdMob.showPrivacyOptionsForm();
      return true;
    } catch (e) {
      console.warn('Native UMP Privacy Options Form error, resetting consent info:', e);
      try {
        await AdMob.resetConsentInfo();
        const consentInfo = await AdMob.requestConsentInfo();
        if (consentInfo.isConsentFormAvailable) {
          await AdMob.showConsentForm();
          return true;
        }
      } catch (e2) {
        console.warn('Reset consent info failed:', e2);
      }
    }
  } else {
    alert('Google UMP Privacy Form is active on native Android/iOS builds when serving AdMob ads.');
  }
  return false;
}

/**
 * Helper function to trigger a rewarded ad.
 * Automatically handles native AdMob SDK when available on Android/iOS APK,
 * or fallback simulation on web preview.
 */
export async function showRewardedAd(
  onSuccess: (rewardAmount: number) => void,
  onProgress?: (percent: number) => void
): Promise<void> {
  const rewardAmount = ADMOB_CONFIG.REWARD_CHIP_AMOUNT;
  const isNative = Capacitor.isNativePlatform() || (typeof window !== 'undefined' && Capacitor.getPlatform() !== 'web');

  if (isNative) {
    const initialized = await initNativeAdMob();
    if (initialized) {
      try {
        let rewardEarned = false;

        const rewardSub = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
          console.log('User earned reward:', reward);
          rewardEarned = true;
        });

        const dismissSub = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          rewardSub.remove();
          dismissSub.remove();
          if (rewardEarned) {
            onSuccess(rewardAmount);
          }
        });

        const failedSub = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
          console.warn('Rewarded ad failed to load:', err);
          rewardSub.remove();
          dismissSub.remove();
          failedSub.remove();
        });

        await AdMob.prepareRewardVideoAd({
          adId: ADMOB_CONFIG.REWARDED_AD_UNIT_ID,
          isTesting: ADMOB_CONFIG.IS_TESTING,
        });

        await AdMob.showRewardVideoAd();
        return;
      } catch (e) {
        console.warn('Native AdMob show error, falling back to simulated presentation:', e);
      }
    }
  }

  // Web Preview / Fallback simulated ad presentation
  const durationSeconds = 5; // 5-second simulated video presentation
  const intervalTime = 100;
  const totalSteps = (durationSeconds * 1000) / intervalTime;
  let step = 0;

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      step++;
      const currentProg = Math.min(Math.round((step / totalSteps) * 100), 100);
      if (onProgress) onProgress(currentProg);

      if (step >= totalSteps) {
        clearInterval(timer);
        onSuccess(rewardAmount);
        resolve();
      }
    }, intervalTime);
  });
}

