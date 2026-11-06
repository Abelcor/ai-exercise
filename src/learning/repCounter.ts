import type { AngleFrame, ExerciseProfile } from '../pose/types';
import { dtwDistance, resampleSequence } from './dtw';

/** Internal phases of a repetition cycle on the primary angle channel. */
export type RepPhase = 'idle' | 'leaving' | 'peak' | 'returning';

export interface RepCounterState {
  count: number;
  phase: RepPhase;
  /** Most recent DTW distance for debugging / confidence display. */
  lastDistance: number;
  /** True when the last evaluated candidate was accepted. */
  lastAccepted: boolean;
}

export interface RepCounterConfig {
  /** Minimum milliseconds between accepted reps. */
  cooldownMs: number;
  /** Fraction of calibrated amplitude that must be reached to enter peak. */
  peakFraction: number;
  /** Fraction of return toward rest required to complete a cycle. */
  returnFraction: number;
}

const DEFAULT_CONFIG: RepCounterConfig = {
  cooldownMs: 700,
  peakFraction: 0.7,
  returnFraction: 0.35,
};

/**
 * Real-time repetition counter that combines a primary-channel state machine
 * with DTW template matching for confidence gating.
 */
export class RepCounter {
  private readonly profile: ExerciseProfile;
  private readonly config: RepCounterConfig;
  private phase: RepPhase = 'idle';
  private count = 0;
  private lastCountAt = 0;
  private cycleFrames: AngleFrame[] = [];
  private lastDistance = Number.POSITIVE_INFINITY;
  private lastAccepted = false;
  private extremeReached = 0;

  /**
   * Creates a counter bound to a calibrated exercise profile.
   *
   * @param profile - Learned movement profile
   * @param config - Optional tuning overrides
   */
  constructor(profile: ExerciseProfile, config: Partial<RepCounterConfig> = {}) {
    this.profile = profile;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Resets the counter and internal state machine.
   */
  reset(): void {
    this.phase = 'idle';
    this.count = 0;
    this.lastCountAt = 0;
    this.cycleFrames = [];
    this.lastDistance = Number.POSITIVE_INFINITY;
    this.lastAccepted = false;
    this.extremeReached = 0;
  }

  /**
   * Returns a snapshot of the current counter state.
   */
  getState(): RepCounterState {
    return {
      count: this.count,
      phase: this.phase,
      lastDistance: this.lastDistance,
      lastAccepted: this.lastAccepted,
    };
  }

  /**
   * Ingests one angle frame and updates the repetition count when a confident
   * full cycle is recognized.
   *
   * @param frame - Latest joint-angle feature frame
   */
  update(frame: AngleFrame): RepCounterState {
    const { primaryChannel, restValue, peakValue, minAmplitude } = this.profile;
    const value = frame.angles[primaryChannel];
    const direction = peakValue >= restValue ? 1 : -1;
    const progress = direction * (value - restValue);
    const target = direction * (peakValue - restValue);
    const peakGate = target * this.config.peakFraction;
    const returnGate = target * this.config.returnFraction;

    if (this.phase === 'idle') {
      if (progress > minAmplitude * 0.25) {
        this.phase = 'leaving';
        this.cycleFrames = [frame];
        this.extremeReached = progress;
      }
      return this.getState();
    }

    this.cycleFrames.push(frame);
    this.extremeReached = Math.max(this.extremeReached, progress);

    if (this.phase === 'leaving') {
      if (progress >= peakGate) {
        this.phase = 'peak';
      } else if (progress < minAmplitude * 0.1) {
        // Abandoned movement — reset without counting.
        this.phase = 'idle';
        this.cycleFrames = [];
        this.extremeReached = 0;
      }
      return this.getState();
    }

    if (this.phase === 'peak') {
      if (progress <= returnGate) {
        this.phase = 'returning';
      }
      return this.getState();
    }

    // returning → decide whether to count
    if (progress <= Math.max(returnGate * 0.5, minAmplitude * 0.15)) {
      this.tryAcceptRep(frame.t);
      this.phase = 'idle';
      this.cycleFrames = [];
      this.extremeReached = 0;
    }

    return this.getState();
  }

  /**
   * Validates the captured cycle with amplitude + DTW confidence checks.
   *
   * @param nowMs - Timestamp of the completing frame
   */
  private tryAcceptRep(nowMs: number): void {
    this.lastAccepted = false;
    if (nowMs - this.lastCountAt < this.config.cooldownMs) {
      return;
    }
    if (this.extremeReached < this.profile.minAmplitude) {
      return;
    }
    if (this.cycleFrames.length < 8) {
      return;
    }

    const sequence = this.cycleFrames.map((f) => f.angles);
    const resampled = resampleSequence(sequence, this.profile.template.length);
    const distance = dtwDistance(
      this.profile.template,
      resampled,
      this.profile.channelWeights,
      0.45
    );
    this.lastDistance = distance;

    if (distance <= this.profile.dtwThreshold) {
      this.count += 1;
      this.lastCountAt = nowMs;
      this.lastAccepted = true;
    }
  }
}
