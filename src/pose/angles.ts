import { PoseIndex, isLandmarkVisible } from './landmarks';
import { ANGLE_CHANNEL_NAMES, type AngleFrame, type PoseLandmark } from './types';

/**
 * Computes the interior angle at point B formed by points A–B–C, in radians.
 *
 * @param a - First endpoint
 * @param b - Vertex
 * @param c - Second endpoint
 * @returns Angle in radians in [0, π], or NaN if undefined
 */
export function angleAtJoint(
  a: PoseLandmark | undefined,
  b: PoseLandmark | undefined,
  c: PoseLandmark | undefined
): number {
  if (!a || !b || !c) {
    return Number.NaN;
  }
  if (!isLandmarkVisible(a) || !isLandmarkVisible(b) || !isLandmarkVisible(c)) {
    return Number.NaN;
  }

  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const baLen = Math.hypot(baX, baY);
  const bcLen = Math.hypot(bcX, bcY);
  if (baLen < 1e-6 || bcLen < 1e-6) {
    return Number.NaN;
  }

  const cos = (baX * bcX + baY * bcY) / (baLen * bcLen);
  return Math.acos(Math.max(-1, Math.min(1, cos)));
}

/**
 * Computes torso lean relative to vertical using mid-shoulder and mid-hip.
 * 0 ≈ upright; larger values mean more forward/back lean in the image plane.
 *
 * @param landmarks - Full 33-landmark pose
 */
export function torsoLeanAngle(landmarks: PoseLandmark[]): number {
  const ls = landmarks[PoseIndex.leftShoulder];
  const rs = landmarks[PoseIndex.rightShoulder];
  const lh = landmarks[PoseIndex.leftHip];
  const rh = landmarks[PoseIndex.rightHip];

  if (
    !isLandmarkVisible(ls) ||
    !isLandmarkVisible(rs) ||
    !isLandmarkVisible(lh) ||
    !isLandmarkVisible(rh)
  ) {
    return Number.NaN;
  }

  const midShoulderX = (ls.x + rs.x) / 2;
  const midShoulderY = (ls.y + rs.y) / 2;
  const midHipX = (lh.x + rh.x) / 2;
  const midHipY = (lh.y + rh.y) / 2;

  const dx = midShoulderX - midHipX;
  const dy = midShoulderY - midHipY;
  // Angle from vertical down-axis in image coords (y increases downward).
  return Math.atan2(Math.abs(dx), Math.abs(dy) + 1e-6);
}

/**
 * Builds a fixed-length joint-angle feature vector from a pose.
 * Missing/low-visibility joints become NaN and should be filled downstream.
 *
 * @param landmarks - MediaPipe landmarks for one person
 * @param timestampMs - Capture time in milliseconds
 */
export function extractAngleFrame(
  landmarks: PoseLandmark[],
  timestampMs: number = Date.now()
): AngleFrame {
  const angles = [
    angleAtJoint(
      landmarks[PoseIndex.leftShoulder],
      landmarks[PoseIndex.leftElbow],
      landmarks[PoseIndex.leftWrist]
    ),
    angleAtJoint(
      landmarks[PoseIndex.rightShoulder],
      landmarks[PoseIndex.rightElbow],
      landmarks[PoseIndex.rightWrist]
    ),
    angleAtJoint(
      landmarks[PoseIndex.leftElbow],
      landmarks[PoseIndex.leftShoulder],
      landmarks[PoseIndex.leftHip]
    ),
    angleAtJoint(
      landmarks[PoseIndex.rightElbow],
      landmarks[PoseIndex.rightShoulder],
      landmarks[PoseIndex.rightHip]
    ),
    angleAtJoint(
      landmarks[PoseIndex.leftShoulder],
      landmarks[PoseIndex.leftHip],
      landmarks[PoseIndex.leftKnee]
    ),
    angleAtJoint(
      landmarks[PoseIndex.rightShoulder],
      landmarks[PoseIndex.rightHip],
      landmarks[PoseIndex.rightKnee]
    ),
    angleAtJoint(
      landmarks[PoseIndex.leftHip],
      landmarks[PoseIndex.leftKnee],
      landmarks[PoseIndex.leftAnkle]
    ),
    angleAtJoint(
      landmarks[PoseIndex.rightHip],
      landmarks[PoseIndex.rightKnee],
      landmarks[PoseIndex.rightAnkle]
    ),
    torsoLeanAngle(landmarks),
  ];

  return { t: timestampMs, angles };
}

/**
 * Replaces NaN angles with the previous frame's values (or a default).
 *
 * @param current - Newly extracted frame
 * @param previous - Prior frame used for carry-forward fill
 * @param fallback - Value used when no previous sample exists
 */
export function fillMissingAngles(
  current: AngleFrame,
  previous: AngleFrame | null,
  fallback = Math.PI / 2
): AngleFrame {
  const angles = current.angles.map((value, index) => {
    if (!Number.isNaN(value)) {
      return value;
    }
    const prev = previous?.angles[index];
    return prev !== undefined && !Number.isNaN(prev) ? prev : fallback;
  });
  return { t: current.t, angles };
}

/**
 * Returns the number of angle channels in the feature vector.
 */
export function angleChannelCount(): number {
  return ANGLE_CHANNEL_NAMES.length;
}
