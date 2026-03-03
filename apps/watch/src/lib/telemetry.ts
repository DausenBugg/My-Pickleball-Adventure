import AsyncStorage from '@react-native-async-storage/async-storage';

const TELEMETRY_KEY = '@watch/telemetry/recent';
const MAX_EVENTS = 100;

type TelemetryEntry = {
  timestamp: string;
  eventName: string;
  details?: Record<string, unknown>;
};

export async function getTelemetryLog(): Promise<TelemetryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(TELEMETRY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed as TelemetryEntry[];
  } catch {
    return [];
  }
}

export function recordTelemetry(eventName: string, details?: Record<string, unknown>) {
  const entry: TelemetryEntry = {
    timestamp: new Date().toISOString(),
    eventName,
    details,
  };

  if (__DEV__) {
    console.log('[watch-telemetry]', entry);
  }

  void (async () => {
    try {
      const existing = await getTelemetryLog();
      const next = [entry, ...existing].slice(0, MAX_EVENTS);
      await AsyncStorage.setItem(TELEMETRY_KEY, JSON.stringify(next));
    } catch (error) {
      if (__DEV__) {
        console.warn('[watch-telemetry] persist failed', error);
      }
    }
  })();
}
