import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  Delegate,
  RunningMode,
  usePoseDetection,
  type PoseDetectionResultBundle,
  type ViewCoordinator,
} from 'react-native-mediapipe-posedetection';
import { SkeletonOverlay } from './SkeletonOverlay';
import { extractAngleFrame, fillMissingAngles } from '../pose/angles';
import {
  getFirstPoseLandmarks,
  landmarksToScreenPoints,
} from '../pose/landmarks';
import type { AngleFrame, PoseLandmark, ScreenPoint } from '../pose/types';

const MODEL_FILE = 'pose_landmarker_lite.task';

export interface PoseCameraProps {
  /** Called whenever a valid angle frame is produced from pose landmarks. */
  onAngleFrame?: (frame: AngleFrame) => void;
  /** Called with raw landmarks for optional consumers. */
  onLandmarks?: (landmarks: PoseLandmark[]) => void;
  /** Front camera is mirrored for self-view exercise coaching. */
  cameraPosition?: 'front' | 'back';
  style?: StyleProp<ViewStyle>;
  /** When false, the native camera session pauses. */
  isActive?: boolean;
}

/**
 * Camera preview with MediaPipe Pose Landmarker frame processing and a live
 * skeleton overlay. Emits joint-angle frames for calibration / counting.
 */
export function PoseCamera({
  onAngleFrame,
  onLandmarks,
  cameraPosition = 'front',
  style,
  isActive = true,
}: PoseCameraProps): React.JSX.Element {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(cameraPosition);
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const [screenPoints, setScreenPoints] = useState<ScreenPoint[]>([]);
  const previousAnglesRef = React.useRef<AngleFrame | null>(null);
  const onAngleFrameRef = React.useRef(onAngleFrame);
  const onLandmarksRef = React.useRef(onLandmarks);

  useEffect(() => {
    onAngleFrameRef.current = onAngleFrame;
    onLandmarksRef.current = onLandmarks;
  }, [onAngleFrame, onLandmarks]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const mirrored = cameraPosition === 'front';

  /**
   * Handles MediaPipe pose results: updates overlay points and emits angles.
   */
  const handleResults = useCallback(
    (bundle: PoseDetectionResultBundle, _vc: ViewCoordinator) => {
      // Native module emits results[0].landmarks[person]; tolerate flattened shapes.
      const nested = bundle.results?.[0]?.landmarks;
      const flat = (bundle as { landmarks?: PoseLandmark[][] }).landmarks;
      const landmarks =
        getFirstPoseLandmarks(nested) ?? getFirstPoseLandmarks(flat);
      if (!landmarks) {
        setScreenPoints([]);
        return;
      }

      onLandmarksRef.current?.(landmarks);

      if (viewSize.width > 0 && viewSize.height > 0) {
        setScreenPoints(
          landmarksToScreenPoints(
            landmarks,
            viewSize.width,
            viewSize.height,
            mirrored
          )
        );
      }

      const raw = extractAngleFrame(landmarks, Date.now());
      const filled = fillMissingAngles(raw, previousAnglesRef.current);
      previousAnglesRef.current = filled;
      onAngleFrameRef.current?.(filled);
    },
    [mirrored, viewSize.height, viewSize.width]
  );

  const [poseError, setPoseError] = useState<string | null>(null);

  const handleError = useCallback((error: { message: string }) => {
    console.warn('[PoseCamera]', error.message);
    setPoseError(error.message);
  }, []);

  // CPU is more stable across Android devices than the MediaPipe GPU delegate.
  const pose = usePoseDetection(
    {
      onResults: handleResults,
      onError: handleError,
    },
    RunningMode.LIVE_STREAM,
    MODEL_FILE,
    {
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      delegate: Delegate.CPU,
      mirrorMode: 'mirror-front-only',
      fpsMode: 12,
    }
  );

  useEffect(() => {
    pose.cameraDeviceChangeHandler(device);
  }, [device, pose]);

  /**
   * Tracks the preview layout so overlay coordinates match the camera view.
   */
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setViewSize({ width, height });
      pose.cameraViewLayoutChangeHandler(event);
    },
    [pose]
  );

  const status = useMemo(() => {
    if (poseError) {
      return `Pose detection error: ${poseError}`;
    }
    if (!hasPermission) {
      return 'Camera permission required — allow camera access and reopen.';
    }
    if (!device) {
      return 'Loading camera…';
    }
    return null;
  }, [device, hasPermission, poseError]);

  if (status) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.status}>{status}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device!}
        isActive={isActive}
        pixelFormat="rgb"
        frameProcessor={pose.frameProcessor}
        onOutputOrientationChanged={pose.cameraOrientationChangedHandler}
        resizeMode="cover"
      />
      <SkeletonOverlay
        points={screenPoints}
        width={viewSize.width}
        height={viewSize.height}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  status: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
  },
});
