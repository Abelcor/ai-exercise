import React, { Suspense, lazy, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import type { AppScreen } from './src/pose/types';

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
    </View>
  );
}

/**
 * Root screen switcher for the exercise counter prototype.
 * Keeps navigation intentionally minimal — no router library.
 */
export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<AppScreen>({ name: 'home' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [boundaryKey, setBoundaryKey] = useState(0);

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
  },
});
