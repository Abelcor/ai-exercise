import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PoseCamera } from '../camera/PoseCamera';
import { SimpleButton, SimpleControls } from '../components/SimpleControls';
import { getExerciseProfile } from '../learning/exerciseStore';
import { RepCounter } from '../learning/repCounter';
import type { AngleFrame } from '../pose/types';

export interface CountScreenProps {
  exerciseName: string;
  onBack: () => void;
}

/**
 * Live counting screen: compares detected movement against the calibrated
 * profile and increments the repetition counter on confident full cycles.
 */
export function CountScreen({
  exerciseName,
  onBack,
}: CountScreenProps): React.JSX.Element {
  const profile = useMemo(
    () => getExerciseProfile(exerciseName),
    [exerciseName]
  );
  const counterRef = useRef<RepCounter | null>(null);
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      counterRef.current = new RepCounter(profile);
      setCount(0);
      setPhase('idle');
      setDistance(null);
      setActive(false);
    }
  }, [profile]);

  /**
   * Feeds live angle frames into the repetition counter while active.
   */
  const handleAngleFrame = useCallback(
    (frame: AngleFrame) => {
      if (!active || !counterRef.current) {
        return;
      }
      const state = counterRef.current.update(frame);
      setCount(state.count);
      setPhase(state.phase);
      if (Number.isFinite(state.lastDistance)) {
        setDistance(state.lastDistance);
      }
    },
    [active]
  );

  /**
   * Starts or resumes automatic counting.
   */
  const handleStart = () => {
    if (!counterRef.current && profile) {
      counterRef.current = new RepCounter(profile);
    }
    setActive(true);
  };

  /**
   * Pauses counting without clearing the total.
   */
  const handleStop = () => {
    setActive(false);
  };

  /**
   * Clears the repetition total and state machine.
   */
  const handleReset = () => {
    counterRef.current?.reset();
    setCount(0);
    setPhase('idle');
    setDistance(null);
  };

  if (!profile) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>
          No profile found for "{exerciseName}". Calibrate it first.
        </Text>
        <SimpleButton label="Back" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>{profile.name}</Text>
        <Text style={styles.count}>Reps: {count}</Text>
        <Text style={styles.meta}>
          {active ? `Tracking (${phase})` : 'Paused'}
          {distance !== null ? `  dtw=${distance.toFixed(3)}` : ''}
        </Text>
      </View>

      <PoseCamera
        style={styles.camera}
        cameraPosition="front"
        isActive
        onAngleFrame={handleAngleFrame}
      />

      <SimpleControls>
        <SimpleButton label="Back" onPress={onBack} />
        <SimpleButton
          label={active ? 'Stop' : 'Start'}
          onPress={active ? handleStop : handleStart}
        />
        <SimpleButton label="Reset" onPress={handleReset} />
      </SimpleControls>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#111',
  },
  title: {
    color: '#fff',
    fontSize: 18,
  },
  count: {
    color: '#fff',
    fontSize: 32,
    marginTop: 4,
  },
  meta: {
    color: '#aaa',
    marginTop: 2,
    fontSize: 13,
  },
  camera: {
    flex: 1,
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 16,
  },
  missingText: {
    fontSize: 16,
  },
});
