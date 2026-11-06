import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PoseCamera } from '../camera/PoseCamera';
import { SimpleButton, SimpleControls } from '../components/SimpleControls';
import {
  TARGET_CALIBRATION_REPS,
  buildExerciseProfile,
  estimateCalibrationRepCount,
} from '../learning/calibration';
import { saveExerciseProfile } from '../learning/exerciseStore';
import type { AngleFrame } from '../pose/types';

export interface CalibrateScreenProps {
  exerciseName: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Records camera pose samples while the user demonstrates an exercise,
 * then builds and stores a DTW movement profile.
 */
export function CalibrateScreen({
  exerciseName,
  onDone,
  onCancel,
}: CalibrateScreenProps): React.JSX.Element {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('Stand in frame, then press Start.');
  const [repEstimate, setRepEstimate] = useState(0);
  const framesRef = useRef<AngleFrame[]>([]);

  /**
   * Appends angle frames while recording is active.
   */
  const handleAngleFrame = useCallback(
    (frame: AngleFrame) => {
      if (!recording) {
        return;
      }
      framesRef.current.push(frame);
      if (framesRef.current.length % 8 === 0) {
        setRepEstimate(estimateCalibrationRepCount(framesRef.current));
      }
    },
    [recording]
  );

  /**
   * Begins capturing calibration frames.
   */
  const handleStart = () => {
    framesRef.current = [];
    setRepEstimate(0);
    setRecording(true);
    setStatus(`Perform ${TARGET_CALIBRATION_REPS} slow, full repetitions…`);
  };

  /**
   * Stops recording and attempts to build a movement profile.
   */
  const handleFinish = () => {
    setRecording(false);
    try {
      const profile = buildExerciseProfile(exerciseName, framesRef.current);
      saveExerciseProfile(profile);
      setStatus(
        `Saved "${profile.name}" (threshold ${profile.dtwThreshold.toFixed(3)}).`
      );
      onDone();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Calibration failed.';
      setStatus(message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Calibrate: {exerciseName}</Text>
        <Text style={styles.meta}>
          {recording ? `Recording… est. reps ${repEstimate}/${TARGET_CALIBRATION_REPS}` : status}
        </Text>
      </View>

      <PoseCamera
        style={styles.camera}
        cameraPosition="front"
        isActive
        onAngleFrame={handleAngleFrame}
      />

      <SimpleControls>
        <SimpleButton label="Back" onPress={onCancel} />
        <SimpleButton
          label={recording ? 'Recording…' : 'Start'}
          onPress={handleStart}
          disabled={recording}
        />
        <SimpleButton
          label="Finish"
          onPress={handleFinish}
          disabled={!recording && framesRef.current.length === 0}
        />
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
  meta: {
    color: '#ccc',
    marginTop: 4,
    fontSize: 13,
  },
  camera: {
    flex: 1,
  },
});
