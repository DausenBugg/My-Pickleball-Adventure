import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import { getAdUnitId } from '../lib/adUnitIds';

interface AdBannerProps {
  /** The raw ad unit ID from adUnitIds.ts (test IDs auto-resolve in __DEV__) */
  adUnitId: string;
  /** Optional size override — defaults to ANCHORED_ADAPTIVE_BANNER */
  size?: BannerAdSize;
}

/**
 * Reusable AdMob banner component.
 * Automatically uses test ads in development and real ads in production.
 * Gracefully hides itself if the ad fails to load.
 */
export default function AdBanner({
  adUnitId,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}: AdBannerProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={getAdUnitId(adUnitId)}
        size={size}
        onAdFailedToLoad={(error) => {
          if (__DEV__) console.warn('Ad failed to load:', error);
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
});
