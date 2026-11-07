import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import type { AppScreen } from './src/pose/types';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * Camera screens pull in Vision Camera + MediaPipe. Lazy-load them so a plugin
 * init failure cannot crash the app before the home screen mounts.
 */
const CalibrateScreen = lazy(() =>
  import('./src/screens/CalibrateScreen').then((m) => ({
    default: m.CalibrateScreen,
  }))
);
const CountScreen = lazy(() =>
  import('./src/screens/CountScreen').then((m) => ({
    default: m.CountScreen,
  }))
);

/**
 * Minimal loading fallback shown while a camera screen chunk loads.
 */
function ScreenLoader(): React.JSX.Element {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#111" />
      <Text style={styles.loaderText}>Loading…</Text>
    </View>
  );
}

/**
 * Root screen switcher for the exercise counter prototype.
 */
export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<AppScreen>({ name: 'home' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [boundaryKey, setBoundaryKey] = useState(0);

  useEffect(() => {
    SplashScreen.hideAsync().catch((error) => {
      console.warn('[App] SplashScreen.hideAsync failed', error);
    });
  }, []);

  return (
    <ErrorBoundary
      key={boundaryKey}
      onReset={() => {
        setScreen({ name: 'home' });
        setBoundaryKey((k) => k + 1);
      }}
    >
      <Suspense fallback={<ScreenLoader />}>
        {screen.name === 'calibrate' ? (
          <CalibrateScreen
            exerciseName={screen.exerciseName}
            onCancel={() => setScreen({ name: 'home' })}
            onDone={() => {
              setRefreshKey((k) => k + 1);
              setScreen({ name: 'home' });
            }}
          />
        ) : screen.name === 'count' ? (
          <CountScreen
            exerciseName={screen.exerciseName}
            onBack={() => setScreen({ name: 'home' })}
          />
        ) : (
          <HomeScreen
            refreshKey={refreshKey}
            onCreate={(exerciseName) =>
              setScreen({ name: 'calibrate', exerciseName })
            }
            onSelect={(exerciseName) =>
              setScreen({ name: 'count', exerciseName })
            }
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  loaderText: {
    color: '#111',
    fontSize: 16,
  },
});
