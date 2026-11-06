import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { SKELETON_CONNECTIONS } from '../pose/landmarks';
import type { ScreenPoint } from '../pose/types';

export interface SkeletonOverlayProps {
  points: ScreenPoint[];
  width: number;
  height: number;
}

/**
 * Draws a basic stick-figure skeleton over the camera preview so pose tracking
 * can be visually verified during calibration and counting.
 */
export function SkeletonOverlay({
  points,
  width,
  height,
}: SkeletonOverlayProps): React.JSX.Element | null {
  if (points.length < 33 || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
      pointerEvents="none"
    >
      {SKELETON_CONNECTIONS.map(([a, b], index) => {
        const p1 = points[a];
        const p2 = points[b];
        if (!p1 || !p2) {
          return null;
        }
        return (
          <Line
            key={`bone-${index}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="#00FF66"
            strokeWidth={3}
          />
        );
      })}
      {points.map((point, index) => (
        <Circle
          key={`joint-${index}`}
          cx={point.x}
          cy={point.y}
          r={4}
          fill="#FF3300"
        />
      ))}
    </Svg>
  );
}
