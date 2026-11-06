/**
 * Shared pose and learning types used across the exercise counter.
 */

/** A single MediaPipe pose landmark in normalized image coordinates. */
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

/** Fixed channel names for the joint-angle feature vector. */
export const ANGLE_CHANNEL_NAMES = [
  'leftElbow',
  'rightElbow',
  'leftShoulder',
  'rightShoulder',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'torsoLean',
] as const;

export type AngleChannelName = (typeof ANGLE_CHANNEL_NAMES)[number];

/** One frame of joint angles extracted from a pose. */
export interface AngleFrame {
  /** Milliseconds since Unix epoch when the frame was captured. */
  t: number;
  /** Joint angles in radians, ordered by ANGLE_CHANNEL_NAMES. */
  angles: number[];
}

/** Screen-space point used for skeleton overlay rendering. */
export interface ScreenPoint {
  x: number;
  y: number;
}

/** Learned movement profile for a user-defined exercise. */
export interface ExerciseProfile {
  name: string;
  /** Averaged template sequence: T frames × C angle channels. */
  template: number[][];
  /** Per-channel importance weights derived from calibration variance. */
  channelWeights: number[];
  /** Maximum DTW distance accepted as a matching repetition. */
  dtwThreshold: number;
  /** Minimum primary-channel amplitude required to count a rep. */
  minAmplitude: number;
  /** Index of the highest-variance angle channel. */
  primaryChannel: number;
  /** Resting (start) value of the primary channel. */
  restValue: number;
  /** Peak value of the primary channel during a completed rep. */
  peakValue: number;
}

/** Navigation routes used by the simple screen switcher. */
export type AppScreen =
  | { name: 'home' }
  | { name: 'calibrate'; exerciseName: string }
  | { name: 'count'; exerciseName: string };
