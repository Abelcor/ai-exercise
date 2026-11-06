import type { ExerciseProfile } from '../pose/types';

/**
 * In-memory store for calibrated exercise profiles.
 * Profiles are intentionally not persisted; recalibration after restart is OK.
 */
const profiles = new Map<string, ExerciseProfile>();

/**
 * Saves or replaces an exercise profile by name.
 *
 * @param profile - Profile produced by calibration
 */
export function saveExerciseProfile(profile: ExerciseProfile): void {
  profiles.set(profile.name.trim().toLowerCase(), profile);
}

/**
 * Looks up a previously calibrated exercise by display name.
 *
 * @param name - Exercise name entered by the user
 */
export function getExerciseProfile(name: string): ExerciseProfile | undefined {
  return profiles.get(name.trim().toLowerCase());
}

/**
 * Lists all stored exercise display names.
 */
export function listExerciseNames(): string[] {
  return Array.from(profiles.values()).map((p) => p.name);
}

/**
 * Removes all stored profiles (useful when resetting the prototype session).
 */
export function clearExerciseProfiles(): void {
  profiles.clear();
}
