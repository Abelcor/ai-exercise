import type { PoseLandmark, ScreenPoint } from './types';

/**
 * MediaPipe Pose Landmarker landmark indices (BlazePose 33-point topology).
 * Kept local so non-camera modules do not import the native MediaPipe package.
 */
export const PoseIndex = {
  nose: 0,
  leftEyeInner: 1,
  leftEye: 2,
  leftEyeOuter: 3,
  rightEyeInner: 4,
  rightEye: 5,
  rightEyeOuter: 6,
  leftEar: 7,
  rightEar: 8,
  mouthLeft: 9,
  mouthRight: 10,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftPinky: 17,
  rightPinky: 18,
  leftIndex: 19,
  rightIndex: 20,
  leftThumb: 21,
  rightThumb: 22,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
} as const;

/**
 * Skeleton bone pairs used when drawing the overlay.
 */
export const SKELETON_CONNECTIONS: number[][] = [
  [0, 5],
  [5, 8],
  [0, 2],
  [2, 7],
  [9, 10],
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [15, 21],
  [12, 14],
  [14, 16],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [27, 29],
  [27, 31],
  [29, 31],
  [26, 28],
  [28, 30],
  [28, 32],
  [30, 32],
];

/**
 * Extracts the first detected person's 33 landmarks from a pose result.
 *
 * @param poses - MediaPipe landmarks array: [person][landmarkIndex]
 * @returns Flat landmark list, or null when no pose is present
 */
export function getFirstPoseLandmarks(
  poses: PoseLandmark[][] | undefined
): PoseLandmark[] | null {
  if (!poses || poses.length === 0) {
    return null;
  }
  const landmarks = poses[0];
  if (!landmarks || landmarks.length < 33) {
    return null;
  }
  return landmarks;
}

/**
 * Converts normalized landmarks into view coordinates for overlay drawing.
 * Uses a simple cover-style mapping that mirrors when using the front camera.
 *
 * @param landmarks - Normalized MediaPipe landmarks (0–1)
 * @param viewWidth - Camera preview width in pixels
 * @param viewHeight - Camera preview height in pixels
 * @param mirrored - Whether the preview is mirrored (typical for front camera)
 */
export function landmarksToScreenPoints(
  landmarks: PoseLandmark[],
  viewWidth: number,
  viewHeight: number,
  mirrored: boolean
): ScreenPoint[] {
  return landmarks.map((lm) => {
    const nx = mirrored ? 1 - lm.x : lm.x;
    return {
      x: nx * viewWidth,
      y: lm.y * viewHeight,
    };
  });
}

/**
 * Returns true when a landmark is visible enough to trust for angle math.
 *
 * @param landmark - Landmark to inspect
 * @param minVisibility - Minimum visibility score (0–1)
 */
export function isLandmarkVisible(
  landmark: PoseLandmark | undefined,
  minVisibility = 0.4
): boolean {
  if (!landmark) {
    return false;
  }
  if (landmark.visibility === undefined) {
    return true;
  }
  return landmark.visibility >= minVisibility;
}
