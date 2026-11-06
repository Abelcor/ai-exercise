/**
 * Multivariate Dynamic Time Warping helpers for comparing angle sequences
 * performed at different speeds.
 */

/**
 * Weighted Euclidean distance between two angle feature vectors.
 *
 * @param a - First feature vector
 * @param b - Second feature vector
 * @param weights - Per-channel importance weights
 */
export function weightedEuclidean(
  a: number[],
  b: number[],
  weights: number[]
): number {
  let sum = 0;
  const n = Math.min(a.length, b.length, weights.length);
  for (let i = 0; i < n; i += 1) {
    const d = a[i] - b[i];
    sum += weights[i] * d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Computes the DTW distance between two multivariate sequences.
 * Uses a classic DP table with optional Sakoe-Chiba band for speed.
 *
 * @param seqA - Sequence A as T×C frames
 * @param seqB - Sequence B as T×C frames
 * @param weights - Channel weights for the local cost
 * @param bandRatio - Band width as a fraction of max(lenA, lenB); 1 = full
 * @returns Normalized DTW distance (path cost / path length)
 */
export function dtwDistance(
  seqA: number[][],
  seqB: number[][],
  weights: number[],
  bandRatio = 1
): number {
  const n = seqA.length;
  const m = seqB.length;
  if (n === 0 || m === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const band = Math.max(1, Math.floor(Math.max(n, m) * bandRatio));
  const INF = Number.POSITIVE_INFINITY;
  const prev = new Array<number>(m + 1).fill(INF);
  const curr = new Array<number>(m + 1).fill(INF);
  prev[0] = 0;

  for (let i = 1; i <= n; i += 1) {
    curr.fill(INF);
    const jStart = Math.max(1, i - band);
    const jEnd = Math.min(m, i + band);
    for (let j = jStart; j <= jEnd; j += 1) {
      const cost = weightedEuclidean(seqA[i - 1], seqB[j - 1], weights);
      curr[j] = cost + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    for (let j = 0; j <= m; j += 1) {
      prev[j] = curr[j];
    }
  }

  const pathCost = prev[m];
  // Normalize by approximate path length so long sequences are comparable.
  return pathCost / (n + m);
}

/**
 * Warps sequence `source` onto the time axis of `target` using the DTW path,
 * then returns the averaged sequence (used to build a calibration template).
 *
 * @param target - Reference sequence defining output length
 * @param source - Sequence to align onto the target
 * @param weights - Channel weights for local cost
 */
export function dtwAverageOnto(
  target: number[][],
  source: number[][],
  weights: number[]
): number[][] {
  const n = target.length;
  const m = source.length;
  if (n === 0) {
    return [];
  }
  if (m === 0) {
    return target.map((frame) => [...frame]);
  }

  const INF = Number.POSITIVE_INFINITY;
  const cost: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(INF)
  );
  cost[0][0] = 0;

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const local = weightedEuclidean(target[i - 1], source[j - 1], weights);
      cost[i][j] =
        local + Math.min(cost[i - 1][j], cost[i][j - 1], cost[i - 1][j - 1]);
    }
  }

  // Backtrack path and accumulate source frames mapped onto each target index.
  const accum: number[][] = Array.from({ length: n }, () =>
    new Array<number>(target[0].length).fill(0)
  );
  const counts = new Array<number>(n).fill(0);

  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    for (let c = 0; c < source[j - 1].length; c += 1) {
      accum[i - 1][c] += source[j - 1][c];
    }
    counts[i - 1] += 1;

    const a = cost[i - 1][j];
    const b = cost[i][j - 1];
    const diag = cost[i - 1][j - 1];
    if (diag <= a && diag <= b) {
      i -= 1;
      j -= 1;
    } else if (a <= b) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  return accum.map((frame, idx) => {
    if (counts[idx] === 0) {
      return [...target[idx]];
    }
    return frame.map((v) => v / counts[idx]);
  });
}

/**
 * Resamples a sequence to a fixed number of frames via linear interpolation.
 *
 * @param sequence - Input T×C sequence
 * @param targetLength - Desired output frame count
 */
export function resampleSequence(
  sequence: number[][],
  targetLength: number
): number[][] {
  if (sequence.length === 0 || targetLength <= 0) {
    return [];
  }
  if (sequence.length === 1) {
    return Array.from({ length: targetLength }, () => [...sequence[0]]);
  }

  const channels = sequence[0].length;
  const result: number[][] = [];
  for (let t = 0; t < targetLength; t += 1) {
    const pos = (t / (targetLength - 1)) * (sequence.length - 1);
    const i0 = Math.floor(pos);
    const i1 = Math.min(sequence.length - 1, i0 + 1);
    const frac = pos - i0;
    const frame = new Array<number>(channels);
    for (let c = 0; c < channels; c += 1) {
      frame[c] = sequence[i0][c] * (1 - frac) + sequence[i1][c] * frac;
    }
    result.push(frame);
  }
  return result;
}
