import { KnownPoseLandmarkConnections, KnownPoseLandmarks } from 'react-native-mediapipe-posedetection';
import type { PoseLandmark, ScreenPoint } from './types';

/**
 * Re-exports MediaPipe landmark indices for local use.
 */
export const PoseIndex = KnownPoseLandmarks;

/**
 * Skeleton bone pairs used when drawing the overlay.
 */
export const SKELETON_CONNECTIONS: number[][] = KnownPoseLandmarkConnections;

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
