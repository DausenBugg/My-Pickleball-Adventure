import { TestIds } from 'react-native-google-mobile-ads';

/**
 * AdMob ad unit IDs for each screen.
 *
 * Replace each value with your real ad unit ID from the AdMob console.
 * Test ads are shown automatically in __DEV__ mode via the AdBanner component.
 *
 * Format: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
 */
export const AD_UNIT_IDS = {
  HOME_BANNER: 'ca-app-pub-7596986183502466/4273399141',
  SEARCH_BANNER: 'ca-app-pub-7596986183502466/2693548577',
  ADD_MATCH_BANNER: 'ca-app-pub-7596986183502466/9067385235',
  LEADERBOARD_BANNER: 'ca-app-pub-7596986183502466/8515896486',
  SETTINGS_BANNER: 'ca-app-pub-7596986183502466/7554168600',
} as const;

/**
 * Returns the appropriate ad unit ID — test IDs in dev, real IDs in production.
 */
export function getAdUnitId(id: string): string {
  return __DEV__ ? TestIds.ADAPTIVE_BANNER : id;
}
