const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin that marks this app as a Wear OS app.
 *
 * Injects three things into AndroidManifest.xml:
 *  1. <uses-feature android:name="android.hardware.type.watch" required="true" />
 *  2. <meta-data android:name="com.google.android.wearable.standalone" value="true" />
 *  3. <uses-library android:name="com.google.android.wearable" required="false" />
 */
module.exports = function withWearOS(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // 1. Declare that this app requires watch hardware
    if (!manifest['uses-feature']) {
      manifest['uses-feature'] = [];
    }

    const alreadyHasWatchFeature = manifest['uses-feature'].some(
      (f) => f.$?.['android:name'] === 'android.hardware.type.watch'
    );

    if (!alreadyHasWatchFeature) {
      manifest['uses-feature'].push({
        $: {
          'android:name': 'android.hardware.type.watch',
          'android:required': 'true',
        },
      });
    }

    const app = manifest.application?.[0];
    if (!app) return cfg;

    // 2. Mark as standalone (doesn't require a companion phone app)
    if (!app['meta-data']) {
      app['meta-data'] = [];
    }

    const alreadyHasStandalone = app['meta-data'].some(
      (m) => m.$?.['android:name'] === 'com.google.android.wearable.standalone'
    );

    if (!alreadyHasStandalone) {
      app['meta-data'].push({
        $: {
          'android:name': 'com.google.android.wearable.standalone',
          'android:value': 'true',
        },
      });
    }

    // 3. Reference the wearable library (optional — not all watches have it)
    if (!app['uses-library']) {
      app['uses-library'] = [];
    }

    const alreadyHasWearLib = app['uses-library'].some(
      (l) => l.$?.['android:name'] === 'com.google.android.wearable'
    );

    if (!alreadyHasWearLib) {
      app['uses-library'].push({
        $: {
          'android:name': 'com.google.android.wearable',
          'android:required': 'false',
        },
      });
    }

    return cfg;
  });
};
