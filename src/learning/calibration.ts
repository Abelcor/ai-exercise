import type { AngleFrame, ExerciseProfile } from '../pose/types';
import { angleChannelCount } from '../pose/angles';
import { dtwAverageOnto, dtwDistance, resampleSequence } from './dtw';

/** Default number of frames stored in the averaged template. */
const TEMPLATE_LENGTH = 32;

/** Target number of calibration repetitions to learn from. */
export const TARGET_CALIBRATION_REPS = 4;

/**
 * Smooths a 1D signal with a simple moving average.
 *
 * @param values - Raw samples
 * @param window - Odd window size
 */
function movingAverage(values: number[], window = 5): number[] {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j += 1) {
      if (j >= 0 && j < values.length) {
        sum += values[j];
        count += 1;
      }
    }
    return sum / count;
  });
}

/**
 * Computes per-channel variance across a recorded sequence.
 *
 * @param frames - Calibration angle frames
 */
export function computeChannelVariances(frames: AngleFrame[]): number[] {
  const channels = angleChannelCount();
  const means = new Array<number>(channels).fill(0);
  frames.forEach((frame) => {
    frame.angles.forEach((v, i) => {
      means[i] += v;
    });
  });
  means.forEach((_, i) => {
    means[i] /= Math.max(1, frames.length);
  });

  const variances = new Array<number>(channels).fill(0);
  frames.forEach((frame) => {
    frame.angles.forEach((v, i) => {
      const d = v - means[i];
      variances[i] += d * d;
    });
  });
  return variances.map((v) => v / Math.max(1, frames.length));
}

/**
 * Converts raw variances into normalized channel weights that sum to 1.
 *
 * @param variances - Per-channel variance values
 */
export function variancesToWeights(variances: number[]): number[] {
  const floor = 1e-6;
  const boosted = variances.map((v) => Math.max(v, floor));
  const sum = boosted.reduce((a, b) => a + b, 0);
  return boosted.map((v) => v / sum);
}

/**
 * Finds local extrema indices on a smoothed primary-channel signal.
 * Uses prominence relative to signal range to ignore noise.
 *
 * @param signal - Primary channel time series
 * @param findPeaks - True for peaks, false for valleys
 */
function findExtrema(signal: number[], findPeaks: boolean): number[] {
  if (signal.length < 5) {
    return [];
  }
  const min = Math.min(...signal);
  const max = Math.max(...signal);
  const range = Math.max(max - min, 1e-3);
  const prominence = range * 0.25;
  const indices: number[] = [];

  for (let i = 2; i < signal.length - 2; i += 1) {
    const v = signal[i];
    const left = signal[i - 1];
    const right = signal[i + 1];
    const isExtrema = findPeaks
      ? v >= left && v >= right && v >= signal[i - 2] && v >= signal[i + 2]
      : v <= left && v <= right && v <= signal[i - 2] && v <= signal[i + 2];
    if (!isExtrema) {
      continue;
    }
    if (findPeaks && v - min < prominence) {
      continue;
    }
    if (!findPeaks && max - v < prominence) {
      continue;
    }
    indices.push(i);
  }
  return indices;
}

/**
 * Segments a continuous calibration recording into individual repetition windows
 * by detecting cycles on the highest-variance angle channel.
 *
 * @param frames - Full calibration recording
 * @param primaryChannel - Index of the dominant angle channel
 * @returns Array of per-rep angle sequences
 */
export function segmentRepetitions(
  frames: AngleFrame[],
  primaryChannel: number
): number[][][] {
  const signal = movingAverage(
    frames.map((f) => f.angles[primaryChannel]),
    5
  );
  const startMean = signal.slice(0, Math.min(8, signal.length)).reduce((a, b) => a + b, 0) /
    Math.max(1, Math.min(8, signal.length));
  const max = Math.max(...signal);
  const min = Math.min(...signal);
  const peaksUp = max - startMean >= startMean - min;

  const extrema = findExtrema(signal, peaksUp);
  if (extrema.length < 2) {
    // Fallback: split recording into equal chunks if peak detection fails.
    const chunks = Math.min(TARGET_CALIBRATION_REPS, Math.max(1, Math.floor(frames.length / 12)));
    const size = Math.floor(frames.length / chunks);
    const reps: number[][][] = [];
    for (let c = 0; c < chunks; c += 1) {
      const slice = frames.slice(c * size, (c + 1) * size).map((f) => [...f.angles]);
      if (slice.length >= 6) {
        reps.push(slice);
      }
    }
    return reps;
  }

  const reps: number[][][] = [];
  // Use valleys (or opposite extrema) as cycle boundaries when available.
  const boundaries = findExtrema(signal, !peaksUp);
  const ends = boundaries.length >= 2 ? boundaries : extrema;

  for (let i = 0; i < ends.length - 1; i += 1) {
    const start = ends[i];
    const end = ends[i + 1];
    if (end - start < 6) {
      continue;
    }
    reps.push(frames.slice(start, end + 1).map((f) => [...f.angles]));
  }

  return reps;
}

/**
 * Builds an ExerciseProfile from a calibration recording of ~3–5 reps.
 *
 * @param name - User-defined exercise name
 * @param frames - Continuous angle frames captured during calibration
 */
export function buildExerciseProfile(
  name: string,
  frames: AngleFrame[]
): ExerciseProfile {
  if (frames.length < 20) {
    throw new Error('Not enough calibration frames. Perform slower, fuller repetitions.');
  }

  const variances = computeChannelVariances(frames);
  const channelWeights = variancesToWeights(variances);
  const primaryChannel = variances.indexOf(Math.max(...variances));
  const reps = segmentRepetitions(frames, primaryChannel);

  if (reps.length < 2) {
    throw new Error('Could not detect at least 2 repetitions during calibration.');
  }

  const usable = reps.slice(0, Math.min(TARGET_CALIBRATION_REPS + 1, reps.length));
  const resampled = usable.map((rep) => resampleSequence(rep, TEMPLATE_LENGTH));

  let template = resampled[0].map((frame) => [...frame]);
  for (let i = 1; i < resampled.length; i += 1) {
    const aligned = dtwAverageOnto(template, resampled[i], channelWeights);
    template = template.map((frame, t) =>
      frame.map((v, c) => (v + aligned[t][c]) / 2)
    );
  }

  const distances = resampled.map((rep) =>
    dtwDistance(template, rep, channelWeights, 0.4)
  );
  const meanDist =
    distances.reduce((a, b) => a + b, 0) / Math.max(1, distances.length);
  const maxDist = Math.max(...distances);
  // Confidence threshold: allow some slack above the worst calibration match.
  const dtwThreshold = Math.max(meanDist * 2.2, maxDist * 1.35, 0.08);

  const primarySeries = frames.map((f) => f.angles[primaryChannel]);
  const restValue = primarySeries.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
  const peakValue =
    Math.abs(Math.max(...primarySeries) - restValue) >=
    Math.abs(Math.min(...primarySeries) - restValue)
      ? Math.max(...primarySeries)
      : Math.min(...primarySeries);
  const minAmplitude = Math.abs(peakValue - restValue) * 0.55;

  return {
    name: name.trim(),
    template,
    channelWeights,
    dtwThreshold,
    minAmplitude,
    primaryChannel,
    restValue,
    peakValue,
  };
}

/**
 * Estimates how many complete reps have been observed so far in a live
 * calibration recording (for UI progress feedback).
 *
 * @param frames - Frames captured so far
 */
export function estimateCalibrationRepCount(frames: AngleFrame[]): number {
  if (frames.length < 15) {
    return 0;
  }
  const variances = computeChannelVariances(frames);
  const primaryChannel = variances.indexOf(Math.max(...variances));
  return segmentRepetitions(frames, primaryChannel).length;
}
