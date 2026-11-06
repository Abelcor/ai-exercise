import React, { useState } from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { CalibrateScreen } from './src/screens/CalibrateScreen';
import { CountScreen } from './src/screens/CountScreen';
import type { AppScreen } from './src/pose/types';

/**
 * Root screen switcher for the exercise counter prototype.
 * Keeps navigation intentionally minimal — no router library.
 */
export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<AppScreen>({ name: 'home' });
  const [refreshKey, setRefreshKey] = useState(0);

  if (screen.name === 'calibrate') {
    return (
      <CalibrateScreen
        exerciseName={screen.exerciseName}
        onCancel={() => setScreen({ name: 'home' })}
        onDone={() => {
          setRefreshKey((k) => k + 1);
          setScreen({ name: 'home' });
        }}
      />
    );
  }

  if (screen.name === 'count') {
    return (
      <CountScreen
        exerciseName={screen.exerciseName}
        onBack={() => setScreen({ name: 'home' })}
      />
    );
  }

  return (
    <HomeScreen
      refreshKey={refreshKey}
      onCreate={(exerciseName) =>
        setScreen({ name: 'calibrate', exerciseName })
      }
      onSelect={(exerciseName) => setScreen({ name: 'count', exerciseName })}
    />
  );
}
